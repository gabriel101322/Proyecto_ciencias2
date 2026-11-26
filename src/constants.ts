import { Section } from "./types"

export const HASH_ALGORITHMS = [
  "Hash Mod",
  "Hash Cuadrado",
  "Truncamiento",
  "Hash Plegamiento",
]

export const COLLISION_SOLUTIONS = [
  "Lista Enlazada",
  "Solución Lineal",
  "Solución Cuadrática",
  "Doble Función Hash",
  "Arreglo Anidado",
]

export const TREE_ALGORITHMS = [
  "Búsqueda Digital",
  "Búsqueda por Residuos",
  "Búsqueda por Residuos Múltiples",
  "Árbol de Huffman"
]

export const SECTIONS: Section[] = [
  {
    id: "internas",
    label: "Búsquedas Internas",
    icon: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h7v4h-7v-4Z",
    options: [
      "Secuencial",
      "Binaria",
      "Transformaciones de Claves",
      "Árboles de Búsqueda",
    ],
  },
  {
    id: "externas",
    label: "Búsquedas Externas",
    icon: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4",
    options: ["Secuencial", "Binaria", "Transformaciones de Claves", "Búsquedas Dinámicas"],
  },
  {
    id: "grafos",
    label: "Grafos",
    icon: "M6 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 7l8 0M7.5 8.5 11 13m6-4.5L13 13",
    options: ["Recorridos", "Ruta más corta", "Árbol de expansión"],
  },
]
