import axios from 'axios';
import {
  AnomalyReport,
  DashboardSummary,
  MeterDetail,
  MeterReading,
  MeterStatus,
  MeterSummary,
} from '../types';

const api = axios.create({ baseURL: '/api' });

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}

export async function fetchMeters(params: {
  search?: string;
  severity?: 'all' | MeterStatus;
}): Promise<{ meters: MeterSummary[]; total: number }> {
  const { data } = await api.get('/meters', { params });
  return data;
}

export async function fetchMeterDetail(meterId: string): Promise<MeterDetail> {
  const { data } = await api.get<MeterDetail>(`/meters/${meterId}`);
  return data;
}

export async function fetchMeterReadings(meterId: string): Promise<{ meter_id: string; readings: MeterReading[] }> {
  const { data } = await api.get(`/meters/${meterId}/readings`);
  return data;
}

export async function fetchAnomalies(): Promise<{ anomalies: AnomalyReport[]; total: number }> {
  const { data } = await api.get('/anomalies');
  return data;
}

export async function runAiAnalysis(meterId: string): Promise<AnomalyReport> {
  const { data } = await api.post<AnomalyReport>('/ai/analyze', { meter_id: meterId });
  return data;
}
