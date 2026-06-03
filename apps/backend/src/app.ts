import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pino from 'pino';
import crypto from 'crypto';
import { getSupabaseClient } from './db/supabase';
import { startWorker } from './workers/processJobs';

const app = express();
const port = process.env.PORT || 3000;
const logger = pino({ transport: { target: 'pino-pretty', options: { colorize: true } } });

// Middlewares de seguridad y rendimiento
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Inyecta un request_id único en cada petición (DAS 7.0.2)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Request-ID', crypto.randomUUID());
  next();
});

// ---------- ENDPOINTS DE DIAGNÓSTICO ----------

// Liveness probe (DAS 2.2.8)
app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Conexión a Supabase
app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const slug = process.env.TENANT_SLUG || 'lrimprenta';

    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug, created_at')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ status: 'error', message: `Tenant '${slug}' no encontrado` });
    }

    res.json({ status: 'connected', tenant: data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- RUTAS DE LA API (DAS Capítulo 7) ----------

import catalogRoutes from './routes/catalog';
app.use('/api/v1/catalog', catalogRoutes);

import catalogDataRoutes from './routes/catalogData';
app.use('/api/v1/catalog/data', catalogDataRoutes);

import quoteRequestRoutes from './routes/quoteRequests';
app.use('/api/v1/quote-requests', quoteRequestRoutes);

import priceRoutes from './routes/price';
app.use('/api/v1/price/calculate', priceRoutes);

import quoteStatusRoutes from './routes/quoteStatus';
app.use('/api/v1/public/quote-requests', quoteStatusRoutes);

import tenantSettingsRoutes from './routes/tenantSettings';
app.use('/api/v1/public/tenant/settings', tenantSettingsRoutes);

import pdfDownloadRoutes from './routes/pdfDownload';
app.use('/api/v1/public/quotes', pdfDownloadRoutes);

import categoryRoutes from './routes/categories';
app.use('/api/v1/categories', categoryRoutes);

import productDetailRoutes from './routes/productDetail';
app.use('/api/v1/products', productDetailRoutes);

import productRoutes from './routes/products';
app.use('/api/v1/products', productRoutes);

import featureRoutes from './routes/features';
app.use('/api/v1', featureRoutes);

import variantRoutes from './routes/variants';
app.use('/api/v1', variantRoutes);

import excelExportRoutes from './routes/excelExport';
app.use('/api/v1/excel/export', excelExportRoutes);

import excelConfirmRoutes from './routes/excelConfirm';
app.use('/api/v1/excel/confirm', excelConfirmRoutes);

import auditRoutes from './routes/audit';
app.use('/api/v1/audit', auditRoutes);

import settingsRoutes from './routes/settings';
app.use('/api/v1/settings', settingsRoutes);

// Endpoint temporal para rebuild manual (será reemplazado por el worker)
app.post('/api/v1/catalog/rebuild', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug || 'lrimprenta')
      .single();

    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' });

    const { processRebuildCatalog } = await import('./workers/rebuildCatalog');
    const result = await processRebuildCatalog(tenant.id, null);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------- MANEJO GLOBAL DE ERRORES (DAS 3.8, R-06) ----------

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Error no capturado');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.'
    }
  });
});

// ---------- ARRANQUE ----------

app.listen(port, () => {
  logger.info(`ITSHA Backend API corriendo en puerto ${port}`);
});

const workerInterval = startWorker(5000);