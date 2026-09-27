import fs from 'fs';
import path from 'path';
import { Reading, MeterEvent } from '../types';

function parseCsv(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = raw.split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = cells[i];
    });
    return row;
  });
}

let readingsCache: Reading[] | null = null;
let eventsCache: MeterEvent[] | null = null;

export function loadReadings(): Reading[] {
  if (readingsCache) return readingsCache;

  const filePath = path.join(__dirname, 'readings.csv');
  const rows = parseCsv(filePath);

  readingsCache = rows.map((row) => ({
    meter_id: row.meter_id,
    timestamp: row.timestamp,
    consumption_kwh: Number(row.consumption_kwh),
    voltage_v: Number(row.voltage_v),
    current_a: Number(row.current_a),
    power_factor: Number(row.power_factor),
    status: row.status,
  }));

  return readingsCache;
}

export function loadEvents(): MeterEvent[] {
  if (eventsCache) return eventsCache;

  const filePath = path.join(__dirname, 'events.csv');
  const rows = parseCsv(filePath);

  eventsCache = rows.map((row) => ({
    meter_id: row.meter_id,
    event_timestamp: row.event_timestamp,
    event_type: row.event_type,
    description: row.description,
  }));

  return eventsCache;
}

export function getMeterIds(): string[] {
  const readings = loadReadings();
  return Array.from(new Set(readings.map((r) => r.meter_id))).sort();
}

export function getReadingsForMeter(meterId: string): Reading[] {
  return loadReadings()
    .filter((r) => r.meter_id === meterId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function getEventsForMeter(meterId: string): MeterEvent[] {
  return loadEvents().filter((e) => e.meter_id === meterId);
}
