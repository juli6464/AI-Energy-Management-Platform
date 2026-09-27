import { getReadingsForMeter, getEventsForMeter, getMeterIds } from '../data/loader';
import { AnomalyReport, MeterDetail, MeterSummary, MeterStatus, Reading, Severity } from '../types';

const CANDIDATE_VARIATION_THRESHOLD = 15; // % change considered worth investigating
const HIGH_VARIATION_THRESHOLD = 80; // % change considered a severe spike
const MEDIUM_VARIATION_THRESHOLD = 30; // % change considered a moderate spike

const VOLTAGE_STDEV_THRESHOLD = 3.0; // volts
const PF_STDEV_THRESHOLD = 0.045;
const PF_MIN_THRESHOLD = 0.65;

const PLANNED_EVENT_TYPES = new Set(['SCHEDULED_OUTAGE', 'MAINTENANCE', 'PLANNED_MAINTENANCE']);
const OPERATIONAL_EVENT_TYPES = new Set(['OPERATIONAL_CHANGE', 'NEW_EQUIPMENT', 'CAPACITY_EXPANSION']);

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

function pctVariation(baseline: number, recent: number): number {
  if (baseline === 0) return recent === 0 ? 0 : 100;
  return ((recent - baseline) / baseline) * 100;
}

interface MeterStats {
  meterId: string;
  readings: Reading[];
  currentConsumption: number;
  baselineConsumption: number;
  variationPct: number;
  eventWindowVariationPct: number | null;
  voltage: number;
  current: number;
  powerFactor: number;
  voltageStdev: number;
  powerFactorStdev: number;
  powerFactorMin: number;
  lastReadingTimestamp: string;
  matchedEvent: { event_type: string; description: string; event_timestamp: string } | null;
}

function computeMeterStats(meterId: string): MeterStats {
  const readings = getReadingsForMeter(meterId);
  const events = getEventsForMeter(meterId);
  const primaryEvent = events[0] ?? null;

  const consumptions = readings.map((r) => r.consumption_kwh);
  const voltages = readings.map((r) => r.voltage_v);
  const powerFactors = readings.map((r) => r.power_factor);

  const splitTimestamp = primaryEvent ? primaryEvent.event_timestamp : readings[Math.floor(readings.length / 2)]?.timestamp;

  const before = readings.filter((r) => r.timestamp < splitTimestamp).map((r) => r.consumption_kwh);
  const after = readings.filter((r) => r.timestamp >= splitTimestamp).map((r) => r.consumption_kwh);

  const baselineConsumption = mean(before.length > 0 ? before : consumptions);
  const currentConsumption = mean(after.length > 0 ? after : consumptions);
  const variationPct = pctVariation(baselineConsumption, currentConsumption);

  let eventWindowVariationPct: number | null = null;
  if (primaryEvent) {
    const eventTime = new Date(primaryEvent.event_timestamp.replace(' ', 'T')).getTime();
    const windowMs = 12 * 60 * 60 * 1000;
    const windowReadings = readings.filter((r) => {
      const t = new Date(r.timestamp.replace(' ', 'T')).getTime();
      return t >= eventTime && t <= eventTime + windowMs;
    });
    const outsideWindowReadings = readings.filter((r) => {
      const t = new Date(r.timestamp.replace(' ', 'T')).getTime();
      return t < eventTime || t > eventTime + windowMs;
    });
    if (windowReadings.length > 0 && outsideWindowReadings.length > 0) {
      const windowAvg = mean(windowReadings.map((r) => r.consumption_kwh));
      const outsideAvg = mean(outsideWindowReadings.map((r) => r.consumption_kwh));
      eventWindowVariationPct = pctVariation(outsideAvg, windowAvg);
    }
  }

  const lastReading = readings[readings.length - 1];

  return {
    meterId,
    readings,
    currentConsumption,
    baselineConsumption,
    variationPct,
    eventWindowVariationPct,
    voltage: lastReading?.voltage_v ?? 0,
    current: lastReading?.current_a ?? 0,
    powerFactor: lastReading?.power_factor ?? 0,
    voltageStdev: stdev(voltages),
    powerFactorStdev: stdev(powerFactors),
    powerFactorMin: powerFactors.length > 0 ? Math.min(...powerFactors) : 0,
    lastReadingTimestamp: lastReading?.timestamp ?? '',
    matchedEvent: primaryEvent
      ? {
          event_type: primaryEvent.event_type,
          description: primaryEvent.description,
          event_timestamp: primaryEvent.event_timestamp,
        }
      : null,
  };
}

