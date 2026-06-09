import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';
import { createQuoteRequestSchema } from '@itsha/shared';
import crypto from 'crypto';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
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
      .select('id, active')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' }
      });
    }

    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (!idempotencyKey) {
      return res.status(400).json({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'Se requiere el header X-Idempotency-Key.' }
      });
    }

    const { data: existingKey } = await supabase
      .from('idempotency_keys')
      .select('response_json')
      .eq('tenant_id', tenant.id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingKey) {
      return res.status(200).json(existingKey.response_json);
    }

    const validationResult = createQuoteRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos.',
          details: validationResult.error.issues
        }
      });
    }

    const { client_name, client_phone, client_email, notes, items } = validationResult.data;

    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .insert({
        tenant_id: tenant.id,
        client_name,
        client_phone,
        client_email,
        notes,
        status: 'nuevo',
        processing_status: 'pending',
        public_token: crypto.randomUUID()
      })
      .select('id, public_token, processing_status')
      .single();

    if (quoteError || !quoteRequest) {
      return res.status(500).json({
        error: { code: 'DB_ERROR', message: 'Error al crear la cotización.' }
      });
    }

    const quoteItems = items.map((item: any) => ({
      tenant_id: tenant.id,
      quote_request_id: quoteRequest.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
      selected_options: item.selected_options,
      formula_inputs: item.formula_inputs || null,
      notes: item.notes || null
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems);

    if (itemsError) {
      return res.status(500).json({
        error: { code: 'DB_ERROR', message: 'Error al guardar los items de la cotización.' }
      });
    }

    const newIdempotencyId = crypto.randomUUID();

    const { error: jobError } = await supabase
      .from('background_jobs')
      .insert({
        tenant_id: tenant.id,
        job_type: 'generate_quote',
        priority: 1,
        reference_id: newIdempotencyId,
        payload: { quote_request_id: quoteRequest.id },
        status: 'pending'
      });

    if (jobError) {
      console.error('Error al encolar job:', jobError);
    }

    const responseBody = {
      request_id: crypto.randomUUID(),
      quote_request_id: quoteRequest.id,
      processing_status: 'pending',
      public_token: quoteRequest.public_token,
      message: 'Cotización recibida. El PDF se está generando.'
    };

    await supabase
      .from('idempotency_keys')
      .insert({
        tenant_id: tenant.id,
        idempotency_key: idempotencyKey,
        response_json: responseBody
      });

    return res.status(202).json(responseBody);

  } catch (err: any) {
    console.error('Error en POST /quote-requests:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

// GET /api/v1/quote-requests
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

    const { status, processing_status, date_from, date_to, q, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from('quote_requests').select('id, client_name, client_phone, client_email, status, processing_status, notes, created_at', { count: 'exact' }).eq('tenant_id', tenant.id).order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (processing_status) query = query.eq('processing_status', processing_status);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
    if (q) query = query.or(`client_name.ilike.%${q}%,client_phone.ilike.%${q}%`);

    const { data: quoteRequests, error, count } = await query.range(offset, offset + limitNum - 1);

    if (error) throw error;

    return res.json({
      quote_requests: quoteRequests || [],
      pagination: { page: pageNum, limit: limitNum, total: count || 0, total_pages: Math.ceil((count || 0) / limitNum) }
    });
  } catch (err: any) {
    console.error('Error en GET /quote-requests:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
  }
});

// PUT /api/v1/quote-requests/:id/status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['nuevo', 'contactado', 'cerrado', 'perdido'].includes(status)) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Estado no válido' } });
    }

    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({ error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere X-Tenant-Slug' } });
    }

    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).eq('active', true).single();
    if (!tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' } });
    }

    const { data: quoteRequest, error } = await supabase
      .from('quote_requests')
      .update({ status })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .select('id, status')
      .single();

    if (error || !quoteRequest) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cotización no encontrada' } });
    }

    return res.json(quoteRequest);
  } catch (err: any) {
    console.error('Error en PUT /quote-requests/:id/status:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
  }
});

export default router;