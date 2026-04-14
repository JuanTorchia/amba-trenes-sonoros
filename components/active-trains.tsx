"use client";

import { motion } from "framer-motion";
import type { LineDefinition } from "@/lib/lines";
import type { ActiveTrain } from "@/lib/schedule";

export function ActiveTrainsList({
  trains,
  lines,
}: {
  trains: ActiveTrain[];
  lines: LineDefinition[];
}) {
  const colorByLine = Object.fromEntries(lines.map((l) => [l.id, l.color]));
  const visible = trains.slice(0, 18);

  if (visible.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] italic">
        Ningún tren en movimiento a esta hora. Probá mover el slider al horario pico.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5 font-mono text-sm">
      {visible.map((t) => (
        <motion.li
          key={t.tripId}
          layout
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          className="flex items-center gap-3 rounded px-2 py-1.5 bg-white/[0.02]"
        >
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: colorByLine[t.lineId] ?? "#fff" }}
          />
          <span className="text-white shrink-0">{t.routeName}</span>
          <span className="text-[var(--color-muted)] truncate flex-1">→ {t.headsign || "—"}</span>
          <span className="text-amber-400 shrink-0">{t.note}</span>
          <span className="text-[var(--color-muted)] text-xs w-10 text-right shrink-0">
            {Math.round(t.progress * 100)}%
          </span>
        </motion.li>
      ))}
      {trains.length > visible.length && (
        <li className="text-xs text-[var(--color-muted)] italic pt-1">
          + {trains.length - visible.length} más sonando en paralelo…
        </li>
      )}
    </ul>
  );
}
