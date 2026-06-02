import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

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

    const { action, table_name, date_from, date_to, cursor, limit } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);

    let query = supabase
      .from('audit_logs')
      .select('id, user_id, action, table_name, record_id, old_data, new_data, ip_address, created_at', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (action) query = query.eq('action', action);
    if (table_name) query = query.eq('table_name', table_name);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
    if (cursor) query = query.lt('created_at', cursor);

    const { data: logs, error, count } = await query;

    if (error) throw error;

    const nextCursor = logs && logs.length > 0 ? logs[logs.length - 1].created_at : null;
    const hasMore = logs ? logs.length === limitNum : false;

    return res.json({
      logs: logs || [],
      pagination: {
        next_cursor: nextCursor,
        has_more: hasMore
      }
    });
  } catch (err: any) {
    console.error('Error en GET /audit:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;