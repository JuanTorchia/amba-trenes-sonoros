/**
 * Capa de sonificación.
 *
 * Este módulo mapea "un tren" a "un evento sonoro".
 *
 * Reglas de diseño:
 * 1. **Un sintetizador por línea**, no por tren. Si cada tren tuviera su propio
 *    sintetizador, con 200 trenes activos en hora pico el browser se muere.
 *    En cambio, cada línea tiene un `PolySynth` reusable que dispara notas.
 *
 * 2. **Nota determinística** — misma función que en el server (`noteForIndex`),
 *    para que el visual y el audio no se desincronicen.
 *
 * 3. **Envolvente corta** — ADSR con release de ~1.5s para que el loop de 5s
 *    se escuche como pulsos, no como un drone continuo.
 *
 * 4. **Lazy init** — los AudioContexts de browser requieren interacción del
 *    usuario. Por eso el constructor no hace nada: `start()` es el que crea
 *    todo cuando el usuario toca play.
 */

"use client";

import * as Tone from "tone";
import type { LineDefinition, SynthKind } from "./lines";
import type { ActiveTrain } from "./schedule";

// Tone.PolySynth es genérico sobre la voz monofónica subyacente (Synth, FMSynth,
// AMSynth, MetalSynth, etc). TS no puede inferir un supertipo común entre todos
// ellos, así que usamos `any` en la voz del PolySynth. La API pública
// (`triggerAttackRelease`) es estable independientemente del generic.
type AnyPolySynth = Tone.PolySynth<any>;

type LineVoice = {
  synth: AnyPolySynth;
  volume: Tone.Volume;
  muted: boolean;
};

function buildSynth(kind: SynthKind): AnyPolySynth {
  // Cada timbre produce una textura distintiva. Ajustamos release y attack
  // para que el resultado colectivo no se empaste.
  const common = { envelope: { attack: 0.02, decay: 0.25, sustain: 0.3, release: 1.5 } };

  switch (kind) {
    case "sawtooth":
      return new Tone.PolySynth(Tone.Synth, { ...common, oscillator: { type: "sawtooth" } });
    case "sine":
      return new Tone.PolySynth(Tone.Synth, { ...common, oscillator: { type: "sine" } });
    case "square":
      return new Tone.PolySynth(Tone.Synth, { ...common, oscillator: { type: "square" } });
    case "triangle":
      return new Tone.PolySynth(Tone.Synth, { ...common, oscillator: { type: "triangle" } });
    case "fm":
      return new Tone.PolySynth(Tone.FMSynth, { ...common, harmonicity: 2, modulationIndex: 4 });
    case "am":
      return new Tone.PolySynth(Tone.AMSynth, { ...common, harmonicity: 1.5 });
    case "metal":
      return new Tone.PolySynth(Tone.MetalSynth, {
        envelope: { attack: 0.001, decay: 0.4, release: 0.6 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      });
  }
}

export class TrainsConductor {
  private voices = new Map<string, LineVoice>();
  private masterVolume: Tone.Volume | null = null;
  private reverb: Tone.Reverb | null = null;
  private started = false;

  constructor(private lines: LineDefinition[]) {}

  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();

    this.masterVolume = new Tone.Volume(-6).toDestination();
    this.reverb = new Tone.Reverb({ decay: 3, wet: 0.25 }).connect(this.masterVolume);

    for (const line of this.lines) {
      const synth = buildSynth(line.synth);
      const volume = new Tone.Volume(0);
      synth.chain(volume, this.reverb);
      this.voices.set(line.id, { synth, volume, muted: false });
    }

    this.started = true;
  }

  stop(): void {
    if (!this.started) return;
    for (const voice of this.voices.values()) {
      voice.synth.releaseAll();
      voice.synth.dispose();
      voice.volume.dispose();
    }
    this.reverb?.dispose();
    this.masterVolume?.dispose();
    this.voices.clear();
    this.started = false;
  }

  setMuted(lineId: string, muted: boolean): void {
    const voice = this.voices.get(lineId);
    if (!voice) return;
    voice.muted = muted;
    voice.volume.mute = muted;
  }

  setLineVolumeDb(lineId: string, db: number): void {
    const voice = this.voices.get(lineId);
    if (!voice) return;
    voice.volume.volume.rampTo(db, 0.1);
  }

  setMasterVolumeDb(db: number): void {
    this.masterVolume?.volume.rampTo(db, 0.1);
  }

  /**
   * Dispara las notas del tick actual. Se llama cada ~5s con los trenes activos.
   * Agrupa por línea para disparar acordes (más eficiente y más musical).
   */
  playTick(active: ActiveTrain[]): void {
    if (!this.started) return;

    const byLine = new Map<string, string[]>();
    for (const t of active) {
      const notes = byLine.get(t.lineId) ?? [];
      notes.push(t.note);
      byLine.set(t.lineId, notes);
    }

    for (const [lineId, notes] of byLine) {
      const voice = this.voices.get(lineId);
      if (!voice || voice.muted) continue;
      // Nos quedamos con hasta 4 notas distintas por línea para no saturar.
      const unique = Array.from(new Set(notes)).slice(0, 4);
      voice.synth.triggerAttackRelease(unique, "2n");
    }
  }
}
