import { useState, useEffect } from 'react';
import { fetchCatalogData } from '../utils/api';

export default function useCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await fetchCatalogData();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setTenant(data.tenant || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  return { products, categories, tenant, loading, error };
}