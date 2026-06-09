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
      .is('deleted_at', null)
      .limit(5000)
      .order('name', { ascending: true });

    // Consultas consolidadas para todos los productos
    const productIds = products ? products.map(p => p.id) : [];

    // Obtener todas las features de una sola vez
    const { data: allFeatures } = await supabase
      .from('features')
      .select('id, product_id, name, sort_order')
      .in('product_id', productIds)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    // Obtener todos los feature_ids para la consulta de attributes
    const featureIds = allFeatures ? allFeatures.map(f => f.id) : [];

    // Obtener todos los atributos de una sola vez (CORREGIDO)
    let allAttributes: any[] = [];
    if (featureIds.length > 0) {
      const { data: attrs } = await supabase
        .from('attributes')
        .select('id, feature_id, value, sort_order')
        .in('feature_id', featureIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      allAttributes = attrs || [];
    }

    // Obtener todas las variantes de una sola vez
    const { data: allVariants } = await supabase
      .from('variants')
      .select('id, product_id, sku_variant, variant_signature, price, min_quantity, is_active')
      .in('product_id', productIds)
      .is('deleted_at', null);

    // Obtener todas las imágenes primarias de una sola vez (CORREGIDO)
    const { data: allImages } = await supabase
      .from('product_images')
      .select('product_id, url')
      .in('product_id', productIds)
      .eq('is_primary', true)
      .is('deleted_at', null);

    // Construir el array enriquecido con los datos ya en memoria
    const enrichedProducts = products ? products.map(product => {
      const features = (allFeatures || []).filter(f => f.product_id === product.id);
      const featuresWithAttrs = features.map(f => ({
        ...f,
        attributes: allAttributes.filter(a => a.feature_id === f.id)
      }));

      const variants = (allVariants || []).filter(v => v.product_id === product.id);
      const primaryImage = (allImages || []).find(img => img.product_id === product.id);
      const category = categories?.find(c => c.id === product.category_id);

      return {
        ...product,
        category_slug: category ? category.slug : null,
        features: featuresWithAttrs,
        variants: variants,
        primary_image_url: primaryImage?.url || null
      };
    }) : [];

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
    return res.status(500).json({
      request_id: req.headers['x-request-id'] || 'sin-id',
      error: { code: 'INTERNAL_ERROR', message: 'Error interno al generar el catálogo.' }
    });
  }
});

export default router;