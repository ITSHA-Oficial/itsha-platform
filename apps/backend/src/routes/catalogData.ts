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
      .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, formula_vars, is_active')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .is('deleted_at', null);

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

      const { data: variants } = await supabase
        .from('variants')
        .select('id, sku_variant, variant_signature, price, min_quantity, is_active')
        .eq('product_id', product.id)
        .is('deleted_at', null);

      const category = categories?.find(c => c.id === product.category_id);

      return {
        ...product,
        category_slug: category ? category.slug : null,
        features: featuresWithAttrs,
        variants: variants || [],
        primary_image_url: null
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