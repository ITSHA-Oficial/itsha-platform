import { createHash } from 'crypto';
import { getSupabaseClient } from '../db/supabase';
import { generateCatalogJSON } from '../services/catalog';
import { catalogSchema } from '@itsha/shared';

export async function processRebuildCatalog(tenantId: string, triggeredBy: string | null) {
  const supabase = getSupabaseClient();
  console.log(`[Worker] Iniciando rebuild de catálogo para tenant ${tenantId}`);

  try {
    // 1. Generar el JSON
    const catalogData = await generateCatalogJSON(tenantId);

    // 2. Validar con Zod
    const validation = catalogSchema.safeParse(catalogData);
    if (!validation.success) {
      console.error('[Worker] Error de validación del catálogo:', validation.error.issues);
      throw new Error('El catálogo generado no cumple con el schema.');
    }

    // 3. Calcular checksum SHA-256
    const jsonString = JSON.stringify(catalogData);
    const checksum = createHash('sha256').update(jsonString).digest('hex');

    // Obtener slug del tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) throw new Error(`Tenant no encontrado: ${tenantId}`);

    // 4. Subir a Storage
    const timestamp = Date.now();
    const filePath = `catalogs/${tenant.slug}/catalog_v${timestamp}.json`;

    const { error: uploadError } = await supabase.storage
      .from('catalogs')
      .upload(filePath, Buffer.from(jsonString, 'utf-8'), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('[Worker] Error al subir a Storage:', uploadError);
      throw new Error(`Error al subir a Storage: ${uploadError.message}`);
    }

    // 5. Obtener URL pública
    const { data: publicUrl } = supabase.storage
      .from('catalogs')
      .getPublicUrl(filePath);

    // 6. Buscar la última versión activa
    const { data: lastVersion } = await supabase
      .from('catalog_versions')
      .select('version')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = lastVersion ? lastVersion.version + 1 : 1;

    // 7. Transacción: desactivar anterior y activar nueva
    await supabase.from('catalog_versions')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    const { error: insertError } = await supabase
      .from('catalog_versions')
      .insert({
        tenant_id: tenantId,
        version: newVersion,
        json_url: publicUrl.publicUrl,
        checksum_sha256: checksum,
        schema_version: 1,
        created_by: triggeredBy,
        trigger: 'manual_rebuild',
        products_count: catalogData.total_products,
        is_active: true
      });

    if (insertError) {
      console.error('[Worker] Error al insertar catalog_versions:', insertError);
      throw new Error(`Error al insertar catalog_versions: ${insertError.message}`);
    }

    console.log(`[Worker] Rebuild completado. Versión ${newVersion}. ${catalogData.total_products} productos.`);
    return { 
      version: newVersion, 
      url: publicUrl.publicUrl, 
      checksum, 
      products: catalogData.total_products 
    };
  } catch (err: any) {
    console.error('[Worker] Error en rebuild:', err.message);
    throw err;
  }
}