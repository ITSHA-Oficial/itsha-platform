import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

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

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('name, slug, whatsapp, logo_url, primary_color, active')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (error || !tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' }
      });
    }

    return res.json(tenant);
  } catch (err: any) {
    console.error('Error en GET /settings:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

router.put('/', async (req: Request, res: Response) => {
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

    const { name, whatsapp, logo_url, primary_color, show_cart_total, facebook_url, instagram_url, tiktok_url, address } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (primary_color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(primary_color)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'El color primario debe estar en formato HEX (#RRGGBB).' }
        });
      }
      updateData.primary_color = primary_color.toLowerCase();
    }
    if (show_cart_total !== undefined) {
      updateData.show_cart_total = show_cart_total;
    }
    if (facebook_url !== undefined) updateData.facebook_url = facebook_url || null;
    if (instagram_url !== undefined) updateData.instagram_url = instagram_url || null;
    if (tiktok_url !== undefined) updateData.tiktok_url = tiktok_url || null;
    if (address !== undefined) updateData.address = address || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No hay campos para actualizar.' }
      });
    }

    const { data: updated, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenant.id)
      .select('name, slug, whatsapp, logo_url, primary_color, active, show_cart_total, facebook_url, instagram_url, tiktok_url, address')
      .single();

    if (error) throw error;

    return res.json(updated);
  } catch (err: any) {
    console.error('Error en PUT /settings:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

router.post('/logo', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({ error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere X-Tenant-Slug' } });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();
    if (tenantError || !tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'No se ha subido ningún archivo.' } });
    }

    const filePath = `${tenantSlug}/logo.webp`;
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, req.file.buffer, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      return res.status(500).json({ error: { code: 'STORAGE_ERROR', message: 'Error al subir el logo.' } });
    }

    const { data: publicUrl } = supabase.storage.from('logos').getPublicUrl(filePath);

    await supabase.from('tenants').update({ logo_url: publicUrl.publicUrl }).eq('id', tenant.id);

    return res.json({ logo_url: publicUrl.publicUrl });
  } catch (err: any) {
    console.error('Error en POST /settings/logo:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno.' } });
  }
});

export default router;