import { getSupabaseClient } from '../db/supabase';

export async function triggerCatalogRebuild(tenantId: string, triggeredBy: string | null) {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('background_jobs')
    .insert({
      tenant_id: tenantId,
      job_type: 'rebuild_catalog',
      priority: 2,
      payload: {},
      status: 'pending',
      triggered_by_user_id: triggeredBy,
    });

  if (error) console.error('Error al encolar rebuild:', error.message);
  else console.log(`[RebuildTrigger] Rebuild encolado para tenant ${tenantId}`);
}