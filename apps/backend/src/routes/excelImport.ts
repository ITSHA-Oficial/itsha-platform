import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';
import * as XLSX from 'xlsx';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({
        error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere el header X-Tenant-Slug.' }
      });
    }

    const supabase = getSupabaseClient();
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: { code: 'NO_FILE', message: 'No se ha subido ningún archivo.' }
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

    // Leer hojas
    const productsSheet = workbook.Sheets['Products'];
    const featuresSheet = workbook.Sheets['Features'];
    const attributesSheet = workbook.Sheets['Attributes'];
    const variantsSheet = workbook.Sheets['Variants'];

    if (!productsSheet) {
      return res.status(422).json({
        error: { code: 'MISSING_SHEET', message: 'El archivo debe contener al menos la hoja "Products".' }
      });
    }

    const excelProducts: any[] = XLSX.utils.sheet_to_json(productsSheet);
    const excelFeatures: any[] = featuresSheet ? XLSX.utils.sheet_to_json(featuresSheet) : [];
    const excelAttributes: any[] = attributesSheet ? XLSX.utils.sheet_to_json(attributesSheet) : [];
    const excelVariants: any[] = variantsSheet ? XLSX.utils.sheet_to_json(variantsSheet) : [];

    // Obtener productos actuales de la BD
    const { data: currentProducts } = await supabase
      .from('products')
      .select('id, sku, name')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    const currentSkus = new Set((currentProducts || []).map(p => p.sku));

    // Construir diff detallado
    const diff: any = {
      products: excelProducts.map(row => ({
        sku: row.sku,
        name: row.name || row.sku,
        description: row.description || null,
        category_slug: row.category_slug || null,
        pricing_mode: row.pricing_mode || 'explicit_variant',
        display_price_mode: row.display_price_mode || 'hidden',
        is_active: row.is_active !== undefined ? row.is_active : true,
        status: currentSkus.has(row.sku) ? 'updated' : 'new'
      })),
      features: excelFeatures.map(row => ({
        product_sku: row.product_sku,
        name: row.name,
        sort_order: row.sort_order || 0,
        status: 'new'
      })),
      attributes: excelAttributes.map(row => ({
        feature_name: row.feature_name,
        product_sku: row.product_sku,
        value: row.value,
        sort_order: row.sort_order || 0,
        status: 'new'
      })),
      variants: excelVariants.map(row => {
        // Construir atributos de variante a partir de columnas dinámicas
        const attributes: Record<string, string> = {};
        Object.keys(row).forEach(key => {
          if (!['product_sku', 'sku_variant', 'price', 'min_quantity'].includes(key)) {
            attributes[key] = row[key];
          }
        });
        return {
          product_sku: row.product_sku,
          sku_variant: row.sku_variant || null,
          price: parseFloat(row.price) || 0,
          min_quantity: parseInt(row.min_quantity) || 1,
          attributes,
          status: 'new'
        };
      }),
      products_count: excelProducts.length,
      features_count: excelFeatures.length,
      attributes_count: excelAttributes.length,
      variants_count: excelVariants.length
    };

    // Guardar diff en temporary_imports
    const { data: importRecord, error: importError } = await supabase
      .from('temporary_imports')
      .insert({
        tenant_id: tenant.id,
        diff_data: diff,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })
      .select('id')
      .single();

    if (importError) throw importError;

    return res.json({
      import_id: importRecord.id,
      status: 'preview',
      diff: {
        products_added: diff.products.filter((p: any) => p.status === 'new').map((p: any) => p.name),
        products_updated: diff.products.filter((p: any) => p.status === 'updated').map((p: any) => ({ sku: p.sku, changes: { name: p.name } })),
        products_deactivated: [],
        variants_added: diff.variants_count,
        variants_updated: 0,
        variants_deleted: 0,
        features_count: diff.features_count,
        attributes_count: diff.attributes_count
      }
    });
  } catch (err: any) {
    console.error('Error en POST /excel/import:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;