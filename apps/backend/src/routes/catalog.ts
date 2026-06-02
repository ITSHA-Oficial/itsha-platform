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
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' }
      });
    }

    const { data, error } = await supabase
      .from('catalog_versions')
      .select('json_url, version, checksum_sha256, schema_version, products_count, created_at')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: { code: 'CATALOG_NOT_FOUND', message: 'No hay catálogo activo para este tenant.' }
      });
    }

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.json({
      catalog_url: data.json_url,
      version: data.version,
      checksum_sha256: data.checksum_sha256,
      schema_version: data.schema_version,
      generated_at: data.created_at,
      total_products: data.products_count
    });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;