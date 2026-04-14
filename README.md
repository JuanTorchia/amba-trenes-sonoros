# AMBA Trenes Sonoros

> Música generativa a partir de los horarios GTFS públicos de los ferrocarriles del AMBA.
> Cada línea tiene su timbre. Cada viaje su nota. Todo junto es una pieza que nunca suena igual dos veces.

**Demo en vivo →** https://amba-trenes-sonoros.vercel.app
**Post con el detrás de escena →** https://juanchi.dev/blog/datos-abiertos-transporte-creatividad-datos-publicos-trenes-buenos-aires

---

## Qué es esto

Un experimento de **sonificación de datos abiertos**. Tomamos los horarios programados (GTFS estático) de los ferrocarriles argentinos — Sarmiento, Mitre, Roca, San Martín, Belgrano Norte, Belgrano Sur, Urquiza — y los convertimos en música en vivo dentro del browser.

Cada tren que *debería* estar circulando en un minuto dado dispara una nota en una escala pentatónica. El resultado es una pieza colectiva que cambia según la hora del día: calma al amanecer, densa en hora pico, silenciosa de madrugada.

## Por qué existe

Porque el [experimento original de Alexander Chen con el metro de NY](https://www.mta.info/news-signage-subway/2014/04/23/signals-train) usa un feed GPS en tiempo real que en Argentina **no tenemos públicamente**. En vez de abandonar la idea, decidimos hacer lo que los datos disponibles permiten y decirlo con total honestidad.

Es también un ejemplo de **pensamiento arquitectónico bajo restricciones reales**: ¿qué hacés cuando la fuente ideal no existe? ¿Te rendís o rediseñás el problema?

## Cómo correrlo local

```bash
pnpm install
pnpm gtfs:fetch   # baja el GTFS real desde datos.gob.ar y genera data/schedule.json
pnpm dev          # http://localhost:3000
```

Si estás sin red o el mirror de datos.gob.ar está caído, el comando usa un dataset sintético de fallback para que el build nunca rompa.

## Deploy (Vercel)

Este proyecto es **100% estático** una vez construido. El `prebuild` genera el schedule en JSON y el runtime lo consume sin tocar la red.

```bash
vercel
```

No hace falta configurar variables de entorno.

## Documentación arquitectónica

- [`docs/00-contexto.md`](docs/00-contexto.md) — De dónde viene la idea y por qué nos obsesionamos con ella
- [`docs/01-decisiones.md`](docs/01-decisiones.md) — ADRs: por qué GTFS estático, por qué Tone.js, por qué browser-only
- [`docs/02-arquitectura.md`](docs/02-arquitectura.md) — Flujo de datos completo con diagrama
- [`docs/03-modelo-de-datos.md`](docs/03-modelo-de-datos.md) — Cómo funciona GTFS y qué archivos usamos
- [`docs/04-sonificacion.md`](docs/04-sonificacion.md) — La teoría musical detrás del mapeo tren→nota
- [`docs/05-limitaciones.md`](docs/05-limitaciones.md) — Por qué no es tiempo real y qué significa
- [`docs/06-como-extender.md`](docs/06-como-extender.md) — Sumar líneas, cambiar escala, contribuir

## Stack

- **Next.js 15** (App Router, Server Components por defecto)
- **React 19**
- **TypeScript** estricto
- **Tailwind CSS v4**
- **Tone.js** (síntesis en browser)
- **Framer Motion** (transiciones de la lista de trenes)

## Licencia

MIT. El código es tuyo, los datos son públicos, la música es colectiva.

Hecho con 🎧 por [Juan Torchia](https://juanchi.dev) · Buenos Aires, 2026.
