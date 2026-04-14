"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Clock } from "lucide-react";
import type { LineDefinition } from "@/lib/lines";
import { getActiveTrainsAt, nowToMinute, type ActiveTrain } from "@/lib/schedule";
import { TrainsConductor } from "@/lib/sonify";
import { LinePanel } from "./line-panel";
import { ActiveTrainsList } from "./active-trains";
import { cn } from "@/lib/cn";

const TICK_MS = 5000;

export function Player({ lines }: { lines: LineDefinition[] }) {
  const [playing, setPlaying] = useState(false);
  const [minute, setMinute] = useState<number>(() => nowToMinute());
  const [followClock, setFollowClock] = useState(true);
  const [active, setActive] = useState<ActiveTrain[]>([]);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const conductorRef = useRef<TrainsConductor | null>(null);

  // Instanciamos el conductor una sola vez
  useEffect(() => {
    conductorRef.current = new TrainsConductor(lines);
    return () => conductorRef.current?.stop();
  }, [lines]);

  // Recalculo de trenes activos cada vez que cambia el minuto
  useEffect(() => {
    setActive(getActiveTrainsAt(minute));
  }, [minute]);

  // Loop principal: avanza reloj si seguimos tiempo real, y dispara sonido
  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      if (followClock) setMinute(nowToMinute());
      const current = getActiveTrainsAt(followClock ? nowToMinute() : minute);
      setActive(current);
      conductorRef.current?.playTick(current);
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [playing, followClock, minute]);

  const togglePlay = useCallback(async () => {
    if (!playing) {
      await conductorRef.current?.start();
      setPlaying(true);
    } else {
      conductorRef.current?.stop();
      conductorRef.current = new TrainsConductor(lines);
      setPlaying(false);
    }
  }, [playing, lines]);

  const toggleMute = useCallback((lineId: string) => {
    setMuted((prev) => {
      const next = { ...prev, [lineId]: !prev[lineId] };
      conductorRef.current?.setMuted(lineId, next[lineId]);
      return next;
    });
  }, []);

  const setLineVolume = useCallback((lineId: string, db: number) => {
    conductorRef.current?.setLineVolumeDb(lineId, db);
  }, []);

  const countsByLine = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of active) c[t.lineId] = (c[t.lineId] ?? 0) + 1;
    return c;
  }, [active]);

  const timeLabel = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className={cn(
            "flex items-center gap-3 rounded-full px-6 py-4 text-lg font-semibold transition",
            playing
              ? "bg-amber-400 text-black hover:bg-amber-300"
              : "bg-white/10 hover:bg-white/20 border border-white/10"
          )}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
          {playing ? "Pausar sonificación" : "Escuchar el AMBA"}
        </motion.button>

        <div className="flex items-center gap-3 text-[var(--color-muted)]">
          <Clock size={16} />
          <span className="font-mono text-2xl text-white">{timeLabel}</span>
          <label className="flex items-center gap-2 text-sm ml-4">
            <input
              type="checkbox"
              checked={followClock}
              onChange={(e) => setFollowClock(e.target.checked)}
              className="accent-amber-400"
            />
            Seguir hora actual
          </label>
        </div>
      </div>

      <div className="mb-8">
        <input
          type="range"
          min={0}
          max={1439}
          value={minute}
          disabled={followClock}
          onChange={(e) => setMinute(Number(e.target.value))}
          className="w-full accent-amber-400 disabled:opacity-40"
        />
        <div className="flex justify-between text-xs text-[var(--color-muted)] font-mono mt-2">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:59</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-[var(--color-muted)] mb-4">
            Líneas · {lines.length}
          </h2>
          <div className="space-y-3">
            {lines.map((line) => (
              <LinePanel
                key={line.id}
                line={line}
                activeCount={countsByLine[line.id] ?? 0}
                muted={muted[line.id] ?? false}
                onToggleMute={() => toggleMute(line.id)}
                onVolumeChange={(db) => setLineVolume(line.id, db)}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm uppercase tracking-widest text-[var(--color-muted)] mb-4">
            Trenes sonando ahora · {active.length}
          </h2>
          <AnimatePresence mode="popLayout">
            <ActiveTrainsList trains={active} lines={lines} />
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
