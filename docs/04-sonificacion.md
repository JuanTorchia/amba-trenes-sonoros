# 04 · Sonificación: cómo se traduce un tren en un sonido

## Tres decisiones, en orden

### 1. Qué línea → qué timbre

Cada línea tiene un **tipo de sintetizador fijo**:

| Línea | Sintetizador | Carácter |
|---|---|---|
| Sarmiento | Sawtooth | Brillante, agresivo, cuerpo fuerte |
| Mitre | Sine | Limpio, puro, sin armónicos |
| Roca | Square | Hueco, retro, "8-bit" |
| San Martín | Triangle | Suave, cercano al sine pero con más color |
| Belgrano Norte | FM | Metálico, modulado |
| Belgrano Sur | AM | Pulsante, nervioso |
| Urquiza | Metal | Percusivo, inarmónico |

El criterio fue **máxima distinguibilidad auditiva**: cualquiera que escuche una sola nota debería poder reconocer de qué línea viene. Como las líneas no comparten timbre, el oído separa los streams aunque toquen simultáneo.

### 2. Qué nota toca cada tren

Usamos **pentatónica mayor en C** (C D E G A, repetida en múltiples octavas). Cada trip recibe una nota según el hash de su minuto de salida:

```ts
noteForIndex(trip.startsAtMinute) // → "E4", "G3", etc.
```

**Por qué pentatónica**: no tiene semitonos entre sus notas. Cualquier combinación suena consonante. Con decenas de trenes tocando a la vez, nunca hay choque armónico aunque cada línea dispare independiente.

**Por qué determinístico**: el mismo tren siempre toca la misma nota. Hace que el loop sea reconocible. Si vuelvas a las 08:15 del lunes, el Sarmiento de las 08:15 suena igual.

### 3. Cuándo dispara

Cada 5 segundos hacemos un "tick":
1. Pedimos a `getActiveTrainsAt(minuto)` los trenes activos.
2. Los agrupamos por línea.
3. Por cada línea, disparamos un acorde con las notas de sus trenes (máximo 4 notas simultáneas por línea para no saturar).

El loop es **no-realista** a propósito. Un tren que dura 45 minutos no "toca" continuamente esos 45 minutos: va pulsando cada 5s mientras está en circulación. Es una decisión estética: los pulsos dan ritmo, un drone de 45 minutos sería plano.

## El efecto colectivo

Cuando todas las líneas pulsan a la vez (hora pico ~08:00, ~18:00) se arma un acorde grande de 15–20 notas distintas repartidas en 4 octavas, con 7 timbres cruzados. Es denso, orgánico, **ninguno lo compuso**.

De madrugada quedan 2–3 trenes activos como mucho. El silencio entre pulsos se vuelve parte de la pieza.

## Efectos globales

- **Reverb** suave (~3s de decay, 25% wet) para unificar los timbres y que no suene seco.
- **Volumen maestro** a −6 dB para headroom cuando todo se superpone.
- **Release corto** (~1.5s) en los sintetizadores tonales para que los pulsos se distingan.

Todo en [`lib/sonify.ts`](../lib/sonify.ts).

---

Seguí leyendo: [05 · Limitaciones →](05-limitaciones.md)
