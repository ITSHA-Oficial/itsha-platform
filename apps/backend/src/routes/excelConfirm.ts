import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.post('/:importId', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { importId } = req.params;
    const { replace } = req.body; // true si el usuario marcó "Reemplazar catálogo completo"

    // Obtener el diff almacenado
    const { data: importData, error: importError } = await supabase
      .from('temporary_imports')
      .select('tenant_id, diff_data')
      .eq('id', importId)
      .single();

    if (importError || !importData) {
      return res.status(404).json({
        error: { code: 'IMPORT_NOT_FOUND', message: 'La importación no existe o ha expirado.' }
      });
    }

    const tenantId = importData.tenant_id;
    const diff = importData.diff_data;

    // Si se solicita reemplazo, eliminar (soft delete) todos los productos activos del tenant
    if (replace === true) {
      // Soft delete para productos, features, attributes, variants, variant_attributes, product_images
      const tables = ['product_images', 'variant_attributes', 'variants', 'attributes', 'features', 'products'];
      for (const table of tables) {
        await supabase
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .is('deleted_at', null);
      }
    }

    let productsAdded = 0;
    let productsUpdated = 0;

    // Procesar productos del Excel
    for (const product of (diff.products || [])) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('sku', product.sku)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .maybeSingle();

      if (existingProduct) {
        // Actualizar producto existente
        await supabase
          .from('products')
          .update({
            name: product.name,
            description: product.description,
            pricing_mode: product.pricing_mode,
            display_price_mode: product.display_price_mode,
            is_active: product.is_active
          })
          .eq('id', existingProduct.id);
        productsUpdated++;
      } else {
        // Crear nuevo producto
        await supabase
          .from('products')
          .insert({
            tenant_id: tenantId,
            sku: product.sku,
            name: product.name,
            description: product.description,
            pricing_mode: product.pricing_mode,
            display_price_mode: product.display_price_mode,
            is_active: product.is_active
          });
        productsAdded++;
      }
    }

    // Limpiar el temporary_import
    await supabase
      .from('temporary_imports')
      .delete()
      .eq('id', importId);

    const message = replace
      ? `Catálogo reemplazado. ${productsAdded} productos creados, ${productsUpdated} actualizados.`
      : `Importación aplicada. ${productsAdded} productos creados, ${productsUpdated} actualizados.`;

    return res.json({
      status: 'confirmed',
      message,
      products_added: productsAdded,
      products_updated: productsUpdated
    });
  } catch (err: any) {
    console.error('Error en POST /excel/confirm:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;