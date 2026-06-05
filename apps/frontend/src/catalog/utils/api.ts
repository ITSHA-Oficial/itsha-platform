const API_URL = import.meta.env.VITE_API_URL;
const TENANT_SLUG = 'lrimprenta';

export async function fetchCatalogMetadata() {
  const res = await fetch(`${API_URL}/api/v1/catalog`, {
    headers: { 'X-Tenant-Slug': TENANT_SLUG }
  });
  if (!res.ok) throw new Error('Error al cargar el catálogo');
  return res.json();
}

export async function fetchCatalogJSON(catalogUrl: string) {
  const res = await fetch(catalogUrl);
  if (!res.ok) throw new Error('Error al descargar el catálogo');
  return res.json();
}

export async function fetchCatalogData() {
  const res = await fetch(`${API_URL}/api/v1/catalog/data`, {
    headers: { 'X-Tenant-Slug': TENANT_SLUG }
  });
  if (!res.ok) throw new Error('Error al cargar el catálogo');
  return res.json();
}

export async function submitQuoteRequest(data: any) {
  const idempotencyKey = crypto.randomUUID();
  const res = await fetch(`${API_URL}/api/v1/quote-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': TENANT_SLUG,
      'X-Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function checkQuoteStatus(quoteId: string, token: string) {
  const res = await fetch(`${API_URL}/api/v1/public/quote-requests/${quoteId}/status?token=${token}`);
  if (!res.ok) throw new Error('Error al consultar el estado');
  return res.json();
}

export async function fetchTenantSettings() {
  const res = await fetch(`${API_URL}/api/v1/public/tenant/settings?slug=${TENANT_SLUG}`);
  if (!res.ok) throw new Error('Error al cargar configuración');
  return res.json();
}

export { API_URL, TENANT_SLUG };