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

// DELETE /api/v1/features/:id
router.delete('/features/:id', async (req: Request, res: Response) => {
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

    // Verificar que la característica existe y pertenece al tenant
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single();

    if (featureError || !feature) {
      return res.status(404).json({
        error: { code: 'FEATURE_NOT_FOUND', message: 'Característica no encontrada.' }
      });
    }

    // Soft delete: marcar la característica y sus atributos como eliminados
    const { error: deleteError } = await supabase
      .from('features')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (deleteError) {
      return res.status(500).json({
        error: { code: 'DB_ERROR', message: 'Error al eliminar la característica.' }
      });
    }

    // Soft delete de los atributos asociados
    await supabase
      .from('attributes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('feature_id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    return res.json({ message: 'Característica eliminada correctamente.' });
  } catch (err: any) {
    console.error('Error en DELETE /features/:id:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

// DELETE /api/v1/attributes/:id
router.delete('/attributes/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({ error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere X-Tenant-Slug' } });
    }

    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).eq('active', true).single();
    if (!tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' } });
    }

    const { error: deleteError } = await supabase
      .from('attributes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (deleteError) {
      return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Error al eliminar el atributo' } });
    }

    return res.json({ message: 'Atributo eliminado correctamente.' });
  } catch (err: any) {
    console.error('Error en DELETE /attributes/:id:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
  }
});

/**
 * PUT /api/v1/products/:productId/features/batch-sort
 * Actualiza el sort_order de varias características a la vez.
 * Body: { items: [{ id: string, sort_order: number }] }
 */
router.put('/products/:productId/features/batch-sort', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { productId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requiere un array de items con id y sort_order.' }
      });
    }

    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({ error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere el header X-Tenant-Slug.' } });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' } });
    }

    // Validar que todos los IDs pertenecen a este producto y tenant
    const ids = items.map((item: any) => item.id);
    const { data: validFeatures, error: validError } = await supabase
      .from('features')
      .select('id')
      .in('id', ids)
      .eq('product_id', productId)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    if (validError || !validFeatures || validFeatures.length !== ids.length) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Alguna característica no pertenece a este producto o tenant.' }
      });
    }

    // Actualizar una por una (o en paralelo, pero no hay problema)
    const updates = items.map((item: any) =>
      supabase
        .from('features')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('tenant_id', tenant.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errores en batch-sort:', errors);
      return res.status(500).json({
        error: { code: 'DB_ERROR', message: 'Error al actualizar algunos órdenes.' }
      });
    }

    return res.json({ message: 'Órdenes actualizados correctamente.' });
  } catch (err: any) {
    console.error('Error en PUT /features/batch-sort:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;