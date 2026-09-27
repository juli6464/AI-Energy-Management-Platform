# AI Energy Management Platform

MVP full-stack para la gestion de medidores electricos con un motor analitico/logico que **detecta, explica, prioriza y recomienda acciones** sobre anomalias de consumo.

## 1. Descripcion del proyecto

La plataforma carga en memoria las lecturas horarias de 12 medidores (`readings.csv`) y los eventos operativos registrados (`events.csv`), y expone una API REST que:

- Calcula metricas de consumo, variacion respecto a un baseline y estado (normal / alerta / critico) por medidor.
- Ejecuta un **motor de reglas** que compara el consumo actual contra el baseline y contra la ventana de un evento operativo conocido, y ademas evalua la consistencia de las lecturas electricas (voltaje, corriente, factor de potencia) para distinguir entre:
  - Anomalias reales sin explicacion operativa.
  - Anomalias explicables por un evento de negocio conocido.
  - Falsos positivos causados por eventos planificados (paradas programadas).
  - Problemas de calidad de datos del medidor (consumo estable pero lecturas electricas inconsistentes).

El frontend consume esta API y presenta un dashboard tipo SaaS con metricas globales, gestion de medidores, vista de detalle con graficas de series temporales y un listado global de anomalias.

## 2. Arquitectura y tecnologias

```
AI Energy Management Platform/
├── backend/     Node.js + Express + TypeScript (API REST + motor de reglas)
├── frontend/    React + Vite + TypeScript + Tailwind CSS + Recharts + Lucide Icons
├── readings.csv Datos de lecturas horarias (fuente original)
├── events.csv   Eventos operativos por medidor (fuente original)
└── README.md
```

**Backend**
- Node.js 18+, Express, TypeScript.
- Los CSV se parsean y se cargan **en memoria** al iniciar el servidor (sin base de datos externa).
- Motor de reglas en `backend/src/services/analytics.service.ts`.
- Rutas REST en `backend/src/routes/*`.
- jest para  testing de endpoints

**Frontend**
- React 18 + Vite + TypeScript.
- Tailwind CSS para el diseño.
- Recharts para las graficas de series temporales.
- Lucide Icons para la iconografia.
- React Router para la navegacion (Dashboard, Medidores, Detalle de medidor, Anomalias).

## 3. Instrucciones de instalacion

Requisitos: Node.js 18 o superior y npm.

### Backend

```bash
cd backend
npm install
npm run dev
```

El servidor arranca en `http://localhost:4001`. Al iniciar, la consola muestra cuantas lecturas y eventos se cargaron en memoria.

### Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`. El servidor de desarrollo de Vite tiene un proxy configurado (`/api` -> `http://localhost:4001`), por lo que no es necesario configurar CORS manualmente para el desarrollo local.

### Build de produccion (opcional)

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

