import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

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

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, price_formula, formula_vars, is_active, created_at, updated_at')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' }
      });
    }

    const { data: images } = await supabase
      .from('product_images')
      .select('id, url, alt_text, sort_order, is_primary')
      .eq('product_id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    const { data: features } = await supabase
      .from('features')
      .select('id, name, sort_order')
      .eq('product_id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    const featuresWithAttributes = features
      ? await Promise.all(
          features.map(async (feature) => {
            const { data: attributes } = await supabase
              .from('attributes')
              .select('id, value, sort_order')
              .eq('feature_id', feature.id)
              .eq('tenant_id', tenant.id)
              .is('deleted_at', null)
              .order('sort_order', { ascending: true });
            return { ...feature, attributes: attributes || [] };
          })
        )
      : [];

    let variants: any[] = [];
    if (product.pricing_mode === 'explicit_variant') {
      const { data: variantsData } = await supabase
        .from('variants')
        .select('id, sku_variant, variant_signature, price, min_quantity, is_active, is_main')
        .eq('product_id', id)
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (variantsData) {
        variants = await Promise.all(
          variantsData.map(async (variant) => {
            const { data: variantAttrs } = await supabase
              .from('variant_attributes')
              .select('attribute_id')
              .eq('variant_id', variant.id)
              .is('deleted_at', null);

            const attrIds = variantAttrs ? variantAttrs.map((va) => va.attribute_id) : [];

            let attributes: any[] = [];
            if (attrIds.length > 0) {
              const { data: attrs } = await supabase
                .from('attributes')
                .select('id, value, feature_id')
                .in('id', attrIds)
                .eq('tenant_id', tenant.id);

              if (attrs) {
                attributes = await Promise.all(
                  attrs.map(async (attr) => {
                    const { data: feat } = await supabase
                      .from('features')
                      .select('name')
                      .eq('id', attr.feature_id)
                      .single();
                    return { feature_name: feat?.name || '', value: attr.value };
                  })
                );
              }
            }

            return { ...variant, attributes };
          })
        );
      }
    }

    const response: any = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      pricing_mode: product.pricing_mode,
      display_price_mode: product.display_price_mode,
      price_formula: product.price_formula,
      formula_vars: product.formula_vars,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
      images: images || [],
      features: featuresWithAttributes,
      variants
    };

    return res.json(response);
  } catch (err: any) {
    console.error('Error en GET /products/:id:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

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

    const { name, description, category_id, pricing_mode, display_price_mode, is_active } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (pricing_mode !== undefined) updateData.pricing_mode = pricing_mode;
    if (display_price_mode !== undefined) updateData.display_price_mode = display_price_mode;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No hay campos para actualizar.' }
      });
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, is_active, updated_at')
      .single();

    if (error || !product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' }
      });
    }

    return res.json(product);
  } catch (err: any) {
    console.error('Error en PUT /products/:id:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

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

    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (error) throw error;

    return res.json({ message: 'Producto eliminado correctamente.' });
  } catch (err: any) {
    console.error('Error en DELETE /products/:id:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;