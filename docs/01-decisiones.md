# 01 · Decisiones arquitectónicas (ADRs)

Cada decisión no trivial fue tomada con un tradeoff explícito. Las listamos como ADRs livianos para que cualquiera que llegue al repo entienda el "por qué" antes que el "qué".

---

## ADR-01 · Usar GTFS estático, no tiempo real

**Contexto.** GTFS-RT no existe públicamente para ferrocarriles argentinos. Las alternativas requieren convenios oficiales o caen en zona legal ambigua.

**Decisión.** Usamos **GTFS estático** de datos.gob.ar. Sonificamos horarios programados en lugar de posiciones reales.

**Consecuencias.**
- ✅ Totalmente reproducible. Cualquiera puede correr este repo sin credenciales.
- ✅ Legalmente impecable: datos abiertos, licencia permisiva.
- ⚠️ No refleja demoras, cancelaciones ni servicios extra. La demo suena incluso si el tren real no está saliendo.
- 📌 Lo comunicamos explícitamente en la UI (sección "Honestidad técnica").

---

## ADR-02 · Procesar GTFS en build-time, no en runtime

**Contexto.** GTFS es un zip con varios CSVs grandes (stop_times.txt suele pesar decenas de MB). Podríamos parsearlo en runtime, pero eso haría cada request más lento y acoplaría el deploy a la disponibilidad de datos.gob.ar.

**Decisión.** Un script `prebuild` descarga el GTFS, parsea lo necesario y escribe un único `data/schedule.json` optimizado. El runtime lee ese JSON y nada más.

**Consecuencias.**
- ✅ Deploy estático puro. Funciona en Vercel sin backend, sin funciones serverless.
- ✅ Performance constante: el schedule vive en el bundle, no requiere red.
- ⚠️ El dato se "congela" al momento del build. Si cambian los horarios, hay que redeployar.
- 📌 Para el uso artístico del proyecto, congelar una vez por mes es aceptable.

---

## ADR-03 · Tone.js en el cliente, no server-side audio

**Contexto.** Podríamos generar WAV/MP3 en el servidor y servirlos, o streamear audio con WebSockets, o usar la Web Audio API a pelo.

**Decisión.** Usamos **Tone.js** en el browser, construyendo polifonía en vivo.

**Consecuencias.**
- ✅ Cada usuario escucha su propia versión, generada localmente. Cero costo de ancho de banda de audio.
- ✅ Interactividad real: slider de tiempo, mute/solo por línea, volumen, todo inmediato.
- ✅ Tone.js abstrae ADSR, polifonía y scheduling con una API musical clara.
- ⚠️ Depende de que el browser tenga Web Audio (prácticamente todos en 2026).
- ⚠️ Requiere un gesto del usuario para arrancar (política de autoplay). Lo resolvemos con el botón "Escuchar el AMBA".

---

## ADR-04 · Escala pentatónica, no cromática

**Contexto.** Los trenes no se coordinan entre sí. Si dos líneas disparan notas al azar en una escala cromática, el resultado es disonante.

**Decisión.** Usamos **pentatónica mayor en C** (C, D, E, G, A). Cualquier combinación simultánea suena consonante.

**Consecuencias.**
- ✅ No importa cuántos trenes suenen a la vez, nunca hay choque armónico.
- ✅ Determinístico: el mismo viaje siempre toca la misma nota (hash del minuto de salida).
- 📌 En v2 podríamos modular la tónica según la hora del día (más grave de madrugada, más brillante al mediodía).

Más profundidad en [04 · Sonificación](04-sonificacion.md).

---

## ADR-05 · Un sintetizador por línea, no por tren

**Contexto.** Con ~500 trenes activos en hora pico, instanciar un sintetizador por cada uno mata la performance del browser.

**Decisión.** Cada línea tiene un único `PolySynth` de Tone.js que dispara acordes cuando hay múltiples trenes activos en esa línea.

**Consecuencias.**
- ✅ Fluido aún con cientos de trenes simultáneos.
- ✅ Cada línea mantiene su identidad tímbrica.
- ⚠️ Si dos trenes de la misma línea coinciden en la misma nota, se fusionan. Aceptable.

---

## ADR-06 · Mapeo línea → timbre fijado en código, no configurable

**Contexto.** Podríamos exponer un panel para que el usuario cambie el sintetizador de cada línea.

**Decisión.** **Mapeo fijo**. Sarmiento = sawtooth, Mitre = sine, Roca = square, etc. (ver [`lib/lines.ts`](../lib/lines.ts)).

**Consecuencias.**
- ✅ La experiencia es la misma para todos los visitantes. "Identidad sonora" del proyecto.
- ✅ Una sola fuente de verdad entre UI, sintetizador y colores.
- 📌 Si alguien quiere experimentar con otros mapeos, hace fork. El repo no se complica con configuración que nadie va a usar.

---

## ADR-07 · 7 líneas del AMBA, no toda Argentina

**Contexto.** GTFS de datos.gob.ar incluye algunos servicios regionales y de cargas. Podríamos meter todo.

**Decisión.** Sólo **7 líneas urbanas de pasajeros del AMBA**: Sarmiento, Mitre, Roca, San Martín, Belgrano Norte, Belgrano Sur, Urquiza.

**Consecuencias.**
- ✅ El proyecto tiene un alcance claro ("la ciudad sonando") que el usuario entiende.
- ✅ La UI entra cómoda en un panel lateral.
- 📌 Sumar más líneas es trivial (agregar a `LINES` en `lib/lines.ts`). Ver [06 · Cómo extender](06-como-extender.md).

---

Seguí leyendo: [02 · Arquitectura y flujo de datos →](02-arquitectura.md)
