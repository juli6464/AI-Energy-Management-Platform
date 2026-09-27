import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, User, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string })?.from ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(username.trim(), password.trim());
    if (ok) {
      const redirectTo = (location.state as { from?: string })?.from ?? '/';
      navigate(redirectTo, { replace: true });
    } else {
      setError('Usuario o contraseña incorrectos.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Zap size={22} />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-slate-900">AI Energy Management</h1>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Usuario</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Contraseña</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">Demo: usuario "admin", contraseña "abc-123"</p>
      </div>
    </div>
  );
}
