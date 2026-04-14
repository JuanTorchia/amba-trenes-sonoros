# 03 · Modelo de datos (GTFS en 5 minutos)

**GTFS** (General Transit Feed Specification) es un formato abierto que Google publicó para que los sistemas de transporte del mundo publicaran sus datos de forma estándar. Se entrega como un zip con CSVs. Los que nos interesan:

## `routes.txt`

Una fila por línea. Columnas clave:

| columna | descripción |
|---|---|
| `route_id` | ID opaco del operador (ej: `SARMIENTO_02`) |
| `route_short_name` | sigla (ej: `LS`) |
| `route_long_name` | nombre humano (ej: `Línea Sarmiento`) |
| `agency_id` | operador |

Lo usamos para **descubrir qué `route_id` corresponde a cada línea del AMBA**, matcheando por el nombre (no nos casamos con los IDs porque cada operador usa su propio esquema).

## `trips.txt`

Una fila por viaje programado. Un "viaje" es un recorrido único en un horario puntual (no una línea entera, sino "el tren de las 07:42 de Once a Moreno").

| columna | descripción |
|---|---|
| `trip_id` | ID único del viaje |
| `route_id` | a qué línea pertenece |
| `trip_headsign` | destino mostrado al pasajero |
| `service_id` | a qué calendario pertenece (días hábiles, fin de semana, feriado) |

## `stop_times.txt`

El más grande. Una fila por cada parada de cada viaje. Miles de miles de filas.

| columna | descripción |
|---|---|
| `trip_id` | viaje al que pertenece |
| `arrival_time` / `departure_time` | hora (HH:MM:SS, puede ser > 24:00) |
| `stop_id` | parada física |
| `stop_sequence` | orden dentro del viaje |

De acá derivamos para cada viaje:
- **Hora de inicio** = mínimo `departure_time` del trip.
- **Hora de fin** = máximo `arrival_time` del trip.
- **Duración** = fin − inicio.

## Lo que NO usamos (y por qué)

- **`stops.txt`** (estaciones con lat/lon): no mostramos mapa todavía. En una v2 sí.
- **`calendar.txt`** / **`calendar_dates.txt`**: simplificamos al "día promedio". No distinguimos hábil de fin de semana. Tradeoff consciente: más simple, menos preciso.
- **`shapes.txt`** (polylines del recorrido): solo útil con visualización geográfica.
- **`fare_rules.txt`**: irrelevante para sonificación.

## Lo que queda en `data/schedule.json`

Tras el parser, cada viaje es una entrada liviana:

```json
{
  "tripId": "SARMIENTO_T_07_42_ida",
  "lineId": "sarmiento",
  "routeName": "Sarmiento",
  "headsign": "Moreno",
  "startsAtMinute": 462,
  "durationMinutes": 58
}
```

`startsAtMinute` y `durationMinutes` son enteros en lugar de strings HH:MM:SS. Esto hace que la búsqueda en runtime sea:

```ts
if (now >= trip.startsAtMinute && now < trip.startsAtMinute + trip.durationMinutes) { ... }
```

O(1) por trip, O(n) total — y el n está acotado en unos pocos miles. Suficiente para un tick cada 5s.

---

Seguí leyendo: [04 · Sonificación →](04-sonificacion.md)
