import app from './app';
import { loadReadings, loadEvents } from './data/loader';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

const readings = loadReadings();
const events = loadEvents();

console.log(`[data] Loaded ${readings.length} readings and ${events.length} events into memory.`);

app.listen(PORT, () => {
  console.log(`[server] AI Energy Management API listening on http://localhost:${PORT}`);
});