function buildAnomalyReport(stats: MeterStats): AnomalyReport {
  const {
    meterId,
    variationPct,
    eventWindowVariationPct,
    voltageStdev,
    powerFactorStdev,
    powerFactorMin,
    matchedEvent,
  } = stats;

  const hasElectricalInconsistency =
    voltageStdev > VOLTAGE_STDEV_THRESHOLD || powerFactorStdev > PF_STDEV_THRESHOLD || powerFactorMin < PF_MIN_THRESHOLD;

  // Rule 1: Data quality issue — consumption stable but electrical signals are inconsistent.
  if (Math.abs(variationPct) < CANDIDATE_VARIATION_THRESHOLD && hasElectricalInconsistency) {
    return {
      meter_id: meterId,
      anomaly: true,
      type: 'Data Quality Issue',
      severity: 'HIGH',
      confidence: 0.88,
      reason: `El consumo se mantiene estable (variacion de ${variationPct.toFixed(
        1
      )}%), pero se detectan lecturas electricas inconsistentes: desviacion de voltaje de ${voltageStdev.toFixed(
        2
      )}V y factor de potencia minimo de ${powerFactorMin.toFixed(
        2
      )} (fuera del rango esperado). Esto sugiere un problema de calidad de datos del medidor, no una anomalia real de consumo.`,
      recommended_action: 'Inspeccionar y calibrar el medidor; validar el sensor de voltaje/corriente y revisar la integridad de la transmision de datos.',
    };
  }

  const largestMagnitude =
    eventWindowVariationPct !== null && Math.abs(eventWindowVariationPct) > Math.abs(variationPct)
      ? eventWindowVariationPct
      : variationPct;

  const isSignificantChange = Math.abs(largestMagnitude) >= CANDIDATE_VARIATION_THRESHOLD;

  // Rule 2: No significant change — normal operation.
  if (!isSignificantChange) {
    return {
      meter_id: meterId,
      anomaly: false,
      type: 'Normal Operation',
      severity: 'LOW',
      confidence: 0.95,
      reason: `El consumo se mantiene dentro del rango esperado (variacion de ${variationPct.toFixed(1)}%) sin senales electricas anomalas.`,
      recommended_action: 'No se requiere accion. Continuar con el monitoreo estandar.',
    };
  }

  // Rule 3: Significant change explained by a known operational event.
  if (matchedEvent && PLANNED_EVENT_TYPES.has(matchedEvent.event_type)) {
    return {
      meter_id: meterId,
      anomaly: false,
      type: 'False Positive',
      severity: 'LOW',
      confidence: 0.87,
      reason: `Se detecto una variacion puntual (${(eventWindowVariationPct ?? variationPct).toFixed(
        1
      )}%) alrededor del ${matchedEvent.event_timestamp}, coincidiendo con un evento programado: "${
        matchedEvent.description
      }". El cambio es esperado y no representa una anomalia real.`,
      recommended_action: 'Ninguna accion requerida. Registrar el evento como causa conocida para evitar falsas alertas futuras.',
    };
  }

  if (matchedEvent && OPERATIONAL_EVENT_TYPES.has(matchedEvent.event_type) && variationPct > 0) {
    return {
      meter_id: meterId,
      anomaly: true,
      type: 'Explained Anomaly',
      severity: 'MEDIUM',
      confidence: 0.76,
      reason: `El consumo aumento un ${variationPct.toFixed(1)}% respecto al baseline, coincidiendo con el evento operativo: "${
        matchedEvent.description
      }" (${matchedEvent.event_timestamp}). El incremento tiene una explicacion operativa conocida.`,
      recommended_action: 'Validar que el incremento este dentro de la capacidad contratada y monitorear la nueva linea/carga.',
    };
  }

  // Rule 4: Significant, unexplained change — treat as a real anomaly.
  const magnitude = Math.abs(variationPct);
  const severity: Severity = magnitude >= HIGH_VARIATION_THRESHOLD ? 'HIGH' : magnitude >= MEDIUM_VARIATION_THRESHOLD ? 'MEDIUM' : 'LOW';
  const confidence = magnitude >= HIGH_VARIATION_THRESHOLD ? 0.9 : magnitude >= MEDIUM_VARIATION_THRESHOLD ? 0.78 : 0.6;
  const direction = variationPct >= 0 ? 'aumento' : 'disminucion';

  return {
    meter_id: meterId,
    anomaly: true,
    type: 'Real Anomaly',
    severity,
    confidence,
    reason: `Se detecto un ${direction} de ${magnitude.toFixed(
      1
    )}% en el consumo sin ningun evento operativo conocido que lo explique.${
      matchedEvent ? ` Evento registrado sin causa clara: "${matchedEvent.description}".` : ''
    }`,
    recommended_action:
      severity === 'HIGH'
        ? 'Investigar de inmediato: inspeccionar el medidor y la instalacion electrica, y verificar posible fuga, fraude o falla de equipo.'
        : 'Programar una revision tecnica para confirmar la causa del cambio de consumo.',
  };
}

