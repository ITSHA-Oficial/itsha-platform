import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();

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

    const { name, slug, image_url, sort_order } = req.body;
    if (!name || !slug) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requieren name y slug.' }
      });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: tenant.id,
        name,
        slug,
        image_url: image_url || null,
        sort_order: sort_order || 0
      })
      .select('id, name, slug, image_url, sort_order, is_active')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Ya existe una categoría activa con ese slug.' }
        });
      }
      throw error;
    }

    return res.status(201).json(category);
  } catch (err: any) {
    console.error('Error en POST /categories:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();

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

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, sort_order, is_active')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return res.json({ categories: categories || [] });
  } catch (err: any) {
    console.error('Error en GET /categories:', err);
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

    const { name, slug, image_url, sort_order } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .select('id, name, slug, image_url, sort_order, is_active')
      .single();

    if (error || !category) {
      return res.status(404).json({
        error: { code: 'CATEGORY_NOT_FOUND', message: 'Categoría no encontrada.' }
      });
    }

    return res.json(category);
  } catch (err: any) {
    console.error('Error en PUT /categories/:id:', err);
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
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (error) throw error;

    return res.json({ message: 'Categoría eliminada correctamente.' });
  } catch (err: any) {
    console.error('Error en DELETE /categories/:id:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;