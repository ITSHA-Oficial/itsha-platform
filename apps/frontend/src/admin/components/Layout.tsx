import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', roles: ['admin', 'vendedor'] },
  { label: 'Productos', path: '/admin/products', roles: ['admin', 'vendedor'] },
  { label: 'Categorías', path: '/admin/categories', roles: ['admin'] },
  { label: 'Cotizaciones', path: '/admin/quote-requests', roles: ['admin', 'vendedor'] },
  { label: 'Importar Excel', path: '/admin/excel/import', roles: ['admin'] },
  { label: 'Exportar Excel', path: '/admin/excel/export', roles: ['admin'] },
  { label: 'Versiones', path: '/admin/catalog/versions', roles: ['admin'] },
  { label: 'Auditoría', path: '/admin/audit', roles: ['admin'] },
  { label: 'Configuración', path: '/admin/settings', roles: ['admin'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const filteredNav = navItems.filter(item => role && item.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay oscuro para móviles cuando la barra está abierta */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Barra lateral colapsable */}
      <aside
        className={`fixed lg:relative z-50 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Cabecera de la barra */}
        <div className={`p-4 border-b flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <>
              <h1 className="text-xl font-extrabold text-blue-600">ITSHA</h1>
              <button
                onClick={closeSidebar}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Cerrar menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          {!sidebarOpen && (
            <span className="text-xl font-extrabold text-blue-600">I</span>
          )}
        </div>

        {/* Enlaces de navegación */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-lg flex-shrink-0">
                {item.label === 'Dashboard' && '📊'}
                {item.label === 'Productos' && '📦'}
                {item.label === 'Categorías' && '🏷️'}
                {item.label === 'Cotizaciones' && '📋'}
                {item.label === 'Importar Excel' && '📥'}
                {item.label === 'Exportar Excel' && '📤'}
                {item.label === 'Versiones' && '🔄'}
                {item.label === 'Auditoría' && '🔍'}
                {item.label === 'Configuración' && '⚙️'}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Botón de cerrar sesión */}
        <div className="p-2 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {sidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-4 lg:p-8">
        {/* Botón de hamburguesa (visible en móvil y cuando la barra está cerrada en escritorio) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden mb-4 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <span className="block w-5 h-0.5 bg-gray-600 rounded-full"></span>
          <span className="block w-5 h-0.5 bg-gray-600 rounded-full"></span>
          <span className="block w-5 h-0.5 bg-gray-600 rounded-full"></span>
        </button>
        {children}
      </main>
    </div>
  );
}