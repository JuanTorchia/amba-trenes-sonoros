import { getLines, getScheduleMeta } from "@/lib/schedule";
import { Player } from "@/components/player";
import { Limitations } from "@/components/limitations";

export default function HomePage() {
  const lines = getLines();
  const meta = getScheduleMeta();

  return (
    <main className="min-h-screen">
      <div className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="noise absolute inset-0 opacity-[0.04] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
          <p className="text-sm uppercase tracking-widest text-[var(--color-muted)] mb-4">
            Experimento sonoro · datos abiertos del AMBA
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Cada tren del AMBA
            <br />
            <span className="text-amber-400">toca una nota.</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--color-muted)] max-w-2xl leading-relaxed">
            Una sonificación en vivo de los horarios GTFS públicos de los ferrocarriles argentinos.
            Cada línea tiene su propio timbre, cada viaje su propia nota, y todo junto forma una
            pieza de música generativa que cambia minuto a minuto.
          </p>
          <div className="mt-3 text-xs text-[var(--color-muted)] font-mono">
            {meta.totalTrips.toLocaleString("es-AR")} viajes · fuente: {meta.source}
          </div>
        </div>
      </div>

      <Player lines={lines} />

      <Limitations />

      <footer className="border-t border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-muted)]">
        <p>
          Hecho por{" "}
          <a className="underline hover:text-amber-400" href="https://juanchi.dev">
            Juan Torchia
          </a>
          {" · "}
          <a
            className="underline hover:text-amber-400"
            href="https://github.com/juanchi-dev/amba-trenes-sonoros"
          >
            código en GitHub
          </a>
          {" · "}
          <a
            className="underline hover:text-amber-400"
            href="https://juanchi.dev/blog/datos-abiertos-transporte-creatividad-datos-publicos-trenes-buenos-aires"
          >
            leé el post
          </a>
        </p>
      </footer>
    </main>
  );
}
