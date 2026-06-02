import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Home from './catalog/pages/Home'
import CatalogProductDetail from './catalog/pages/ProductDetail'
import Quote from './catalog/pages/Quote'
import Thanks from './catalog/pages/Thanks'
import CartIcon from './catalog/components/CartIcon'
import CartPanel from './catalog/components/CartPanel'
import useCart from './catalog/hooks/useCart'
import Login from './admin/pages/Login'
import Dashboard from './admin/pages/Dashboard'
import Products from './admin/pages/Products'
import ProductDetail from './admin/pages/ProductDetail'
import ProductNew from './admin/pages/ProductNew'
import Categories from './admin/pages/Categories'
import QuoteRequests from './admin/pages/QuoteRequests'
import Settings from './admin/pages/Settings'
import Layout from './admin/components/Layout'
import ProtectedRoute from './admin/components/ProtectedRoute'

export default function App() {
  const { items, addItem, removeItem, updateQuantity, clearCart, totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas del Catálogo Web (públicas) */}
        <Route path="/" element={
          <div className="relative min-h-screen">
            <div className="fixed top-4 right-4 z-40">
              <CartIcon totalItems={totalItems} onClick={() => setCartOpen(true)} />
            </div>
            {cartOpen && (
              <CartPanel
                items={items}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
                onClose={() => setCartOpen(false)}
              />
            )}
            <Home />
          </div>
        } />
        <Route path="/producto/:sku" element={<CatalogProductDetail onAddToCart={addItem} />} />
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
    </BrowserRouter>
  )
}