import { getSupabaseClient } from '../db/supabase';
import type { CatalogDTO } from '@itsha/shared';

export async function generateCatalogJSON(tenantId: string): Promise<CatalogDTO> {
  const supabase = getSupabaseClient();

  // 1. Obtener datos del tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('name, logo_url, primary_color')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) throw new Error('Tenant no encontrado');

  // 2. Obtener categorías activas
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, sort_order')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  // 3. Obtener productos activos
  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, formula_vars, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (!products) throw new Error('No se pudieron cargar los productos');

  // 4. Enriquecer cada producto con features y variantes
  const enrichedProducts = await Promise.all(products.map(async (product) => {
    // Features con atributos
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
        return { name: f.name, sort_order: f.sort_order, attributes: attrs || [] };
      }));
    }

    // Variantes con atributos
    const { data: variants } = await supabase
      .from('variants')
      .select('id, sku_variant, variant_signature, price, min_quantity, is_active')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .is('deleted_at', null);

    let variantsWithAttrs: any[] = [];
    if (variants) {
      variantsWithAttrs = await Promise.all(variants.map(async (v) => {
        const { data: vaLinks } = await supabase
          .from('variant_attributes')
          .select('attribute_id')
          .eq('variant_id', v.id)
          .is('deleted_at', null);

        let attributes: any[] = [];
        if (vaLinks && vaLinks.length > 0) {
          const attrIds = vaLinks.map(l => l.attribute_id);
          const { data: attrs } = await supabase
            .from('attributes')
            .select('id, value, feature_id')
            .in('id', attrIds);

          if (attrs) {
            attributes = await Promise.all(attrs.map(async (a) => {
              const { data: feat } = await supabase
                .from('features')
                .select('name')
                .eq('id', a.feature_id)
                .single();
              return { feature_name: feat?.name || '', value: a.value };
            }));
          }
        }

        return {
          id: v.id,
          sku_variant: v.sku_variant,
          variant_signature: v.variant_signature,
          price: v.price,
          min_quantity: v.min_quantity,
          attributes
        };
      }));
    }

    // Imagen primaria
    const { data: primaryImage } = await supabase
      .from('product_images')
      .select('url')
      .eq('product_id', product.id)
      .eq('is_primary', true)
      .is('deleted_at', null)
      .maybeSingle();

    // Categoría
    const category = categories?.find(c => c.id === product.category_id);

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category_slug: category?.slug || null,
      pricing_mode: product.pricing_mode,
      display_price_mode: product.display_price_mode,
      formula_vars: product.formula_vars,
      primary_image_url: primaryImage?.url || null,
      features: featuresWithAttrs,
      variants: variantsWithAttrs
    };
  }));

  // 5. Armar el DTO completo
  return {
    schema_version: 1,
    catalog_version: Date.now(),
    generated_at: new Date().toISOString(),
    total_products: enrichedProducts.length,
    tenant: {
      name: tenant.name,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color
    },
    categories: (categories || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image_url: c.image_url,
      sort_order: c.sort_order
    })),
    products: enrichedProducts
  };
}