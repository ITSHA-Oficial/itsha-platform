import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({ error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere X-Tenant-Slug' } });
    }
    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).eq('active', true).single();
    if (!tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' } });
    }

    const { data: versions, error } = await supabase
      .from('catalog_versions')
      .select('id, version, json_url, checksum_sha256, trigger, products_count, is_active, created_at')
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return res.json({ versions: versions || [] });
  } catch (err: any) {
    console.error('Error en GET /catalog/versions:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
  }
});

export default router;