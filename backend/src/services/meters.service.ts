import { getReadingsForMeter, getMeterIds } from '../data/loader';
import { getMeterSummaries } from './analytics.service';
import { MeterStatus } from '../types';

export interface MeterListFilters {
  search?: string;
  severity?: 'all' | MeterStatus;
}

export function listMeters(filters: MeterListFilters) {
  let meters = getMeterSummaries().map(({ anomalyReport, ...meter }) => meter);

  if (filters.search) {
    const term = filters.search.trim().toLowerCase();
    meters = meters.filter((m) => m.meter_id.toLowerCase().includes(term));
  }

  if (filters.severity && filters.severity !== 'all') {
    meters = meters.filter((m) => m.status === filters.severity);
  }

  return meters;
}

export function meterExists(meterId: string): boolean {
  return getMeterIds().includes(meterId);
}

export function listMeterReadings(meterId: string) {
  return getReadingsForMeter(meterId).map((r) => ({
    timestamp: r.timestamp,
    consumption_kwh: r.consumption_kwh,
    voltage_v: r.voltage_v,
    current_a: r.current_a,
    power_factor: r.power_factor,
    status: r.status,
  }));
}
