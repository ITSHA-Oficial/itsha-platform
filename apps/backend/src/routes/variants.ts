import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.post('/products/:productId/variants', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { productId } = req.params;

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
      .select('id, pricing_mode')
      .eq('id', productId)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' }
      });
    }

    if (product.pricing_mode !== 'explicit_variant') {
      return res.status(422).json({
        error: { code: 'INVALID_PRICING_MODE', message: 'Este producto no acepta variantes explícitas. Usa dynamic_formula.' }
      });
    }

    const { sku_variant, attribute_ids, price, min_quantity } = req.body;
    if (!attribute_ids || !Array.isArray(attribute_ids) || attribute_ids.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requiere un array de attribute_ids.' }
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requiere el campo price.' }
      });
    }

    const { data: validAttrs, error: attrError } = await supabase
      .from('attributes')
      .select('id, value, feature_id')
      .in('id', attribute_ids)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    if (attrError || !validAttrs || validAttrs.length !== attribute_ids.length) {
      return res.status(422).json({
        error: { code: 'INVALID_ATTRIBUTES', message: 'Uno o más atributos no son válidos o no pertenecen a este tenant.' }
      });
    }

    const featureIds = [...new Set(validAttrs.map(a => a.feature_id))];
    const { data: validFeatures, error: featError } = await supabase
      .from('features')
      .select('id')
      .in('id', featureIds)
      .eq('product_id', productId)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    if (featError || !validFeatures || validFeatures.length !== featureIds.length) {
      return res.status(422).json({
        error: { code: 'INVALID_ATTRIBUTES', message: 'Los atributos no pertenecen a las características de este producto.' }
      });
    }

    const attrWithFeatures = await Promise.all(
      validAttrs.map(async (attr) => {
        const { data: feature } = await supabase
          .from('features')
          .select('name')
          .eq('id', attr.feature_id)
          .single();
        return { feature_name: feature?.name || '', value: attr.value };
      })
    );

    attrWithFeatures.sort((a, b) => a.feature_name.localeCompare(b.feature_name));
    const variantSignature = attrWithFeatures.map(a => `${a.feature_name}:${a.value}`).join('|');

    const { data: existing } = await supabase
      .from('variants')
      .select('id')
      .eq('product_id', productId)
      .eq('tenant_id', tenant.id)
      .eq('variant_signature', variantSignature)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Ya existe una variante activa con esta combinación de atributos.' }
      });
    }

    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .insert({
        tenant_id: tenant.id,
        product_id: productId,
        sku_variant: sku_variant || null,
        variant_signature: variantSignature,
        price,
        min_quantity: min_quantity || 1
      })
      .select('id, product_id, sku_variant, variant_signature, price, min_quantity, is_active')
      .single();

    if (variantError) throw variantError;

    const variantAttrRows = validAttrs.map(attr => ({
      tenant_id: tenant.id,
      variant_id: variant.id,
      attribute_id: attr.id
    }));

    const { error: vaError } = await supabase
      .from('variant_attributes')
      .insert(variantAttrRows);

    if (vaError) throw vaError;

    return res.status(201).json({
      ...variant,
      attributes: attrWithFeatures
    });
  } catch (err: any) {
    console.error('Error en POST /variants:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

/**
 * PUT /api/v1/variants/:id/main
 * Establece una variante como principal. Desmarca todas las demás del mismo producto.
 */
router.put('/variants/:id/main', async (req: Request, res: Response) => {
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

    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .select('id, product_id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single();

    if (variantError || !variant) {
      return res.status(404).json({
        error: { code: 'VARIANT_NOT_FOUND', message: 'Variante no encontrada.' }
      });
    }

    // Desmarcar todas las variantes del producto
    await supabase
      .from('variants')
      .update({ is_main: false })
      .eq('product_id', variant.product_id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    // Marcar la seleccionada como principal
    const { error: updateError } = await supabase
      .from('variants')
      .update({ is_main: true })
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (updateError) throw updateError;

    return res.json({
      message: 'Variante establecida como principal.',
      variant_id: id
    });
  } catch (err: any) {
    console.error('Error en PUT /variants/:id/main:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;