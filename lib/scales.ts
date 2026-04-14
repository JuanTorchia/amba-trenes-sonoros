/**
 * Teoría musical detrás del proyecto
 * ==================================
 *
 * Usamos una escala **pentatónica mayor** (5 notas por octava) por una razón
 * puramente arquitectónica: nuestros datos son descoordinados. Cada línea
 * arranca sus trenes según criterios operativos, no armónicos. Si usáramos
 * cualquier escala con semitonos (cromática, mayor heptatónica, menor menor),
 * cualquier par de trenes sonando al mismo tiempo podría producir disonancias
 * fuertes (segundas menores, tritonos).
 *
 * La pentatónica — do, re, mi, sol, la — no tiene ningún intervalo de semitono
 * entre sus notas. Cualquier combinación suena "consonante" por construcción.
 * Es el mismo truco que usan los patios de juegos en parques infantiles: no
 * importa cómo golpees las barras del xilofón, nunca suena mal.
 *
 * Elegimos *do mayor* porque sí: es la referencia más neutra. En una v2
 * podríamos modular según hora del día (ej: tónica baja en horarios pico).
 */

export const PENTATONIC_C_MAJOR: string[] = [
  "C3",
  "D3",
  "E3",
  "G3",
  "A3",
  "C4",
  "D4",
  "E4",
  "G4",
  "A4",
  "C5",
  "D5",
  "E5",
  "G5",
  "A5",
];

/**
 * Asigna nota según un índice estable (típicamente: minuto del día del trip).
 * Determinístico: el mismo trip produce siempre la misma nota.
 */
export function noteForIndex(index: number): string {
  return PENTATONIC_C_MAJOR[index % PENTATONIC_C_MAJOR.length];
}
