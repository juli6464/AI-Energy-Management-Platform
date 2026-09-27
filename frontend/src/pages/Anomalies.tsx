import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { fetchAnomalies } from '../api/client';
import { AnomalyReport } from '../types';
import { SeverityBadge } from '../components/Badges';

// Mirrors the "Pantalla de Anomalias IA" example from the spec: each detected case
// (including false positives) maps to a short suggested action for the evaluator.
function suggestedAction(a: AnomalyReport): string {
  if (!a.anomaly) return 'No escalar';
  if (a.type === 'Data Quality Issue') return 'Validar sensor';
  if (a.severity === 'HIGH') return 'Investigar';
  if (a.severity === 'MEDIUM') return 'Validar operacion';
  return 'Monitorear';
}

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnomalies()
      .then((data) => setAnomalies(data.anomalies))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Anomalias</h1>
        <p className="mt-1 text-sm text-slate-500">Listado global de anomalias detectadas por el motor de IA.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Meter ID</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Severidad</th>
              <th className="px-5 py-3 font-medium">Confianza</th>
              <th className="px-5 py-3 font-medium">Razon</th>
              <th className="px-5 py-3 font-medium">Accion sugerida</th>
              <th className="px-5 py-3 font-medium text-right">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                  Cargando anomalias...
                </td>
              </tr>
            ) : anomalies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                  No hay anomalias detectadas.
                </td>
              </tr>
            ) : (
              anomalies.map((a) => (
                <tr key={a.meter_id} className={`align-top hover:bg-slate-50 ${!a.anomaly ? 'opacity-70' : ''}`}>
                  <td className="px-5 py-3 font-medium text-slate-900">{a.meter_id}</td>
                  <td className="px-5 py-3 text-slate-600">{a.type}</td>
                  <td className="px-5 py-3">
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{Math.round(a.confidence * 100)}%</td>
                  <td className="max-w-md px-5 py-3 text-slate-500">{a.reason}</td>
                  <td className="px-5 py-3 text-slate-600">{suggestedAction(a)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => navigate(`/meters/${a.meter_id}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      <Eye size={14} /> Ver medidor
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
