import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.get('/:token/pdf', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: { code: 'MISSING_TOKEN', message: 'Se requiere el token de la cotización.' }
      });
    }

    const supabase = getSupabaseClient();

    const { data: quoteRequest, error } = await supabase
      .from('quote_requests')
      .select('id, processing_status, pdf_signed_url')
      .eq('public_token', token)
      .single();

    if (error || !quoteRequest) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cotización no encontrada.' }
      });
    }

    if (quoteRequest.processing_status === 'expired') {
      return res.status(410).json({
        error: { code: 'PDF_EXPIRED', message: 'El PDF ha expirado y ya no está disponible.' }
      });
    }

    if (quoteRequest.processing_status !== 'completed') {
      return res.status(404).json({
        error: { code: 'PDF_NOT_READY', message: 'El PDF aún no está disponible.' }
      });
    }

    try {
      await supabase.from('audit_logs').insert({
        tenant_id: quoteRequest.id,
        action: 'PDF_DOWNLOAD',
        table_name: 'quote_requests',
        record_id: quoteRequest.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string
      });
    } catch (auditError) {
      console.warn('No se pudo registrar la auditoría de descarga:', auditError);
    }

    return res.redirect(302, quoteRequest.pdf_signed_url);
  } catch (err: any) {
    console.error('Error en GET /quotes/:token/pdf:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;