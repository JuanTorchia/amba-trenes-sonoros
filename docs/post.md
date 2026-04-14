---
title: "Datos abiertos y creatividad: cómo hice que los trenes del AMBA toquen música"
slug: "datos-abiertos-transporte-creatividad-datos-publicos-trenes-buenos-aires"
excerpt: "Un experimento de sonificación con los horarios GTFS de los ferrocarriles argentinos. Y la historia de pensar como arquitecto cuando los datos ideales no existen."
---

# Datos abiertos y creatividad: cómo hice que los trenes del AMBA toquen música

> **Demo en vivo**: [amba-trenes-sonoros.vercel.app](https://amba-trenes-sonoros.vercel.app)
> **Código abierto**: [github.com/JuanTorchia/amba-trenes-sonoros](https://github.com/JuanTorchia/amba-trenes-sonoros)

---

## La idea que me robó un fin de semana

Hace años que tengo guardada una pestaña: **[Conductor, de Alexander Chen](http://mta.me/)**. Es una visualización del subte de Nueva York donde cada vagón que pasa por una estación toca una cuerda. La MTA publica un feed GPS en vivo y Chen lo conectó a un sintetizador. El resultado es una pieza que **se compone sola** con el tráfico real de la ciudad.

Siempre quise hacer algo parecido con Buenos Aires. La ciudad que no duerme, sonando. Ocho líneas de tren, cientos de miles de viajes por día, todo convertido en música colectiva.

El fin de semana pasado finalmente me senté a probar. Y me topé con algo que me pasa seguido cuando trabajo con datos públicos argentinos: **lo que necesitaba no existe**.

---

## El callejón sin salida (y por qué no es el final)

El proyecto de NY funciona con **GTFS-RT**: una versión en tiempo real del estándar GTFS que publica la posición de cada unidad cada pocos segundos.

En Argentina busqué durante un par de horas. Este fue el inventario:

| Fuente | Qué tiene | Por qué no sirve |
|---|---|---|
| **API Trenes Argentinos** | Posiciones GPS reales | OAuth2 + convenio firmado con el Ministerio |
| **SUBE API** | Saldos y movimientos personales | No hay agregados de flujo |
| **GTFS-RT de SOFSE** | — | No existe versión pública |
| **Scraping de apps oficiales** | Podría dar datos parciales | Zona legal ambigua, éticamente dudoso |
| **GTFS estático en datos.gob.ar** | Horarios programados | ✅ Abierto, libre, impecable |

La última línea es la que cambia el problema. **El horario programado es un dato abierto, publicado por el Estado, sin fricciones**. No es la foto real del AMBA pero es una foto: la del AMBA como se auto-promete.

Acá se toma la primera decisión de arquitectura del proyecto, que no tiene nada que ver con código:

> **Aceptar lo que los datos disponibles permiten, y decirlo en voz alta.**

Todo el proyecto —el código, la UI, este post— está escrito con esa honestidad encima. No es tiempo real. Es lo mejor que se puede hacer con datos que cualquiera puede descargar.

Y resulta que alcanza.

---

## Pensar como arquitecto bajo restricciones

Cuando uno trabaja profesionalmente con sistemas, este dilema es pan de cada día: la API ideal no existe, el presupuesto no alcanza, el permiso no llega. El oficio del arquitecto no es elegir la solución ideal en el vacío, es **elegir la más honesta dentro de lo que hay**.

Lo que hicimos fue:

1. **Aceptar la restricción**: no vamos a tener tiempo real.
2. **Redefinir el problema**: sonificar el *schedule*, no el *movimiento*.
3. **Diseñar para que la restricción sea visible**: que el usuario entienda qué está escuchando.

Con eso, el resto del proyecto se vuelve posible.

---

## La arquitectura en un diagrama

```
┌────────────────────────┐
│  datos.gob.ar          │  GTFS estático (zip con CSVs)
│  (Ministerio de        │
│  Transporte)           │
└────────────┬───────────┘
             │ fetch (una sola vez, en build-time)
             ▼
┌────────────────────────┐
│  scripts/build-gtfs.ts │  Parsea routes.txt + trips.txt
│                        │  + stop_times.txt
└────────────┬───────────┘
             │ escribe JSON plano
             ▼
┌────────────────────────┐
│  data/schedule.json    │  ~1-2MB, committeado al repo
└────────────┬───────────┘
             │ import estático (Next.js bundler)
             ▼
┌────────────────────────┐
│  lib/schedule.ts       │  getActiveTrainsAt(minute)
│  (runtime puro)        │  sin red, sin filesystem
└────────────┬───────────┘
             │
             ├────────────────┐
             ▼                ▼
      UI (React)        Tone.js (audio en browser)
```

Cuatro decisiones de diseño que vale la pena explicar.

### Decisión 1: procesar el GTFS en build, no en runtime

El zip pesa entre 10 y 20MB y cada CSV hay que parsearlo. Podríamos hacerlo on-demand cuando el usuario entra, pero eso significa:

- Latencia alta en cada request.
- Dependencia de que datos.gob.ar responda cuando la gente visita el sitio.
- Parser corriendo en cada instancia serverless.

La alternativa es correr el parser **una vez**, al momento de hacer `next build`, y dejar un `data/schedule.json` masticado que pesa mucho menos y que el bundler empaqueta en el deploy. El sitio resultante es **completamente estático**: no hay backend, no hay base de datos, no hay funciones serverless. Vercel lo sirve desde CDN.

El costo: el dato se "congela" al momento del build. Si mañana cambian los horarios, hay que redeployar. Para un proyecto artístico, redeployar una vez por mes es aceptable.

### Decisión 2: sonificar en el browser, no en el servidor

Podríamos generar WAVs o MP3s server-side y servirlos. También podríamos streamear audio por WebSocket. O usar la Web Audio API a pelo.

Elegimos **Tone.js en el cliente** porque:

- **Cada usuario genera su propia pieza local**. Cero costo de ancho de banda de audio.
- **La interactividad se vuelve trivial**: mute de una línea, slider de hora, volumen → todo inmediato porque no viaja por red.
- **Tone.js abstrae ADSR, polifonía y scheduling** con una API musical clara.

La contra es la política de autoplay: los browsers no permiten reproducir audio sin un gesto del usuario. Lo resolvemos con un botón grande que dice "Escuchar el AMBA". El gesto es parte del ritual.

### Decisión 3: un sintetizador por línea, no por tren

Primer prototipo: cada tren instanciaba su propio `Tone.Synth`. Funcionaba con 20 trenes activos. Se colgaba con 200.

La solución: cada **línea** tiene un único `PolySynth` que recibe un acorde por tick. Si hay cinco trenes de Sarmiento sonando simultáneamente, el `PolySynth` de Sarmiento recibe cinco notas de una vez. Tone.js se encarga de la polifonía internamente.

Es un patrón común: **agrupar por identidad en vez de por individuo**. Un arquitecto lo reconoce en mil contextos —rate limiting por usuario, conexiones pooleadas por host, etc.

### Decisión 4: pentatónica mayor, no cromática

Acá la decisión es musical con consecuencias arquitectónicas.

Los trenes no se coordinan entre sí. Cada línea dispara notas independientemente. Si usáramos una escala con semitonos (cualquier escala occidental "normal"), dos trenes tocando a la vez podrían producir disonancias fuertes (segundas menores, tritonos).

La **pentatónica mayor** —do re mi sol la— no tiene ningún intervalo de semitono. Cualquier combinación simultánea suena consonante. Es el mismo truco que usan los xilofones de los jardines de infantes: no importa cómo golpees las barras, nunca suena feo.

Eligiendo la escala, **eliminás una categoría entera de bugs musicales** por diseño. Es una decisión a nivel de datos, no de código: en un sistema distribuido donde los productores son independientes, ajustás el *protocolo* para que cualquier combinación sea válida.

---

## El flujo completo, mirando código

**Parser GTFS** (simplificado):

```ts
// scripts/build-gtfs.ts
const routes = parseCsv(zip.readTxt("routes.txt"));
const trips = parseCsv(zip.readTxt("trips.txt"));
const stopTimes = parseCsv(zip.readTxt("stop_times.txt"));

// Por cada trip, calculamos inicio y duración
const tripTimes = new Map<string, { start: number; end: number }>();
for (const st of stopTimes) {
  const minute = hhmmssToMinutes(st.departure_time);
  const current = tripTimes.get(st.trip_id);
  if (!current) tripTimes.set(st.trip_id, { start: minute, end: minute });
  else tripTimes.set(st.trip_id, {
    start: Math.min(current.start, minute),
    end: Math.max(current.end, minute),
  });
}
```

Convierte el universo de ~millones de filas de `stop_times.txt` en un Map con unas miles de entradas: inicio y fin de cada viaje en minutos del día. Todo lo demás se descarta.

**Consulta runtime**:

```ts
// lib/schedule.ts
export function getActiveTrainsAt(minute: number): ActiveTrain[] {
  const out: ActiveTrain[] = [];
  for (const trip of schedule.trips) {
    const end = trip.startsAtMinute + trip.durationMinutes;
    if (minute >= trip.startsAtMinute && minute < end) {
      out.push({
        tripId: trip.tripId,
        lineId: trip.lineId,
        note: noteForIndex(trip.startsAtMinute),
        progress: (minute - trip.startsAtMinute) / trip.durationMinutes,
      });
    }
  }
  return out;
}
```

Puro loop, sin índices, sin caché. Con ~5–10K trips el browser lo corre en <1ms. Optimizar antes de medir es una trampa.

**Sonificación**:

```ts
// lib/sonify.ts (simplificado)
playTick(active: ActiveTrain[]): void {
  const byLine = new Map<string, string[]>();
  for (const t of active) {
    const notes = byLine.get(t.lineId) ?? [];
    notes.push(t.note);
    byLine.set(t.lineId, notes);
  }
  for (const [lineId, notes] of byLine) {
    const voice = this.voices.get(lineId);
    voice.synth.triggerAttackRelease(Array.from(new Set(notes)), "2n");
  }
}
```

El `triggerAttackRelease` con un array de notas es el mecanismo de Tone.js para disparar un acorde. `"2n"` es la duración en notación musical (media nota): independiente del BPM, flexible.

---

## Lo que terminó saliendo

La demo vive en [amba-trenes-sonoros.vercel.app](https://amba-trenes-sonoros.vercel.app) y el repo completo en [GitHub](https://github.com/JuanTorchia/amba-trenes-sonoros).

Los patrones que se escuchan son reales:

- **05:00–07:00**: pocos trenes, notas aisladas, silencios largos. El sistema despertándose.
- **07:30–09:30**: hora pico matutina. Densidad máxima. Las siete líneas tocando simultáneo, 15–20 notas en paralelo.
- **11:00–14:00**: frecuencia media. Se escucha más claro cada timbre.
- **17:30–20:00**: hora pico vespertina. Igual de denso que la mañana, pero psicológicamente distinto (la gente volviendo a casa).
- **23:00–04:00**: casi silencio. Un Sarmiento de medianoche, a veces.

Es, en el sentido más literal, **una ciudad escuchándose a sí misma moverse**.

---

## Qué queda abierto

- **v2 con mapa**: sumar `stops.txt` y dibujar puntos animados con la posición aproximada de cada tren.
- **Modulación por hora del día**: tónica más grave de madrugada, más brillante al mediodía.
- **Otras ciudades**: el código es agnóstico de dataset. Fork + nuevo `LINES` y tenés Córdoba, Rosario o Mendoza sonoros.
- **GTFS-RT el día que exista**: si alguna vez el Ministerio abre el feed real, cambiar la fuente son 10 líneas de código.

---

## Por qué publico esto

Porque creo que los proyectos pequeños y raros son donde se aprende más. Porque los datos públicos son un regalo que está ahí esperando que alguien los use. Porque quería contar no solo qué hice sino **por qué lo hice así**: los tradeoffs, las restricciones, las decisiones honestas.

Si programás, agarrá el repo, cambiale la escala, sumá una línea, armá tu propia versión de tu propia ciudad. El código es MIT, los datos son del Estado argentino, y la música ya era nuestra.

---

**Links útiles**

- 🎧 Demo: [amba-trenes-sonoros.vercel.app](https://amba-trenes-sonoros.vercel.app)
- 💻 Código: [github.com/JuanTorchia/amba-trenes-sonoros](https://github.com/JuanTorchia/amba-trenes-sonoros)
- 📊 Datos: [datos.gob.ar — GTFS trenes AMBA](https://datos.gob.ar)
- 🎼 Tone.js: [tonejs.github.io](https://tonejs.github.io/)
- 🏙️ Proyecto original de NY: [mta.me](http://mta.me/) por Alexander Chen
