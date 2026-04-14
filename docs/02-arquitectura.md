# 02 · Arquitectura y flujo de datos

Diagrama mental rápido:

```
┌──────────────────────┐
│  datos.gob.ar        │   GTFS zip (CSV)
│  (GTFS estático)     │   ~10–20 MB
└──────────┬───────────┘
           │ fetch (solo en BUILD)
           ▼
┌──────────────────────┐
│  scripts/build-gtfs  │   prebuild step
│  parsea + normaliza  │
└──────────┬───────────┘
           │ escribe JSON plano
           ▼
┌──────────────────────┐
│  data/schedule.json  │   ~1–2 MB optimizado
│  (committeado)       │   viajes ya filtrados
└──────────┬───────────┘
           │ import estático
           ▼
┌──────────────────────┐
│  lib/schedule.ts     │   getActiveTrainsAt(min)
│  (runtime puro)      │   sin red, sin fs
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐        ┌──────────────────────┐
│  components/player   │───────▶│  lib/sonify.ts       │
│  (React, tick 5s)    │        │  Tone.js PolySynths  │
└──────────────────────┘        └──────────────────────┘
           │                              │
           ▼                              ▼
       UI visual                     Web Audio API
   (lista de trenes)                  (tu speaker)
```

## Capas

### 1. Build (ejecuta una vez, en Vercel)

`scripts/build-gtfs.ts` baja el GTFS, lo parsea, y escribe `data/schedule.json`. Si no hay red, usa `FALLBACK_SCHEDULE`. Si falla el parse, también. Nunca rompe el build.

### 2. Server Components (HTML del primer paint)

`app/page.tsx` es un Server Component. Al renderizarse:
- Lee `data/schedule.json` (import estático).
- Pasa las líneas como props al Player (Client Component).
- Hidrata las secciones informativas (hero, limitaciones, footer) sin JS del lado cliente más allá de lo mínimo.

### 3. Client Components (interactividad + audio)

`components/player.tsx` + hijos:
- Mantiene estado local (minuto simulado, trenes activos, mutes, volúmenes).
- Cada 5s llama a `getActiveTrainsAt` (puro, sincrónico) y dispara el `TrainsConductor`.
- El conductor toma los trenes activos y emite notas hacia los PolySynths por línea.

## Por qué este flujo y no otro

| Alternativa considerada | Por qué no |
|---|---|
| **Server Action que parsea GTFS on-demand** | Latencia alta, re-parsing constante, caché complicado. No escala si el site se hace viral. |
| **API route que devuelve trenes activos** | Agrega red entre el browser y el dato. Mata el feel de "tiempo real". |
| **WebSocket streaming de trenes** | Overkill para un dataset estático. |
| **Todo client-side (bajar GTFS en el browser)** | 20MB al usuario, parser CSV en JS, lento. Mal UX. |

El flujo elegido es el que **minimiza complejidad y maximiza velocidad percibida**: el dato ya viene masticado en el bundle, el browser solo calcula y suena.

---

Seguí leyendo: [03 · Modelo de datos →](03-modelo-de-datos.md)
