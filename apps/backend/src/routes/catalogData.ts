import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
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
      .select('id, name, logo_url, primary_color')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' } });
    }

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, sort_order')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    const { data: products } = await supabase
      .from('products')
      .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, formula_vars, is_active, is_featured')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    const { data: allImages } = await supabase
      .from('product_images')
      .select('id, product_id, url, alt_text')
      .in('product_id', products?.map(p => p.id) || [])
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    const enrichedProducts = products ? await Promise.all(products.map(async (product) => {
      const { data: features } = await supabase
        .from('features')
        .select('id, name, sort_order')
        .eq('product_id', product.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      let featuresWithAttrs: any[] = [];
      if (features) {
        featuresWithAttrs = await Promise.all(features.map(async (f) => {
          const { data: attrs } = await supabase
            .from('attributes')
            .select('id, value, sort_order')
            .eq('feature_id', f.id)
            .is('deleted_at', null)
            .order('sort_order', { ascending: true });
          return { ...f, attributes: attrs || [] };
        }));
      }

      // Obtener las variantes
      const { data: variants } = await supabase
        .from('variants')
        .select('id, sku_variant, variant_signature, price, min_quantity, is_active, is_main, image_url')
        .eq('product_id', product.id)
        .is('deleted_at', null);

      // Obtener los atributos de todas las variantes del producto
      if (variants && variants.length > 0) {
        const variantIds = variants.map(v => v.id);

        // 1. Obtener todas las relaciones variant_attributes
        const { data: variantAttrs } = await supabase
          .from('variant_attributes')
          .select('variant_id, attribute_id')
          .in('variant_id', variantIds)
          .is('deleted_at', null);
  
        if (variantAttrs && variantAttrs.length > 0) {
          const attributeIds = [...new Set(variantAttrs.map(va => va.attribute_id))];

          // 2. Obtener los atributos (value + feature_id)
          const { data: attributes } = await supabase
            .from('attributes')
            .select('id, value, feature_id')
            .in('id', attributeIds)
            .is('deleted_at', null);

          if (attributes && attributes.length > 0) {
            const featureIds = [...new Set(attributes.map(a => a.feature_id))];

            // 3. Obtener los nombres de las features
            const { data: features } = await supabase
              .from('features')
              .select('id, name')
              .in('id', featureIds)
              .is('deleted_at', null);

            // Crear mapas para acceder rápidamente
            const attrMap = new Map(attributes.map(a => [a.id, a]));
            const featMap = new Map(features?.map(f => [f.id, f]) || []);

            // 4. Agrupar atributos por variant_id
            const attrsByVariant: Record<string, any[]> = {};
            for (const va of variantAttrs) {
              const attr = attrMap.get(va.attribute_id);
              if (!attr) continue;
              const featName = featMap.get(attr.feature_id)?.name || '';

              if (!attrsByVariant[va.variant_id]) attrsByVariant[va.variant_id] = [];
              attrsByVariant[va.variant_id].push({
                feature_name: featName,
                value: attr.value
              });
            }

            // 5. Asignar a cada variante
            variants.forEach(v => {
              (v as any).attributes = attrsByVariant[v.id] || [];
            });
          }
        }
      }

      const { data: primaryImage } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', product.id)
        .eq('is_primary', true)
        .is('deleted_at', null)
        .maybeSingle();

      const category = categories?.find(c => c.id === product.category_id);

      return {
        ...product,
        category_slug: category ? category.slug : null,
        features: featuresWithAttrs,
        variants: variants || [],
        images: (allImages || []).filter(img => img.product_id === product.id).map(img => ({ url: img.url })),
        primary_image_url: primaryImage?.url || null
      };
    })) : [];

    const catalog = {
      schema_version: 1,
      catalog_version: 1,
      generated_at: new Date().toISOString(),
      total_products: enrichedProducts.length,
      tenant: { name: tenant.name, logo_url: tenant.logo_url, primary_color: tenant.primary_color },
      categories: categories || [],
      products: enrichedProducts
    };

    return res.json(catalog);
  } catch (err: any) {
    console.error('Error al generar catálogo dinámico:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno.' } });
  }
});

export default router;