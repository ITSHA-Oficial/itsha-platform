import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.post('/:importId', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { importId } = req.params;
    const { replace } = req.body;

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
    let featuresAdded = 0;
    let variantsAdded = 0;

    // Procesar productos
    for (const product of (diff.products || [])) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, category_id')
        .eq('sku', product.sku)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .maybeSingle();

      let productId: string;

      // Resolver category_id desde category_slug
      let categoryId: string | null = null;
      if (product.category_slug) {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('slug', product.category_slug)
          .is('deleted_at', null)
          .maybeSingle();

        if (catData) {
          categoryId = catData.id;
        } else {
          // Crear la categoría si no existe
          const { data: newCat } = await supabase
            .from('categories')
            .insert({
              tenant_id: tenantId,
              name: product.category_slug.charAt(0).toUpperCase() + product.category_slug.slice(1).replace(/-/g, ' '),
              slug: product.category_slug,
              sort_order: 99
            })
            .select('id')
            .single();
          categoryId = newCat?.id || null;
        }
      }

      if (existingProduct) {
        productId = existingProduct.id;
        await supabase
          .from('products')
          .update({
            name: product.name,
            description: product.description,
            pricing_mode: product.pricing_mode,
            display_price_mode: product.display_price_mode,
            is_active: product.is_active,
            category_id: categoryId || existingProduct.category_id
          })
          .eq('id', existingProduct.id);
        productsUpdated++;
      } else {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            tenant_id: tenantId,
            sku: product.sku,
            name: product.name,
            description: product.description,
            pricing_mode: product.pricing_mode,
            display_price_mode: product.display_price_mode,
            is_active: product.is_active,
            category_id: categoryId
          })
          .select('id')
          .single();
        productId = newProduct?.id || '';
        productsAdded++;
      }

      // Procesar features para este producto (por SKU)
      const productFeatures = (diff.features || []).filter((f: any) => f.product_sku === product.sku);
      for (const feature of productFeatures) {
        // Verificar si la feature ya existe
        const { data: existingFeature } = await supabase
          .from('features')
          .select('id')
          .eq('product_id', productId)
          .eq('name', feature.name)
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)
          .maybeSingle();

        let featureId: string;

        if (existingFeature) {
          featureId = existingFeature.id;
          await supabase
            .from('features')
            .update({ sort_order: feature.sort_order })
            .eq('id', existingFeature.id);
        } else {
          const { data: newFeature } = await supabase
            .from('features')
            .insert({
              tenant_id: tenantId,
              product_id: productId,
              name: feature.name,
              sort_order: feature.sort_order
            })
            .select('id')
            .single();
          featureId = newFeature?.id || '';
          featuresAdded++;
        }

        // Procesar atributos para esta feature
        const featureAttributes = (diff.attributes || []).filter(
          (a: any) => a.feature_name === feature.name && a.product_sku === product.sku
        );
        for (const attr of featureAttributes) {
          const { data: existingAttr } = await supabase
            .from('attributes')
            .select('id')
            .eq('feature_id', featureId)
            .eq('value', attr.value)
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .maybeSingle();

          if (!existingAttr) {
            await supabase
              .from('attributes')
              .insert({
                tenant_id: tenantId,
                feature_id: featureId,
                value: attr.value,
                sort_order: attr.sort_order
              });
          }
        }
      }
    }

    // Limpiar el temporary_import
    await supabase
      .from('temporary_imports')
      .delete()
      .eq('id', importId);

    const message = replace
      ? `Catálogo reemplazado. ${productsAdded} productos, ${featuresAdded} features, ${variantsAdded} variantes.`
      : `Importación aplicada. ${productsAdded} productos, ${featuresAdded} features, ${variantsAdded} variantes.`;

    return res.json({
      status: 'confirmed',
      message,
      products_added: productsAdded,
      products_updated: productsUpdated,
      features_added: featuresAdded,
      variants_added: variantsAdded
    });
  } catch (err: any) {
    console.error('Error en POST /excel/confirm:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;