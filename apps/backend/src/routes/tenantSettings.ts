import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const slug = req.query.slug as string;
    if (!slug) {
      return res.status(400).json({
        error: { code: 'MISSING_SLUG', message: 'Se requiere el query param slug.' }
      });
    }

    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('name, logo_url, primary_color, whatsapp, show_cart_total')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error || !tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' }
      });
    }

    return res.json({
      name: tenant.name,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color,
      whatsapp: tenant.whatsapp,
      show_cart_total: tenant.show_cart_total
    });
  } catch (err: any) {
    console.error('Error en GET /tenant/settings:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;