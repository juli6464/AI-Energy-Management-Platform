import { useEffect, useState } from 'react';
import { AlertTriangle, Gauge, ShieldCheck, Zap } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { SeverityBadge } from '../components/Badges';
import { fetchAnomalies, fetchDashboardSummary } from '../api/client';
import { AnomalyReport, DashboardSummary } from '../types';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardSummary(), fetchAnomalies()])
      .then(([summaryData, anomalyData]) => {
        setSummary(summaryData);
        setAnomalies(anomalyData.anomalies);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return <p className="text-sm text-slate-500">Cargando dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Resumen global de consumo energetico y anomalias detectadas por el motor de IA.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Consumo total" value={`${summary.total_consumption_kwh.toLocaleString()} kWh`} icon={Zap} accent="brand" />
        <MetricCard label="Medidores totales" value={String(summary.total_meters)} icon={Gauge} accent="brand" />
        <MetricCard label="Anomalias detectadas" value={String(summary.anomalies_detected)} icon={AlertTriangle} accent="amber" />
        <MetricCard label="Alta prioridad" value={String(summary.high_priority_anomalies)} icon={AlertTriangle} accent="red" />
        <MetricCard
          label="Confianza agregada"
          value={`${Math.round(summary.aggregate_confidence * 100)}%`}
          icon={ShieldCheck}
          accent="emerald"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Ultimas anomalias detectadas</h2>
          <span className="text-xs text-slate-400">
            {summary.last_analysis_run ? `Ultimo analisis: ${new Date(summary.last_analysis_run).toLocaleString()}` : 'Sin analisis reciente'}
          </span>
        </div>
        {anomalies.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No se detectaron anomalias en el ultimo analisis.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {anomalies.map((a) => (
              <li key={a.meter_id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {a.meter_id} <span className="text-slate-400">- {a.type}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{a.reason}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="text-xs text-slate-400">{Math.round(a.confidence * 100)}% confianza</span>
                  <SeverityBadge severity={a.severity} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
