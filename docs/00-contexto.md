# 00 · Contexto

## La idea que no nos dejaba en paz

En 2014, Alexander Chen publicó [*Conductor: MTA*](http://mta.me/): una visualización de Nueva York donde **cada subte es una cuerda que suena al pasar por una estación**. Cuando dos trenes cruzan en paralelo, se arma una especie de duelo sonoro. El tráfico del subte te genera música sin que nadie la componga.

Lo que hace especial ese proyecto no es el sonido, es que funciona con **datos en vivo**: la MTA publica un feed GPS público (GTFS-RT) donde cada vagón reporta su posición cada pocos segundos. Chen lo conectó a un sintetizador y listo.

## La pregunta obvia

¿Se puede hacer lo mismo con los trenes de Buenos Aires?

Ocho líneas (Sarmiento, Mitre, Roca, San Martín, Belgrano Norte, Belgrano Sur, Urquiza, Belgrano Cargas), cuatro operadores distintos, cientos de miles de pasajeros por día. Si funcionara, sería hermoso: **una ciudad escuchándose a sí misma moverse**.

## La respuesta incómoda

No existe versión pública de GTFS-RT para los ferrocarriles argentinos.

- **API oficial de Trenes Argentinos**: existe, pero está detrás de OAuth2 y convenio con el Ministerio de Transporte. Tenés que firmar papeles.
- **SUBE API**: expone solo tu saldo y tus movimientos. Nada de datos agregados.
- **Scraping de apps oficiales**: técnicamente posible, éticamente turbio, legalmente en zona gris.

Lo único abierto y sin fricción es el **GTFS estático**: horarios programados, rutas, paradas. Publicado en [datos.gob.ar](https://datos.gob.ar) como parte de las políticas de datos abiertos del Estado.

Es menos de lo que queríamos. Es lo que tenemos. Y resulta que alcanza para hacer algo hermoso.

## Qué construimos entonces

Una sonificación basada en horarios programados. No sabemos dónde está el tren exacto en este momento, pero sí sabemos **qué trenes deberían estar circulando según el schedule publicado**. Ese universo de "debería" es lo que sonificamos.

Es una foto del AMBA como el AMBA se promete a sí mismo. No es la realidad operativa. Lo decimos en voz alta en la demo, en el post y acá. La honestidad es parte del diseño.

## Por qué vale la pena hacerlo igual

Porque explora una pregunta más grande:

> ¿Qué hacés cuando los datos ideales no existen? ¿Te rendís, o rediseñás el problema para que encaje con lo disponible?

Los arquitectos de software trabajan con restricciones reales. APIs caídas, datasets incompletos, permisos que no llegan. El trabajo no es elegir la solución más linda: es elegir la más honesta dado lo que hay. Este repo es un ejemplo pequeño de ese oficio.

---

Seguí leyendo: [01 · Decisiones arquitectónicas →](01-decisiones.md)
