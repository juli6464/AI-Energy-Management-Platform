import { MeterStatus, Severity } from '../types';

const statusStyles: Record<MeterStatus, string> = {
  normal: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  alert: 'bg-amber-50 text-amber-700 ring-amber-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
};

const statusLabels: Record<MeterStatus, string> = {
  normal: 'Normal',
  alert: 'Alerta',
  critical: 'Critico',
};

export function StatusBadge({ status }: { status: MeterStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

const severityStyles: Record<Severity, string> = {
  HIGH: 'bg-red-50 text-red-700 ring-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
  LOW: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${severityStyles[severity]}`}>
      {severity}
    </span>
  );
}
