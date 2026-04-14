import { AlertTriangle } from "lucide-react";

export function Limitations() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-soft)]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 text-amber-400 mb-4">
          <AlertTriangle size={18} />
          <span className="text-sm uppercase tracking-widest">Honestidad técnica</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Esto no es tiempo real. Y está bien que lo sepas.
        </h2>
        <div className="prose prose-invert max-w-none text-[var(--color-muted)] space-y-4 leading-relaxed">
          <p>
            El experimento original de Nueva York usa <code className="text-amber-400">GTFS-RT</code>,
            un feed público en vivo donde la MTA publica la posición GPS de cada subte cada segundos.
            En Argentina no existe feed público equivalente para los ferrocarriles. Las opciones
            que exploramos:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">API Trenes Argentinos</strong>: requiere OAuth2 y
              convenio firmado con el Ministerio de Transporte. Queda fuera del alcance de un
              proyecto abierto.
            </li>
            <li>
              <strong className="text-white">SUBE</strong>: solo expone saldo y movimientos del
              usuario autenticado. No hay agregados de flujo por estación ni por línea.
            </li>
            <li>
              <strong className="text-white">GTFS-RT de SOFSE</strong>: no existe versión pública.
            </li>
          </ul>
          <p>
            Lo que sí existe es el <strong className="text-white">GTFS estático</strong> publicado
            en datos.gob.ar: horarios programados, rutas y paradas. Con eso reconstruimos qué
            trenes <em>deberían</em> estar en circulación en cada minuto del día y los sonificamos.
          </p>
          <p>
            No es una foto del AMBA real: es una foto de cómo el AMBA se auto-promete. Un tren
            demorado no se entera de que lo silenciamos. Lo aceptamos como decisión arquitectónica
            y lo decimos en voz alta, porque es lo que nos permiten los datos abiertos que tenemos.
          </p>
          <p className="pt-2">
            <a
              className="text-amber-400 underline"
              href="https://juanchi.dev/blog/datos-abiertos-transporte-creatividad-datos-publicos-trenes-buenos-aires"
            >
              Más contexto, decisiones y código comentado en el post →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
