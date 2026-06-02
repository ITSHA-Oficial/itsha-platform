import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';
import * as XLSX from 'xlsx';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();

    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({
        error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere el header X-Tenant-Slug.' }
      });
    }

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

    const { data: products } = await supabase
      .from('products')
      .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, price_formula, is_active')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    const { data: features } = await supabase
      .from('features')
      .select('id, product_id, name, sort_order')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    const { data: attributes } = await supabase
      .from('attributes')
      .select('id, feature_id, value, sort_order')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    const { data: variants } = await supabase
      .from('variants')
      .select('id, product_id, sku_variant, variant_signature, price, min_quantity, is_active')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    const { data: formulas } = await supabase
      .from('products')
      .select('id, sku, name, price_formula, formula_vars')
      .eq('tenant_id', tenant.id)
      .eq('pricing_mode', 'dynamic_formula')
      .is('deleted_at', null);

    const wb = XLSX.utils.book_new();

    if (products && products.length > 0) {
      const wsProducts = XLSX.utils.json_to_sheet(products);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
    }

    if (features && features.length > 0) {
      const wsFeatures = XLSX.utils.json_to_sheet(features);
      XLSX.utils.book_append_sheet(wb, wsFeatures, 'Features');
    }

    if (attributes && attributes.length > 0) {
      const wsAttributes = XLSX.utils.json_to_sheet(attributes);
      XLSX.utils.book_append_sheet(wb, wsAttributes, 'Attributes');
    }

    if (variants && variants.length > 0) {
      const wsVariants = XLSX.utils.json_to_sheet(variants);
      XLSX.utils.book_append_sheet(wb, wsVariants, 'Variants');
    }

    if (formulas && formulas.length > 0) {
      const wsFormulas = XLSX.utils.json_to_sheet(formulas);
      XLSX.utils.book_append_sheet(wb, wsFormulas, 'Formulas');
    }

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="catalogo_maestro.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(excelBuffer);
  } catch (err: any) {
    console.error('Error en GET /excel/export:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;