import { getSupabaseClient } from '../db/supabase';
import { processRebuildCatalog } from './rebuildCatalog';
import { generateQuotePDF } from '../services/pdf';
import { buildWhatsAppUrl } from '../services/whatsapp';

export async function processNextJob(): Promise<boolean> {
  const supabase = getSupabaseClient();
  console.log('[Worker] Buscando jobs pendientes...');

  const { data: job, error } = await supabase
    .from('background_jobs')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('attempts', 3)
    .lte('run_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !job) return false;

  console.log(`[Worker] Job encontrado: ${job.id} (${job.job_type})`);

  await supabase
    .from('background_jobs')
    .update({ status: 'processing', locked_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    switch (job.job_type) {
      case 'rebuild_catalog':
        await processRebuildCatalog(job.tenant_id, job.triggered_by_user_id);
        break;

      case 'generate_quote': {
        const quoteId = job.payload?.quote_request_id;
        if (!quoteId) throw new Error('Falta quote_request_id en el payload');

        console.log(`[Worker] Procesando generate_quote para quoteId=${quoteId}, tenantId=${job.tenant_id}`);

        // Obtener la cotización
        const { data: quote, error: quoteSelectError } = await supabase
          .from('quote_requests')
          .select('client_name, client_phone, client_email, notes, tenant_id')
          .eq('id', quoteId)
          .eq('tenant_id', job.tenant_id)
          .single();

        if (quoteSelectError || !quote) {
          console.error('[Worker] Error al leer cotización:', quoteSelectError);
          throw new Error('Cotización no encontrada');
        }

        console.log('[Worker] Cotización encontrada:', quote.client_name);

        // Obtener los items
        const { data: items, error: itemsError } = await supabase
          .from('quote_items')
          .select('quantity, unit_price, total_price, product_id, variant_id')
          .eq('quote_request_id', quoteId)
          .eq('tenant_id', job.tenant_id);

        if (itemsError || !items || items.length === 0) {
          console.error('[Worker] Error al leer items:', itemsError);
          throw new Error('Items no encontrados');
        }

        console.log(`[Worker] ${items.length} items encontrados`);

        // Enriquecer items con nombres de producto y variante
        const enrichedItems = await Promise.all(items.map(async (item: any) => {
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', item.product_id)
            .eq('tenant_id', job.tenant_id)
            .single();

          const { data: variant } = item.variant_id ? await supabase
            .from('variants')
            .select('variant_signature')
            .eq('id', item.variant_id)
            .eq('tenant_id', job.tenant_id)
            .single() : { data: null };

          return {
            product_name: product?.name || 'Producto desconocido',
            variant_signature: variant?.variant_signature || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          };
        }));

        // Obtener datos del tenant necesarios para el PDF
        const { data: tenant } = await supabase
          .from('tenants')
          .select('slug, whatsapp, logo_url, primary_color')
          .eq('id', job.tenant_id)
          .single();

        if (!tenant) {
          throw new Error(`Tenant no encontrado para id: ${job.tenant_id}`);
        }

        // Generar PDF
        const pdfData = {
          client_name: quote.client_name,
          client_phone: quote.client_phone,
          items: enrichedItems,
          notes: quote.notes,
        };
        const pdfBuffer = await generateQuotePDF({
          ...pdfData,
          logoUrl: tenant.logo_url || null,
          primaryColor: tenant.primary_color || null,
          whatsapp: tenant.whatsapp || null
        });
        console.log('[Worker] PDF generado correctamente');

        // Subir a Storage
        const filePath = `leads-private/${tenant.slug}/quote_${quoteId}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('leads-private')
          .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

        if (uploadError) throw new Error(`Error al subir PDF: ${uploadError.message}`);
        console.log('[Worker] PDF subido a Storage');

        // Generar URL firmada (válida por 90 días)
        const { data: signedData, error: signedError } = await supabase.storage
          .from('leads-private')
          .createSignedUrl(filePath, 90 * 24 * 3600);

        if (signedError || !signedData?.signedUrl) throw new Error('Error al generar URL firmada');
        console.log('[Worker] URL firmada generada');

        const whatsappUrl = buildWhatsAppUrl(
          tenant?.whatsapp || '+51947112803',
          quote.client_name,
          signedData.signedUrl
        );

        // Actualizar la cotización
        await supabase
          .from('quote_requests')
          .update({
            processing_status: 'completed',
            pdf_url: filePath,
            pdf_signed_url: signedData.signedUrl,
          })
          .eq('id', quoteId);

        // Enviar correo si el cliente proporcionó email
        if (quote.client_email) {
          try {
            const emailService = await import('../services/email');
            await emailService.sendQuoteEmail(
              quote.client_email,
              'Tu cotización está lista',
              pdfBuffer,
              quote.client_name
            );
            console.log(`[Worker] Correo enviado a ${quote.client_email}`);
          } catch (emailErr: any) {
            console.error('[Worker] Error al enviar correo:', emailErr.message);
          }
        }

        console.log(`[Worker] PDF generado para quote ${quoteId}. WhatsApp: ${whatsappUrl}`);
        break;
      }

      default:
        console.log(`[Worker] Tipo de job no implementado: ${job.job_type}`);
    }

    await supabase
      .from('background_jobs')
      .update({ status: 'completed' })
      .eq('id', job.id);

    console.log(`[Worker] Job ${job.id} completado exitosamente`);
    return true;

  } catch (err: any) {
    console.error(`[Worker] Error en job ${job.id}:`, err.message);

    const newAttempts = job.attempts + 1;
    if (newAttempts >= job.max_attempts) {
      await supabase
        .from('background_jobs')
        .update({ status: 'failed', attempts: newAttempts, last_error: err.message })
        .eq('id', job.id);

      await supabase.from('dead_letter_jobs').insert({
        tenant_id: job.tenant_id,
        original_job_id: job.id,
        job_type: job.job_type,
        priority: job.priority,
        payload: job.payload,
        last_error: err.message,
        triggered_by_user_id: job.triggered_by_user_id,
      });
      console.log(`[Worker] Job ${job.id} movido a dead_letter_jobs`);
    } else {
      const backoff = [2, 4, 8][newAttempts - 1] || 8;
      await supabase
        .from('background_jobs')
        .update({
          status: 'pending',
          attempts: newAttempts,
          last_error: err.message,
          run_at: new Date(Date.now() + backoff * 1000).toISOString(),
          locked_at: null,
        })
        .eq('id', job.id);
      console.log(`[Worker] Job ${job.id} será reintentado en ${backoff}s (intento ${newAttempts})`);
    }
    return true;
  }
}

export function startWorker(intervalMs: number = 5000) {
  console.log(`[Worker] Iniciando worker con intervalo de ${intervalMs}ms`);
  return setInterval(async () => {
    try {
      await processNextJob();
    } catch (err) {
      console.error('[Worker] Error en el ciclo:', err);
    }
  }, intervalMs);
}