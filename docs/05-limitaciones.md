# 05 · Limitaciones (y por qué las aceptamos)

Este doc existe para que nadie se sorprenda cuando lea el código.

## No es tiempo real

Lo que sonificamos es el **horario programado**, no la posición real de los trenes. Un tren demorado, cancelado o servicio extra no cambia nada de lo que escuchás.

**Por qué**: no existe GTFS-RT público para ferrocarriles argentinos. Las APIs alternativas requieren convenios o caen en zona legal ambigua. Ver [`00-contexto.md`](00-contexto.md).

## No distingue días

Todos los días suenan igual. No separamos "hábiles" de "sábados/domingos/feriados".

**Por qué**: `calendar.txt` de GTFS permite esa distinción, pero tendríamos que regenerar el schedule por servicio y decidir en runtime cuál aplica. Más código, no más arte. Descartado.

## Normaliza horas > 24:00

GTFS permite `25:30:00` para un viaje que sale el día X a las 01:30 AM del día X+1. Nosotros hacemos `% 24h`, lo cual introduce un pequeño error en la ventana 00:00–02:00 (los viajes que cruzan medianoche aparecen "el día de origen" en vez de "el día destino").

**Por qué**: simplifica el runtime muchísimo. Los ferrocarriles del AMBA casi no tienen servicios nocturnos continuos. Tradeoff aceptable.

## Depende del estado de datos.gob.ar

El GTFS que bajamos en build-time lo publica el Ministerio de Transporte. Si dejan de publicar, dejamos de actualizar. Si publican con datos viejos, nosotros también.

**Mitigación**: `data/schedule.json` queda committeado. Aunque el mirror se caiga, el sitio sigue funcionando con el último snapshot válido.

## No muestra geografía

No hay mapa, no hay coordenadas, no hay recorrido visual. Solo lista de trenes activos.

**Por qué**: scope. Sumar mapa implica Mapbox/MapLibre, tiles, y una complejidad visual que tapa el mensaje sonoro. Lo dejamos para v2 si la demo engancha.

## Compatibilidad browser

Requiere Web Audio API. Funciona en todos los browsers modernos (Chrome, Firefox, Safari, Edge). En iOS Safari el audio necesita un gesto del usuario (el botón "Escuchar"). En browsers muy viejos, simplemente no suena.

---

Seguí leyendo: [06 · Cómo extender →](06-como-extender.md)
