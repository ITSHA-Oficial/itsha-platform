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

    const { sku, name, description, category_id, pricing_mode, display_price_mode } = req.body;
    if (!sku || !name) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requieren sku y name.' }
      });
    }

    const insertData: any = {
      tenant_id: tenant.id,
      sku,
      name,
      description: description || null,
      category_id: category_id || null,
      pricing_mode: pricing_mode || 'explicit_variant',
      display_price_mode: display_price_mode || 'hidden'
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert(insertData)
      .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Ya existe un producto activo con ese SKU.' }
        });
      }
      throw error;
    }

    return res.status(201).json(product);
  } catch (err: any) {
    console.error('Error en POST /products:', err);
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

    const { category_id, pricing_mode, is_active, q, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('products')
      .select('id, sku, name, description, category_id, pricing_mode, display_price_mode, is_active, created_at', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    if (category_id) query = query.eq('category_id', category_id);
    if (pricing_mode) query = query.eq('pricing_mode', pricing_mode);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);

    const { data: products, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    return res.json({
      products: products || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (err: any) {
    console.error('Error en GET /products:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;