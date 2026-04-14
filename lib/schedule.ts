/**
 * Runtime del horario.
 *
 * El JSON generado en build contiene todos los viajes de un día típico.
 * Dada una hora cualquiera del día, este módulo responde: "¿qué trenes están
 * en movimiento AHORA?". La respuesta alimenta al sintetizador.
 */

import scheduleData from "@/data/schedule.json";
import type { ScheduleFile } from "@/scripts/build-gtfs";
import { noteForIndex } from "./scales";

const schedule = scheduleData as unknown as ScheduleFile;

export interface ActiveTrain {
  tripId: string;
  lineId: string;
  routeName: string;
  headsign: string;
  /** nota asignada (pentatónica, determinística por trip) */
  note: string;
  /** 0..1 — progreso del viaje en el momento consultado */
  progress: number;
}

/**
 * Devuelve los trenes activos a una hora dada (minuto del día 0..1439).
 *
 * Un tren "está activo" si:
 *   startsAtMinute <= nowMinute < startsAtMinute + durationMinutes
 *
 * Nota: GTFS permite horas > 24:00 para viajes que cruzan medianoche.
 * Normalizamos a mod 1440 en el parser, lo cual es una decisión deliberada:
 * preferimos simplificar a costa de perder precisión en los pocos viajes
 * nocturnos (casi ninguno en AMBA).
 */
export function getActiveTrainsAt(nowMinute: number): ActiveTrain[] {
  const minute = ((nowMinute % 1440) + 1440) % 1440;
  const out: ActiveTrain[] = [];
  for (const trip of schedule.trips) {
    const end = trip.startsAtMinute + trip.durationMinutes;
    if (minute >= trip.startsAtMinute && minute < end) {
      const progress = (minute - trip.startsAtMinute) / trip.durationMinutes;
      out.push({
        tripId: trip.tripId,
        lineId: trip.lineId,
        routeName: trip.routeName,
        headsign: trip.headsign,
        note: noteForIndex(trip.startsAtMinute),
        progress,
      });
    }
  }
  return out;
}

export function getLines() {
  return schedule.lines;
}

export function getScheduleMeta() {
  return { generatedAt: schedule.generatedAt, source: schedule.source, totalTrips: schedule.trips.length };
}

export function nowToMinute(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}
