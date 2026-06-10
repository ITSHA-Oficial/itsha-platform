import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom';
import Home from './catalog/pages/Home'
import CatalogProductDetail from './catalog/pages/ProductDetail'
import Quote from './catalog/pages/Quote'
import Thanks from './catalog/pages/Thanks'
import CartIcon from './catalog/components/CartIcon'
import CartPanel from './catalog/components/CartPanel'
import WhatsAppButton from './catalog/components/WhatsAppButton';
import useCart from './catalog/hooks/useCart'
import Login from './admin/pages/Login'
import Dashboard from './admin/pages/Dashboard'
import Products from './admin/pages/Products'
import ProductDetail from './admin/pages/ProductDetail'
import ProductNew from './admin/pages/ProductNew'
import ExcelImport from './admin/pages/ExcelImport'
import ExcelExport from './admin/pages/ExcelExport'
import Categories from './admin/pages/Categories'
import QuoteRequests from './admin/pages/QuoteRequests'
import Settings from './admin/pages/Settings'
import Layout from './admin/components/Layout'
import ProtectedRoute from './admin/components/ProtectedRoute'
import { fetchTenantSettings } from './catalog/utils/api'

function AppContent() {
  const { items, addItem, removeItem, updateQuantity, clearCart, totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [showCartTotal, setShowCartTotal] = useState(true);
  const location = useLocation();

  // Este código se ejecuta una sola vez cuando la página carga.
  // Le pregunta al servidor por la configuración del tenant.
  useEffect(() => {
    fetchTenantSettings()
      .then(data => {
        setShowCartTotal(data.show_cart_total !== false);
        // data.primary_color es el color que guardó el dueño (ej: "#FF0000" para rojo)
        if (data.primary_color) {
          // Aquí creamos el lápiz mágico (variable CSS) con el color correcto
          document.documentElement.style.setProperty('--primary-color', data.primary_color);
        }
      })
      .catch(console.error); // Si falla, no pasa nada, se usarán los valores por defecto.
  }, []); // El '[]' vacío significa "solo hazlo una vez al cargar la página".

  return (
    <div className="relative min-h-screen">
      {/* Carrito siempre visible (portal) */}
      {/* {!location.pathname.startsWith('/admin') &&
        ReactDOM.createPortal(
          <div className="fixed top-4 right-4 z-50">
            <CartIcon totalItems={totalItems} onClick={() => setCartOpen(true)} />
          </div>,
          document.body
        )} */}
      {!location.pathname.startsWith('/admin') &&
        cartOpen && (
          <CartPanel
            items={items}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
            onClose={() => setCartOpen(false)}
            showTotal={showCartTotal}
          />
        )}

      {!location.pathname.startsWith('/admin') && <WhatsAppButton />}

      <Routes>
        {/* Rutas del Catálogo Web (públicas) */}
        <Route path="/" element={
          <Home
            totalItems={totalItems}
            cartOpen={cartOpen}
            onCartClick={() => setCartOpen(true)}
            onQuickAdd={(item) => addItem(item)}
          />
        } />
        <Route path="/producto/:sku" element={<CatalogProductDetail onAddToCart={addItem} totalItems={totalItems} onCartClick={() => setCartOpen(true)} />} />
        <Route path="/cotizar" element={<Quote />} />
        <Route path="/gracias" element={<Thanks />} />

        {/* Rutas del Product Manager (protegidas) */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><Products /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/products/new" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><ProductNew /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/products/:id" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><ProductDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/excel/import" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><ExcelImport /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/excel/export" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><ExcelExport /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><Categories /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/quote-requests" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><QuoteRequests /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}