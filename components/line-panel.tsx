"use client";

import { Volume2, VolumeX } from "lucide-react";
import type { LineDefinition } from "@/lib/lines";

interface Props {
  line: LineDefinition;
  activeCount: number;
  muted: boolean;
  onToggleMute: () => void;
  onVolumeChange: (db: number) => void;
}

const SYNTH_LABEL: Record<LineDefinition["synth"], string> = {
  sawtooth: "Sawtooth",
  sine: "Sine",
  square: "Square",
  triangle: "Triangle",
  fm: "FM",
  am: "AM",
  metal: "Metal",
};

export function LinePanel({ line, activeCount, muted, onToggleMute, onVolumeChange }: Props) {
  return (
    <div
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4"
      style={{ borderLeft: `4px solid ${line.color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold">{line.name}</div>
          <div className="text-xs text-[var(--color-muted)] font-mono">
            {SYNTH_LABEL[line.synth]} · {line.operator}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ background: `${line.color}22`, color: line.color }}
          >
            {activeCount} trenes
          </span>
          <button
            aria-label={muted ? "Reactivar línea" : "Silenciar línea"}
            onClick={onToggleMute}
            className="text-[var(--color-muted)] hover:text-white transition"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>
      <input
        type="range"
        min={-30}
        max={6}
        defaultValue={0}
        disabled={muted}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-full accent-amber-400 disabled:opacity-30"
      />
    </div>
  );
}
