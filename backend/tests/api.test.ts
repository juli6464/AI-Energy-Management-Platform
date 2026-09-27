import request from 'supertest';
import app from '../src/app';

describe('GET /api/health', () => {
  it('responde status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/dashboard/summary', () => {
  it('devuelve el resumen del dashboard', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total_consumption_kwh: expect.any(Number),
      total_meters: 12,
      anomalies_detected: expect.any(Number),
      high_priority_anomalies: expect.any(Number),
      aggregate_confidence: expect.any(Number),
      last_analysis_run: expect.any(String),
    });
    expect(res.body.high_priority_anomalies).toBeLessThanOrEqual(res.body.anomalies_detected);
  });
});

describe('GET /api/meters', () => {
  it('lista todos los medidores', async () => {
    const res = await request(app).get('/api/meters');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(12);
    expect(res.body.meters).toHaveLength(12);
    expect(res.body.meters[0]).toHaveProperty('meter_id');
    expect(res.body.meters[0]).not.toHaveProperty('anomalyReport');
  });

  it('filtra por search', async () => {
    const res = await request(app).get('/api/meters').query({ search: 'm-101' });
    expect(res.status).toBe(200);
    expect(res.body.meters.map((m: { meter_id: string }) => m.meter_id)).toEqual(['M-101']);
  });

  it('filtra por severity', async () => {
    const res = await request(app).get('/api/meters').query({ severity: 'critical' });
    expect(res.status).toBe(200);
    for (const meter of res.body.meters) {
      expect(meter.status).toBe('critical');
    }
  });

  it('rechaza una severity invalida con 400', async () => {
    const res = await request(app).get('/api/meters').query({ severity: 'foo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid severity/);
  });
});

describe('GET /api/meters/:meterId', () => {
  it('devuelve el detalle de un medidor existente', async () => {
    const res = await request(app).get('/api/meters/M-101');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      meter_id: 'M-101',
      voltage_v: expect.any(Number),
      current_a: expect.any(Number),
      power_factor: expect.any(Number),
    });
  });

  it('devuelve 404 si el medidor no existe', async () => {
    const res = await request(app).get('/api/meters/M-999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Meter M-999 not found');
  });
});

describe('GET /api/meters/:meterId/readings', () => {
  it('devuelve las lecturas ordenadas por timestamp', async () => {
    const res = await request(app).get('/api/meters/M-101/readings');
    expect(res.status).toBe(200);
    expect(res.body.meter_id).toBe('M-101');
    expect(res.body.readings.length).toBeGreaterThan(0);

    const timestamps: string[] = res.body.readings.map((r: { timestamp: string }) => r.timestamp);
    expect(timestamps).toEqual([...timestamps].sort());
  });

  it('devuelve 404 si el medidor no existe', async () => {
    const res = await request(app).get('/api/meters/M-999/readings');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/anomalies', () => {
  it('lista anomalias excluyendo Normal Operation', async () => {
    const res = await request(app).get('/api/anomalies');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(res.body.anomalies.length);
    for (const anomaly of res.body.anomalies) {
      expect(anomaly.type).not.toBe('Normal Operation');
    }
  });

  it('incluye M-106 como False Positive', async () => {
    const res = await request(app).get('/api/anomalies');
    const m106 = res.body.anomalies.find((a: { meter_id: string }) => a.meter_id === 'M-106');
    expect(m106).toMatchObject({ anomaly: false, type: 'False Positive', severity: 'LOW' });
  });
});

describe('POST /api/ai/analyze', () => {
  it('analiza todos los medidores si no se envia meter_id', async () => {
    const res = await request(app).post('/api/ai/analyze').send({});
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(12);
    expect(res.body.reports).toHaveLength(12);
    expect(typeof res.body.analyzed_at).toBe('string');
  });

  it('analiza un medidor especifico', async () => {
    const res = await request(app).post('/api/ai/analyze').send({ meter_id: 'M-104' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      meter_id: 'M-104',
      anomaly: expect.any(Boolean),
      type: expect.any(String),
      severity: expect.stringMatching(/^(HIGH|MEDIUM|LOW)$/),
      confidence: expect.any(Number),
    });
  });

  it('devuelve 404 si el meter_id no existe', async () => {
    const res = await request(app).post('/api/ai/analyze').send({ meter_id: 'M-999' });
    expect(res.status).toBe(404);
  });
});

describe('Rutas desconocidas', () => {
  it('devuelve 404 JSON', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});