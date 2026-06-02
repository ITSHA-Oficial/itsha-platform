import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';

const router = Router();

router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({
        error: { code: 'MISSING_TOKEN', message: 'Se requiere el query param token (public_token).' }
      });
    }

    const supabase = getSupabaseClient();

    const { data: quoteRequest, error } = await supabase
      .from('quote_requests')
      .select('id, processing_status, pdf_url, pdf_signed_url, public_token, created_at')
      .eq('id', id)
      .eq('public_token', token)
      .single();

    if (error || !quoteRequest) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Cotización no encontrada o token inválido.' }
      });
    }

    const elapsedSeconds = (Date.now() - new Date(quoteRequest.created_at).getTime()) / 1000;
    let processingStatus = quoteRequest.processing_status;

    if ((processingStatus === 'pending' || processingStatus === 'processing') && elapsedSeconds > 60) {
      processingStatus = 'failed';
    }

    const response: any = { processing_status: processingStatus };

    if (processingStatus === 'completed') {
      response.pdf_url = `/api/v1/public/quotes/${quoteRequest.public_token}/pdf`;
      response.pdf_signed_url = quoteRequest.pdf_signed_url;
      response.whatsapp_url = `https://wa.me/?text=...`;
    }

    return res.json(response);
  } catch (err: any) {
    console.error('Error en GET /quote-requests/:id/status:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;