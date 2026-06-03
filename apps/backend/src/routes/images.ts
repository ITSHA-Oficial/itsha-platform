import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';
import sharp from 'sharp';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// POST /api/v1/products/:productId/images
router.post('/products/:productId/images', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { productId } = req.params;

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

    if (!req.file) {
      return res.status(400).json({
        error: { code: 'NO_FILE', message: 'No se ha subido ninguna imagen.' }
      });
    }

    // Procesar imagen con sharp
    const processedBuffer = await sharp(req.file.buffer)
      .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Insertar registro en product_images para obtener un UUID
    const { data: imageRecord, error: insertError } = await supabase
      .from('product_images')
      .insert({
        tenant_id: tenant.id,
        product_id: productId,
        url: '', // temporal, lo actualizaremos después de subir
        alt_text: req.body.alt_text || null,
        sort_order: parseInt(req.body.sort_order) || 0
      })
      .select('id')
      .single();

    if (insertError || !imageRecord) {
      return res.status(500).json({
        error: { code: 'DB_ERROR', message: 'Error al crear el registro de imagen.' }
      });
    }

    // Subir a Storage usando el UUID como nombre de archivo
    const filePath = `${tenantSlug}/${productId}/${imageRecord.id}.webp`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, processedBuffer, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      await supabase.from('product_images').delete().eq('id', imageRecord.id);
      return res.status(500).json({
        error: { code: 'STORAGE_ERROR', message: 'Error al subir la imagen.' }
      });
    }

    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    const { data: updatedImage, error: updateError } = await supabase
      .from('product_images')
      .update({ url: publicUrl.publicUrl })
      .eq('id', imageRecord.id)
      .select('id, url, alt_text, sort_order, is_primary')
      .single();

    if (updateError) {
      return res.status(500).json({
        error: { code: 'DB_ERROR', message: 'Error al actualizar la URL de la imagen.' }
      });
    }

    return res.status(201).json(updatedImage);
  } catch (err: any) {
    console.error('Error en POST /images:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

// PUT /api/v1/images/:id/primary
router.put('/images/:id/primary', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({ error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere el header X-Tenant-Slug.' } });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' } });
    }

    // Obtener la imagen y su product_id
    const { data: image, error: imageError } = await supabase
      .from('product_images')
      .select('id, product_id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single();

    if (imageError || !image) {
      return res.status(404).json({ error: { code: 'IMAGE_NOT_FOUND', message: 'Imagen no encontrada.' } });
    }

    // Desmarcar todas las imágenes del producto
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', image.product_id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null);

    // Marcar esta como primaria
    const { data: updated, error: updateError } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', id)
      .select('id, url, alt_text, sort_order, is_primary')
      .single();

    if (updateError) {
      return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Error al actualizar la imagen.' } });
    }

    return res.json(updated);
  } catch (err: any) {
    console.error('Error en PUT /images/:id/primary:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/v1/images/:id
router.delete('/images/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({ error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere el header X-Tenant-Slug.' } });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' } });
    }

    // Verificar que la imagen existe y pertenece al tenant
    const { data: image, error: imageError } = await supabase
      .from('product_images')
      .select('id, url')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single();

    if (imageError || !image) {
      return res.status(404).json({ error: { code: 'IMAGE_NOT_FOUND', message: 'Imagen no encontrada.' } });
    }

    // Soft delete: marcar como eliminada en la BD
    const { error: deleteError } = await supabase
      .from('product_images')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: { code: 'DB_ERROR', message: 'Error al eliminar la imagen.' } });
    }

    return res.json({ message: 'Imagen eliminada correctamente.' });
  } catch (err: any) {
    console.error('Error en DELETE /images/:id:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' } });
  }
});

export default router;