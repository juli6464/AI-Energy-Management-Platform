export interface Reading {
  meter_id: string;
  timestamp: string;
  consumption_kwh: number;
  voltage_v: number;
  current_a: number;
  power_factor: number;
  status: string;
}

export interface MeterEvent {
  meter_id: string;
  event_timestamp: string;
  event_type: string;
  description: string;
}

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export type MeterStatus = 'normal' | 'alert' | 'critical';

export interface AnomalyReport {
  meter_id: string;
  anomaly: boolean;
  type: string;
  severity: Severity;
  confidence: number;
  reason: string;
  recommended_action: string;
}

export interface MeterSummary {
  meter_id: string;
  current_consumption_kwh: number;
  baseline_consumption_kwh: number;
  variation_pct: number;
  status: MeterStatus;
  last_reading_timestamp: string;
}

export interface MeterDetail {
  meter_id: string;
  current_consumption_kwh: number;
  baseline_consumption_kwh: number;
  variation_pct: number;
  voltage_v: number;
  current_a: number;
  power_factor: number;
  status: MeterStatus;
  last_reading_timestamp: string;
}

export interface DashboardSummary {
  total_consumption_kwh: number;
  total_meters: number;
  anomalies_detected: number;
  high_priority_anomalies: number;
  aggregate_confidence: number;
  last_analysis_run: string | null;
}
