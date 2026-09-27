import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: 'brand' | 'amber' | 'red' | 'emerald';
  hint?: string;
}

const accentClasses: Record<NonNullable<MetricCardProps['accent']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

export default function MetricCard({ label, value, icon: Icon, accent = 'brand', hint }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