export function analyzeMeter(meterId: string): AnomalyReport {
  const stats = computeMeterStats(meterId);
  return buildAnomalyReport(stats);
}

export function analyzeAllMeters(): AnomalyReport[] {
  return getMeterIds().map((id) => analyzeMeter(id));
}

function statusFromReport(report: AnomalyReport): MeterStatus {
  if (!report.anomaly) return 'normal';
  if (report.severity === 'HIGH') return 'critical';
  return 'alert';
}

export function getMeterSummaries(): (MeterSummary & { anomalyReport: AnomalyReport })[] {
  return getMeterIds().map((meterId) => {
    const stats = computeMeterStats(meterId);
    const anomalyReport = buildAnomalyReport(stats);
    return {
      meter_id: meterId,
      current_consumption_kwh: Number(stats.currentConsumption.toFixed(2)),
      baseline_consumption_kwh: Number(stats.baselineConsumption.toFixed(2)),
      variation_pct: Number(stats.variationPct.toFixed(1)),
      status: statusFromReport(anomalyReport),
      last_reading_timestamp: stats.lastReadingTimestamp,
      anomalyReport,
    };
  });
}

export function getMeterDetail(meterId: string): MeterDetail | null {
  const readings = getReadingsForMeter(meterId);
  if (readings.length === 0) return null;

  const stats = computeMeterStats(meterId);
  const anomalyReport = buildAnomalyReport(stats);

  return {
    meter_id: meterId,
    current_consumption_kwh: Number(stats.currentConsumption.toFixed(2)),
    baseline_consumption_kwh: Number(stats.baselineConsumption.toFixed(2)),
    variation_pct: Number(stats.variationPct.toFixed(1)),
    voltage_v: stats.voltage,
    current_a: stats.current,
    power_factor: stats.powerFactor,
    status: statusFromReport(anomalyReport),
    last_reading_timestamp: stats.lastReadingTimestamp,
  };
}

// "Detected" = every meter the engine flagged for review (Real Anomaly, Explained
// Anomaly, False Positive, Data Quality Issue). A False Positive is still a detection
// surfaced by the engine — it is only downgraded (anomaly:false) after correlating it
// with a known operational event. This mirrors the spec's dashboard example ("4
// anomalias detectadas / 2 alta prioridad"), which counts all 4 flagged test meters,
// including M-106 (false positive).
export function isDetectedCandidate(report: AnomalyReport): boolean {
  return report.type !== 'Normal Operation';
}

export function getDashboardData() {
  const summaries = getMeterSummaries();
  const totalConsumption = summaries.reduce((sum, m) => sum + m.current_consumption_kwh, 0);
  const detected = summaries.filter((m) => isDetectedCandidate(m.anomalyReport));
  const highPriority = detected.filter((m) => m.anomalyReport.severity === 'HIGH');
  const aggregateConfidence =
    detected.length > 0 ? detected.reduce((sum, m) => sum + m.anomalyReport.confidence, 0) / detected.length : 0;

  return {
    total_consumption_kwh: Number(totalConsumption.toFixed(2)),
    total_meters: summaries.length,
    anomalies_detected: detected.length,
    high_priority_anomalies: highPriority.length,
    aggregate_confidence: Number(aggregateConfidence.toFixed(2)),
    last_analysis_run: new Date().toISOString(),
  };
}
