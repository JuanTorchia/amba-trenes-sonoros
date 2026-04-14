/**
 * Registro de líneas del AMBA.
 *
 * Por qué existe este archivo:
 * GTFS usa `route_id` con strings opacos ("RAM_01", "SOFSE_SARMIENTO", etc.) que
 * varían entre operadores. Como queremos darle a cada línea un timbre y un color
 * consistentes sin acoplarnos al ID específico, acá declaramos el modelo "humano"
 * y resolvemos el route_id por nombre al momento de parsear.
 */

export type SynthKind = "sawtooth" | "sine" | "square" | "triangle" | "fm" | "am" | "metal";

export interface LineDefinition {
  /** slug estable usado como clave en UI, data JSON y CSS */
  id: string;
  /** nombre humano que aparece en el post y en datos.gob.ar */
  name: string;
  /** patrones que buscamos dentro de routes.txt (long_name/short_name). Case-insensitive. */
  matchers: string[];
  /** timbre Tone.js asignado */
  synth: SynthKind;
  /** color visual (matchea con @theme en globals.css) */
  color: string;
  /** operador público */
  operator: "SOFSE" | "Trenes Argentinos" | "FerroviasSAC" | "Metrovías";
}

export const LINES: LineDefinition[] = [
  {
    id: "sarmiento",
    name: "Sarmiento",
    matchers: ["sarmiento"],
    synth: "sawtooth",
    color: "#f97316",
    operator: "SOFSE",
  },
  {
    id: "mitre",
    name: "Mitre",
    matchers: ["mitre"],
    synth: "sine",
    color: "#eab308",
    operator: "SOFSE",
  },
  {
    id: "roca",
    name: "Roca",
    matchers: ["roca"],
    synth: "square",
    color: "#22c55e",
    operator: "SOFSE",
  },
  {
    id: "san-martin",
    name: "San Martín",
    matchers: ["san mart", "sanmartin"],
    synth: "triangle",
    color: "#3b82f6",
    operator: "SOFSE",
  },
  {
    id: "belgrano-norte",
    name: "Belgrano Norte",
    matchers: ["belgrano norte"],
    synth: "fm",
    color: "#ec4899",
    operator: "FerroviasSAC",
  },
  {
    id: "belgrano-sur",
    name: "Belgrano Sur",
    matchers: ["belgrano sur"],
    synth: "am",
    color: "#a855f7",
    operator: "SOFSE",
  },
  {
    id: "urquiza",
    name: "Urquiza",
    matchers: ["urquiza"],
    synth: "metal",
    color: "#14b8a6",
    operator: "Metrovías",
  },
];

export function findLineForRouteName(routeName: string): LineDefinition | null {
  const haystack = routeName.toLowerCase();
  for (const line of LINES) {
    if (line.matchers.some((m) => haystack.includes(m))) return line;
  }
  return null;
}
