/**
 * Dataset sintético mínimo.
 *
 * Se usa cuando el build no puede bajar el GTFS real (CI sin red, mirror caído,
 * primera clonada del repo sin `pnpm gtfs:fetch`). Genera horarios plausibles
 * para cada línea para que la demo nunca esté "en silencio".
 *
 * NO reemplaza a los datos reales: al correr `pnpm gtfs:fetch` se sobrescribe.
 */

import { LINES } from "../lib/lines";
import type { ScheduleFile } from "./build-gtfs";

function buildFakeTrips(): ScheduleFile["trips"] {
  const trips: ScheduleFile["trips"] = [];
  for (const line of LINES) {
    // ~ un tren cada 20 minutos entre las 05:00 y las 23:40, ambos sentidos
    for (let minute = 5 * 60; minute <= 23 * 60 + 40; minute += 20) {
      for (const direction of ["ida", "vuelta"]) {
        trips.push({
          tripId: `${line.id}-${minute}-${direction}`,
          lineId: line.id,
          routeName: line.name,
          headsign: direction === "ida" ? "Cabecera" : "Retiro",
          startsAtMinute: minute,
          durationMinutes: 45,
        });
      }
    }
  }
  return trips;
}

export const FALLBACK_SCHEDULE: ScheduleFile = {
  generatedAt: new Date().toISOString(),
  source: "fallback-synthetic",
  lines: LINES,
  trips: buildFakeTrips(),
};
