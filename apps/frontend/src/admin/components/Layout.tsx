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

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const filteredNav = navItems.filter(item => role && item.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-extrabold text-blue-600">ITSHA</h1>
          <p className="text-xs text-gray-400 mt-1">Product Manager</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}