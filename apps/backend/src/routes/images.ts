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
      // Limpiar el registro si falla la subida
      await supabase.from('product_images').delete().eq('id', imageRecord.id);
      return res.status(500).json({
        error: { code: 'STORAGE_ERROR', message: 'Error al subir la imagen.' }
      });
    }

    // Obtener URL pública
    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    // Actualizar la URL en el registro
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

export default router;