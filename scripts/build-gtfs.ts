/**
 * Build-time GTFS → JSON pipeline.
 *
 * Qué hace
 * ========
 * 1. Intenta bajar el GTFS estático más reciente desde datos.gob.ar.
 * 2. Descomprime el zip y parsea `routes.txt`, `trips.txt` y `stop_times.txt`.
 * 3. Normaliza todo a un único archivo: `data/schedule.json`.
 * 4. Si falla la descarga, mantiene el snapshot committeado (no rompe el build).
 *
 * Por qué así
 * ===========
 * Vercel no tiene filesystem persistente y queremos deploys deterministas.
 * Correr el parser en `prebuild` genera un JSON plano que el runtime consume
 * sin red ni fs: todo el schedule vive en el bundle estático.
 *
 * Fuentes (orden de preferencia):
 *   - https://datos.gob.ar/dataset/transporte-gtfs-trenes-amba (SOFSE + Belgrano Cargas)
 *   - https://servicios.transporte.gob.ar/gtfs/
 *
 * Si no hay red en CI, usamos un dataset mínimo sintético (ver `fallback-data.ts`).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import { LINES, findLineForRouteName, type LineDefinition } from "../lib/lines";
import { FALLBACK_SCHEDULE } from "./fallback-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const RAW_DIR = join(DATA_DIR, "raw");

const GTFS_SOURCES = [
  "https://datos.gob.ar/media/dataset/gtfs-trenes-amba.zip",
  "https://servicios.transporte.gob.ar/gtfs/sofse.zip",
];

interface ScheduleEntry {
  tripId: string;
  lineId: string;
  routeName: string;
  headsign: string;
  /** minuto del día en que arranca el viaje (0–1439) */
  startsAtMinute: number;
  /** duración estimada en minutos */
  durationMinutes: number;
}

export interface ScheduleFile {
  generatedAt: string;
  source: string;
  lines: LineDefinition[];
  trips: ScheduleEntry[];
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").replace(/"/g, "").trim()]));
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function hhmmssToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h * 60 + m) % (24 * 60);
}

async function tryDownload(): Promise<Buffer | null> {
  for (const url of GTFS_SOURCES) {
    try {
      console.log(`[gtfs] intentando ${url}`);
      const res = await fetch(url, { headers: { "User-Agent": "amba-trenes-sonoros/0.1" } });
      if (!res.ok) {
        console.warn(`[gtfs] ${url} respondió ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      console.log(`[gtfs] bajado ${(buf.length / 1024).toFixed(0)}KB desde ${url}`);
      return buf;
    } catch (err) {
      console.warn(`[gtfs] fallo ${url}: ${(err as Error).message}`);
    }
  }
  return null;
}

function parseGtfs(zipBuffer: Buffer, sourceUrl: string): ScheduleFile {
  const zip = new AdmZip(zipBuffer);
  const read = (name: string) => {
    const entry = zip.getEntry(name);
    if (!entry) throw new Error(`GTFS sin ${name}`);
    return entry.getData().toString("utf-8");
  };

  const routes = parseCsv(read("routes.txt"));
  const trips = parseCsv(read("trips.txt"));
  const stopTimes = parseCsv(read("stop_times.txt"));

  // routeId -> LineDefinition (solo rutas que matchean nuestras líneas AMBA)
  const routeToLine = new Map<string, LineDefinition>();
  for (const r of routes) {
    const name = `${r.route_long_name ?? ""} ${r.route_short_name ?? ""}`.trim();
    const line = findLineForRouteName(name);
    if (line) routeToLine.set(r.route_id, line);
  }

  // tripId -> primer y último stop_time (para start + duración)
  const tripTimes = new Map<string, { start: number; end: number }>();
  for (const st of stopTimes) {
    const current = tripTimes.get(st.trip_id);
    const t = hhmmssToMinutes(st.departure_time || st.arrival_time);
    if (!current) tripTimes.set(st.trip_id, { start: t, end: t });
    else tripTimes.set(st.trip_id, { start: Math.min(current.start, t), end: Math.max(current.end, t) });
  }

  const out: ScheduleEntry[] = [];
  for (const t of trips) {
    const line = routeToLine.get(t.route_id);
    if (!line) continue;
    const times = tripTimes.get(t.trip_id);
    if (!times) continue;
    out.push({
      tripId: t.trip_id,
      lineId: line.id,
      routeName: line.name,
      headsign: t.trip_headsign || "",
      startsAtMinute: times.start,
      durationMinutes: Math.max(1, times.end - times.start),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    source: sourceUrl,
    lines: LINES,
    trips: out,
  };
}

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true });

  const outputPath = join(DATA_DIR, "schedule.json");

  const zipBuffer = await tryDownload();
  let schedule: ScheduleFile;

  if (zipBuffer) {
    try {
      schedule = parseGtfs(zipBuffer, GTFS_SOURCES[0]);
      writeFileSync(join(RAW_DIR, "gtfs.zip"), zipBuffer);
      console.log(`[gtfs] parseado OK: ${schedule.trips.length} viajes en ${schedule.lines.length} líneas`);
    } catch (err) {
      console.error(`[gtfs] error parseando: ${(err as Error).message}`);
      schedule = { ...FALLBACK_SCHEDULE, source: "fallback (parse error)" };
    }
  } else if (existsSync(outputPath)) {
    console.log("[gtfs] sin red, conservando schedule.json existente");
    return;
  } else {
    console.log("[gtfs] sin red + sin snapshot previo, usando FALLBACK_SCHEDULE");
    schedule = FALLBACK_SCHEDULE;
  }

  writeFileSync(outputPath, JSON.stringify(schedule, null, 2));
  console.log(`[gtfs] escribí ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
