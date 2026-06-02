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

    const { error: jobError } = await supabase
      .from('background_jobs')
      .insert({
        tenant_id: tenant.id,
        job_type: 'generate_quote',
        priority: 1,
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

export default router;