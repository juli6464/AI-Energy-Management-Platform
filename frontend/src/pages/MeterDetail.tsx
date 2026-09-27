import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchMeterDetail, fetchMeterReadings, runAiAnalysis } from '../api/client';
import { AnomalyReport, MeterDetail as MeterDetailType, MeterReading } from '../types';
import { StatusBadge, SeverityBadge } from '../components/Badges';

function formatTick(timestamp: string) {
  const d = new Date(timestamp.replace(' ', 'T'));
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}h`;
}

export default function MeterDetail() {
  const { meterId } = useParams<{ meterId: string }>();
  const [detail, setDetail] = useState<MeterDetailType | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<AnomalyReport | null>(null);

  useEffect(() => {
    if (!meterId) return;
    setLoading(true);
    Promise.all([fetchMeterDetail(meterId), fetchMeterReadings(meterId)])
      .then(([detailData, readingsData]) => {
        setDetail(detailData);
        setReadings(readingsData.readings);
      })
      .finally(() => setLoading(false));
  }, [meterId]);

  async function handleAnalyze() {
    if (!meterId) return;
    setAnalyzing(true);
    try {
      const result = await runAiAnalysis(meterId);
      setReport(result);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading || !detail) {
    return <p className="text-sm text-slate-500">Cargando medidor...</p>;
  }

  const chartData = readings.map((r) => ({
    ...r,
    baseline_kwh: detail.baseline_consumption_kwh,
    label: formatTick(r.timestamp),
  }));

  return (
    <div className="space-y-6">
      <Link to="/meters" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Volver a medidores
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{detail.meter_id}</h1>
          <p className="mt-1 text-sm text-slate-500">Detalle del medidor y series temporales</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={detail.status} />
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Run AI Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Consumo actual" value={`${detail.current_consumption_kwh} kWh`} />
        <StatBox label="Baseline" value={`${detail.baseline_consumption_kwh} kWh`} />
        <StatBox
          label="Variacion"
          value={`${detail.variation_pct >= 0 ? '+' : ''}${detail.variation_pct}%`}
          highlight={detail.variation_pct >= 0 ? 'red' : 'emerald'}
        />
        <StatBox label="Factor de potencia" value={detail.power_factor.toFixed(3)} />
      </div>

      {report && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="text-brand-600" size={18} />
              <h2 className="text-sm font-semibold text-slate-900">Resultado del analisis de IA</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{Math.round(report.confidence * 100)}% confianza</span>
              <SeverityBadge severity={report.severity} />
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Tipo</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{report.type}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Es anomalia</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{report.anomaly ? 'Si' : 'No'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-slate-400">Razon</dt>
              <dd className="mt-1 text-sm text-slate-700">{report.reason}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-slate-400">Accion recomendada</dt>
              <dd className="mt-1 text-sm text-slate-700">{report.recommended_action}</dd>
            </div>
          </dl>
        </div>
      )}

      <ChartCard title="Consumo vs Baseline (kWh)">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={23} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="consumption_kwh" name="Consumo" stroke="#3661f5" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="baseline_kwh" name="Baseline" stroke="#94a3b8" dot={false} strokeDasharray="5 5" strokeWidth={1.5} />
        </LineChart>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Voltaje (V)">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={47} />
            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="voltage_v" name="Voltaje" stroke="#f59e0b" dot={false} strokeWidth={2} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Corriente (A)">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={47} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="current_a" name="Corriente" stroke="#10b981" dot={false} strokeWidth={2} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Factor de potencia">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={47} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} />
            <Tooltip />
            <Line type="monotone" dataKey="power_factor" name="Factor de potencia" stroke="#ef4444" dot={false} strokeWidth={2} />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: 'red' | 'emerald' }) {
  const color = highlight === 'red' ? 'text-red-600' : highlight === 'emerald' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