## 4. Endpoints principales

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/dashboard/summary` | Resumen global: consumo total, medidores, anomalias, alta prioridad, confianza agregada |
| GET | `/api/meters` | Lista de medidores (`?search=` por ID, `?severity=all\|normal\|alert\|critical`) |
| GET | `/api/meters/:meterId` | Detalle de un medidor |
| GET | `/api/meters/:meterId/readings` | Serie temporal de lecturas del medidor |
| GET | `/api/anomalies` | Lista global de anomalias detectadas |
| POST | `/api/ai/analyze` | Ejecuta el analisis de IA (`{ "meter_id": "M-109" }`); sin `meter_id` analiza todos los medidores |

Respuesta del analisis de IA:

```json
{
  "meter_id": "M-109",
  "anomaly": true,
  "type": "Real Anomaly",
  "severity": "HIGH",
  "confidence": 0.9,
  "reason": "...",
  "recommended_action": "..."
}
```

### Tests de endpoints

```bash
cd backend
npm test
```

Los tests (Jest + Supertest, en `backend/tests/`) deberian responder **16 passed**. Cada endpoint se valida asi:

| Endpoint | Respuesta esperada |
|---|---|
| `GET /api/health` | `200` con `{ "status": "ok" }` |
| `GET /api/dashboard/summary` | `200` con `total_meters: 12` y los campos del resumen |
| `GET /api/meters` | `200` con 12 medidores; filtros `search`/`severity` aplicados; `400` si la severidad es invalida |
| `GET /api/meters/:meterId` | `200` con el detalle; `404` si no existe (ej. `M-999`) |
| `GET /api/meters/:meterId/readings` | `200` con lecturas ordenadas por fecha; `404` si no existe |
| `GET /api/anomalies` | `200` sin `Normal Operation`; incluye M-106 como `False Positive` |
| `POST /api/ai/analyze` | `200` con 12 reportes (sin body) o uno solo (`meter_id`); `404` si no existe |
| Ruta desconocida | `404` con `{ "error": "Not found" }` |

## 5. Acceso a la aplicacion

El frontend tiene una pantalla de **login basico** (solo del lado del cliente, sin backend de autenticacion) antes del Dashboard:

- **Usuario:** `admin`
- **Contraseña:** `abc-123`

La sesion se guarda en `localStorage` y se puede cerrar con el boton de logout en la parte inferior del sidebar. Este login es unicamente para dar el flujo de demo `Login → Dashboard → ...` pedido en la prueba tecnica; no reemplaza un sistema de autenticacion real (no hay usuarios, roles ni tokens en el backend).

## 6. Guia de casos evaluados (demo)

El motor de reglas fue calibrado y validado contra los 4 casos clave de la prueba tecnica. Desde la vista de **Detalle de Medidor**, buscar el `meter_id` y pulsar **"Run AI Analysis"**:

| Medidor | Escenario | Resultado esperado |
|---|---|---|
| **M-104** | Aumento de consumo (~47%) coincide con la activacion de una nueva linea productiva (evento `OPERATIONAL_CHANGE`) | `anomaly: true`, tipo **Explained Anomaly**, severidad **MEDIUM** |
| **M-106** | Caida puntual de consumo durante una parada programada de 12h (evento `SCHEDULED_OUTAGE`) | `anomaly: false`, tipo **False Positive**, severidad **LOW** (no se trata como anomalia real) |
| **M-109** | Aumento de consumo (~112%) sin ningun evento operativo que lo explique | `anomaly: true`, tipo **Real Anomaly**, severidad **HIGH**, confianza alta y accion recomendada de investigacion inmediata |
| **M-112** | Consumo estable (~0%) pero con voltaje y factor de potencia con lecturas inconsistentes (evento `DATA_QUALITY`) | `anomaly: true`, tipo **Data Quality Issue**, severidad **HIGH** |

Los 8 medidores restantes (M-101, M-102, M-103, M-105, M-107, M-108, M-110, M-111) no presentan variaciones significativas ni eventos asociados, por lo que el motor los clasifica como **Normal Operation**.

### Logica del motor de reglas (resumen)

1. **Calidad de datos**: si el consumo varia menos del 15% pero la desviacion de voltaje o del factor de potencia excede el umbral esperado, se marca como `Data Quality Issue` (HIGH).
2. **Sin cambio significativo**: si la variacion de consumo (global o en la ventana de 12h alrededor de un evento) es menor al 15%, se marca `Normal Operation`.
3. **Evento planificado**: si hay un cambio significativo que coincide con un evento tipo `SCHEDULED_OUTAGE`/`MAINTENANCE`, se marca `False Positive` (LOW, `anomaly: false`).
4. **Evento operativo conocido**: si hay un aumento significativo que coincide con un evento `OPERATIONAL_CHANGE` (o similar), se marca `Explained Anomaly` (MEDIUM).
5. **Sin explicacion**: cualquier otro cambio significativo se marca `Real Anomaly`, con severidad HIGH/MEDIUM segun la magnitud del cambio.
