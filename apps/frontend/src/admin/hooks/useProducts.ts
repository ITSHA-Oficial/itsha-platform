import { useState, useEffect } from 'react';
import { API_URL } from '../../catalog/utils/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  pricing_mode: string;
  display_price_mode: string;
  is_active: boolean;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function useProducts(tenantSlug: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (page = 1, filters?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...filters });
      const res = await fetch(`${API_URL}/api/v1/products?${params}`, {
        headers: { 'X-Tenant-Slug': tenantSlug }
      });
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  return { products, pagination, loading, error, fetchProducts };
}