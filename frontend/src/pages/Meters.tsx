import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { fetchMeters } from '../api/client';
import { MeterStatus, MeterSummary } from '../types';
import { StatusBadge } from '../components/Badges';

const FILTERS: Array<{ label: string; value: 'all' | MeterStatus }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Normal', value: 'normal' },
  { label: 'Alerta', value: 'alert' },
  { label: 'Critico', value: 'critical' },
];

export default function Meters() {
  const [meters, setMeters] = useState<MeterSummary[]>([]);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'all' | MeterStatus>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      fetchMeters({ search: search || undefined, severity })
        .then((data) => setMeters(data.meters))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timeout);
  }, [search, severity]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Medidores</h1>
        <p className="mt-1 text-sm text-slate-500">Gestion y monitoreo de todos los medidores electricos registrados.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por meter_id..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSeverity(f.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                severity === f.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Meter ID</th>
              <th className="px-5 py-3 font-medium">Consumo actual</th>
              <th className="px-5 py-3 font-medium">Baseline</th>
              <th className="px-5 py-3 font-medium">Variacion</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Ultima lectura</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Cargando medidores...
                </td>
              </tr>
            ) : meters.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  No se encontraron medidores.
                </td>
              </tr>
            ) : (
              meters.map((m) => (
                <tr
                  key={m.meter_id}
                  onClick={() => navigate(`/meters/${m.meter_id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-medium text-slate-900">{m.meter_id}</td>
                  <td className="px-5 py-3 text-slate-600">{m.current_consumption_kwh.toLocaleString()} kWh</td>
                  <td className="px-5 py-3 text-slate-600">{m.baseline_consumption_kwh.toLocaleString()} kWh</td>
                  <td className={`px-5 py-3 font-medium ${m.variation_pct >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {m.variation_pct >= 0 ? '+' : ''}
                    {m.variation_pct}%
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">{m.last_reading_timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
