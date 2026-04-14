# 06 · Cómo extender

## Sumar una línea

Agregar una entrada a `LINES` en [`lib/lines.ts`](../lib/lines.ts):

```ts
{
  id: "belgrano-cargas",
  name: "Belgrano Cargas",
  matchers: ["belgrano cargas", "cargas"],
  synth: "metal",
  color: "#64748b",
  operator: "SOFSE",
}
```

Después `pnpm gtfs:fetch` para regenerar el schedule y `pnpm dev` para verla en vivo.

## Cambiar el mapeo timbre/línea

Editar el campo `synth` de cualquier `LineDefinition`. Tipos disponibles: `sawtooth | sine | square | triangle | fm | am | metal`. Si querés agregar uno nuevo (ej: `pluck`, `granular`), extender también la factory en [`lib/sonify.ts`](../lib/sonify.ts) → `buildSynth()`.

## Cambiar la escala

Editar [`lib/scales.ts`](../lib/scales.ts). Podés probar:

- **Pentatónica menor**: C Eb F G Bb → más melancólico.
- **Dorian**: C D Eb F G A Bb → modal, jazzy.
- **Sólo tónica y quinta**: C G → drones minimalistas.

La única regla: mantener intervalos sin semitonos adyacentes si querés que siga sonando "sin disonancia" con múltiples voces simultáneas.

## Cambiar el ritmo

El tick vive en [`components/player.tsx`](../components/player.tsx) con `TICK_MS = 5000`. Bajarlo a 2000 produce más pulso, subirlo a 10000 produce más "aire". Ojo con bajar por debajo de 1000: empieza a saturar audio.

## Agregar visualización geográfica

Requiere:
1. Incluir `stops.txt` en el parser (lat/lon por parada).
2. Enriquecer cada trip con coordenadas de su próxima parada.
3. Usar MapLibre GL o Leaflet en un Client Component, leer trenes activos, dibujar puntos animados.

Si lo hacés, abrí un PR.

## Cambiar fuente de datos

El arreglo `GTFS_SOURCES` en [`scripts/build-gtfs.ts`](../scripts/build-gtfs.ts) permite múltiples URLs. Se prueban en orden hasta que una responda OK. Sumá tu mirror si tenés uno más confiable.

## Contribuir

- Issues bienvenidos: ideas, bugs, nuevas líneas, nuevos timbres, lo que quieras.
- PRs bienvenidos: probalo local (`pnpm dev`), mandá PR con contexto claro.
- Si querés sumar tu propia ciudad (Córdoba, Rosario, Mendoza), fork y adaptá `LINES` + fuente GTFS. Avísame y enlazamos desde el README.
