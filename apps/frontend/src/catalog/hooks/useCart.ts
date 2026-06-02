import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  product_id: string;
  sku: string;
  product_name: string;
  variant_id: string | null;
  variant_signature: string | null;
  selected_options: Record<string, string>;
  formula_inputs: Record<string, number> | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  image_url: string | null;
}

const CART_KEY = 'itsha_cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export default function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
    // Sincronización multi-pestaña (DAS 6.5)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setItems(loadCart());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      if (prev.length >= 50) {
        alert('Has alcanzado el límite de 50 productos por cotización.');
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems };
}