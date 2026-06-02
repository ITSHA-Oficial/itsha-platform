import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.post('/products/:productId/features', async (req: Request, res: Response) => {
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

    const { name, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requiere el campo name.' }
      });
    }

    const { data: feature, error } = await supabase
      .from('features')
      .insert({
        tenant_id: tenant.id,
        product_id: productId,
        name,
        sort_order: sort_order || 0
      })
      .select('id, product_id, name, sort_order')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Ya existe una característica activa con ese nombre para este producto.' }
        });
      }
      throw error;
    }

    return res.status(201).json(feature);
  } catch (err: any) {
    console.error('Error en POST /features:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

router.post('/features/:featureId/attributes', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { featureId } = req.params;

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

    const { value, sort_order } = req.body;
    if (!value) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requiere el campo value.' }
      });
    }

    const { data: attribute, error } = await supabase
      .from('attributes')
      .insert({
        tenant_id: tenant.id,
        feature_id: featureId,
        value,
        sort_order: sort_order || 0
      })
      .select('id, feature_id, value, sort_order')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Ya existe un atributo activo con ese valor para esta característica.' }
        });
      }
      throw error;
    }

    return res.status(201).json(attribute);
  } catch (err: any) {
    console.error('Error en POST /attributes:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;