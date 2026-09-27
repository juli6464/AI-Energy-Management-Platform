import { NavLink, useNavigate } from 'react-router-dom';
import { Gauge, LayoutDashboard, LogOut, TriangleAlert, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/meters', label: 'Medidores', icon: Gauge, end: false },
  { to: '/anomalies', label: 'Anomalias', icon: TriangleAlert, end: false },
];

export default function Sidebar() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Zap size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">AI Energy</p>
          <p className="text-xs leading-tight text-slate-500">Management Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-3 py-4">
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">{username}</p>
            <p className="text-xs text-slate-400">Sesion activa</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
