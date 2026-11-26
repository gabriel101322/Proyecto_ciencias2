import { GraphData, GraphEdge, GraphVertex } from "../types/graphTypes"

export function cloneGraph(g: GraphData): GraphData {
  return {
    directed: g.directed,
    weighted: g.weighted,
    vertices: g.vertices.map((v) => ({ ...v })),
    edges: g.edges.map((e) => ({ ...e })),
  }
}

export function normalizeEdgeLabels(edges: GraphEdge[]): GraphEdge[] {
  return edges.map((e, idx) => ({
    ...e,
    label: `e${idx + 1}`,
  }))
}

export function nextVertexLabel(vertices: GraphVertex[]): string {
  const used = new Set(vertices.map((v) => v.label.toUpperCase()))
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (const ch of alphabet) {
    if (!used.has(ch)) return ch
  }
  let idx = 1
  while (used.has(`V${idx}`)) idx++
  return `V${idx}`
}

export function edgeConnects(
  edge: GraphEdge,
  u: string,
  v: string,
  directed: boolean
): boolean {
  if (directed) return edge.source === u && edge.target === v
  return (
    (edge.source === u && edge.target === v) ||
    (edge.source === v && edge.target === u)
  )
}

export const PRESET_DIJKSTRA: GraphData = {
  directed: false,
  weighted: true,
  vertices: [
    { id: "A", label: "A", x: 90, y: 200 },
    { id: "B", label: "B", x: 230, y: 95 },
    { id: "C", label: "C", x: 230, y: 305 },
    { id: "D", label: "D", x: 405, y: 95 },
    { id: "E", label: "E", x: 405, y: 305 },
    { id: "F", label: "F", x: 545, y: 200 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 4 },
    { id: "e2", source: "A", target: "C", weight: 2 },
    { id: "e3", source: "C", target: "B", weight: 1 },
    { id: "e4", source: "B", target: "D", weight: 5 },
    { id: "e5", source: "C", target: "E", weight: 8 },
    { id: "e6", source: "C", target: "D", weight: 10 },
    { id: "e7", source: "D", target: "E", weight: 2 },
    { id: "e8", source: "D", target: "F", weight: 6 },
    { id: "e9", source: "E", target: "F", weight: 3 },
  ]),
}

export const PRESET_FLOYD: GraphData = {
  directed: true,
  weighted: true,
  vertices: [
    { id: "A", label: "A", x: 160, y: 95 },
    { id: "B", label: "B", x: 470, y: 95 },
    { id: "C", label: "C", x: 470, y: 305 },
    { id: "D", label: "D", x: 160, y: 305 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 3 },
    { id: "e2", source: "A", target: "D", weight: 7 },
    { id: "e3", source: "B", target: "A", weight: 8 },
    { id: "e4", source: "B", target: "C", weight: 2 },
    { id: "e5", source: "C", target: "A", weight: 5 },
    { id: "e6", source: "C", target: "D", weight: 1 },
    { id: "e7", source: "D", target: "A", weight: 2 },
  ]),
}

export const PRESET_BELLMAN_ORDINAL: GraphData = {
  directed: true,
  weighted: true,
  vertices: [
    { id: "A", label: "A", x: 85, y: 200 },
    { id: "B", label: "B", x: 225, y: 95 },
    { id: "C", label: "C", x: 225, y: 305 },
    { id: "D", label: "D", x: 395, y: 95 },
    { id: "E", label: "E", x: 395, y: 305 },
    { id: "F", label: "F", x: 545, y: 200 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 6 },
    { id: "e2", source: "A", target: "C", weight: 2 },
    { id: "e3", source: "C", target: "B", weight: 3 },
    { id: "e4", source: "B", target: "D", weight: 4 },
    { id: "e5", source: "B", target: "E", weight: 2 },
    { id: "e6", source: "C", target: "E", weight: 7 },
    { id: "e7", source: "E", target: "D", weight: 1 },
    { id: "e8", source: "D", target: "F", weight: 3 },
    { id: "e9", source: "E", target: "F", weight: 5 },
  ]),
}

export const PRESET_SET_OPS_G1: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 90, y: 90 },
    { id: "B", label: "B", x: 240, y: 90 },
    { id: "C", label: "C", x: 240, y: 220 },
    { id: "D", label: "D", x: 90, y: 220 },
  ],
  edges: normalizeEdgeLabels([
    { id: "g1_e1", source: "A", target: "B", weight: 1 },
    { id: "g1_e2", source: "B", target: "C", weight: 1 },
    { id: "g1_e3", source: "C", target: "D", weight: 1 },
    { id: "g1_e4", source: "A", target: "D", weight: 1 },
  ]),
}

export const PRESET_SET_OPS_G2: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "B", label: "B", x: 85, y: 90 },
    { id: "C", label: "C", x: 235, y: 90 },
    { id: "D", label: "D", x: 85, y: 220 },
    { id: "E", label: "E", x: 235, y: 220 },
  ],
  edges: normalizeEdgeLabels([
    { id: "g2_e1", source: "B", target: "C", weight: 1 },
    { id: "g2_e2", source: "B", target: "D", weight: 1 },
    { id: "g2_e3", source: "C", target: "E", weight: 1 },
    { id: "g2_e4", source: "D", target: "E", weight: 1 },
  ]),
}

export const PRESET_PRODUCT_G1: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 95, y: 155 },
    { id: "B", label: "B", x: 235, y: 155 },
  ],
  edges: normalizeEdgeLabels([
    { id: "p1_e1", source: "A", target: "B", weight: 1 },
  ]),
}

export const PRESET_PRODUCT_G2: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "1", label: "1", x: 65, y: 155 },
    { id: "2", label: "2", x: 165, y: 155 },
    { id: "3", label: "3", x: 265, y: 155 },
  ],
  edges: normalizeEdgeLabels([
    { id: "p2_e1", source: "1", target: "2", weight: 1 },
    { id: "p2_e2", source: "2", target: "3", weight: 1 },
  ]),
}

export const PRESET_UNARY_OPS: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 315, y: 70 },
    { id: "B", label: "B", x: 490, y: 170 },
    { id: "C", label: "C", x: 425, y: 325 },
    { id: "D", label: "D", x: 205, y: 325 },
    { id: "E", label: "E", x: 140, y: 170 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 1 },
    { id: "e2", source: "B", target: "C", weight: 1 },
    { id: "e3", source: "C", target: "D", weight: 1 },
    { id: "e4", source: "D", target: "E", weight: 1 },
    { id: "e5", source: "E", target: "A", weight: 1 },
    { id: "e6", source: "A", target: "C", weight: 1 },
  ]),
}

export const PRESET_MST: GraphData = {
  directed: false,
  weighted: true,
  vertices: [
    { id: "A", label: "A", x: 100, y: 200 },
    { id: "B", label: "B", x: 245, y: 85 },
    { id: "C", label: "C", x: 245, y: 315 },
    { id: "D", label: "D", x: 410, y: 85 },
    { id: "E", label: "E", x: 410, y: 315 },
    { id: "F", label: "F", x: 540, y: 200 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 4 },
    { id: "e2", source: "A", target: "C", weight: 3 },
    { id: "e3", source: "B", target: "C", weight: 2 },
    { id: "e4", source: "B", target: "D", weight: 5 },
    { id: "e5", source: "C", target: "D", weight: 6 },
    { id: "e6", source: "C", target: "E", weight: 4 },
    { id: "e7", source: "D", target: "E", weight: 1 },
    { id: "e8", source: "D", target: "F", weight: 7 },
    { id: "e9", source: "E", target: "F", weight: 3 },
  ]),
}

export const PRESET_MATRICES: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 145, y: 95 },
    { id: "B", label: "B", x: 445, y: 95 },
    { id: "C", label: "C", x: 515, y: 275 },
    { id: "D", label: "D", x: 295, y: 330 },
    { id: "E", label: "E", x: 95, y: 275 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 1 },
    { id: "e2", source: "A", target: "E", weight: 1 },
    { id: "e3", source: "A", target: "D", weight: 1 },
    { id: "e4", source: "B", target: "C", weight: 1 },
    { id: "e5", source: "B", target: "D", weight: 1 },
    { id: "e6", source: "C", target: "D", weight: 1 },
    { id: "e7", source: "D", target: "E", weight: 1 },
  ]),
}

export const PRESET_COLORING: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 315, y: 65 },
    { id: "B", label: "B", x: 175, y: 175 },
    { id: "C", label: "C", x: 455, y: 175 },
    { id: "D", label: "D", x: 175, y: 325 },
    { id: "E", label: "E", x: 455, y: 325 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 1 },
    { id: "e2", source: "A", target: "C", weight: 1 },
    { id: "e3", source: "B", target: "C", weight: 1 },
    { id: "e4", source: "B", target: "D", weight: 1 },
    { id: "e5", source: "C", target: "E", weight: 1 },
    { id: "e6", source: "D", target: "E", weight: 1 },
    { id: "e7", source: "B", target: "E", weight: 1 },
  ]),
}

export const PRESET_IND_DOM: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 115, y: 120 },
    { id: "B", label: "B", x: 280, y: 85 },
    { id: "C", label: "C", x: 475, y: 120 },
    { id: "D", label: "D", x: 115, y: 295 },
    { id: "E", label: "E", x: 280, y: 320 },
    { id: "F", label: "F", x: 475, y: 295 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "B", weight: 1 },
    { id: "e2", source: "A", target: "D", weight: 1 },
    { id: "e3", source: "B", target: "C", weight: 1 },
    { id: "e4", source: "B", target: "E", weight: 1 },
    { id: "e5", source: "C", target: "F", weight: 1 },
    { id: "e6", source: "D", target: "E", weight: 1 },
    { id: "e7", source: "E", target: "F", weight: 1 },
  ]),
}

export const PRESET_MATCHING: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 140, y: 95 },
    { id: "B", label: "B", x: 140, y: 205 },
    { id: "C", label: "C", x: 140, y: 315 },
    { id: "D", label: "D", x: 460, y: 95 },
    { id: "E", label: "E", x: 460, y: 205 },
    { id: "F", label: "F", x: 460, y: 315 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "D", weight: 1 },
    { id: "e2", source: "A", target: "E", weight: 1 },
    { id: "e3", source: "B", target: "D", weight: 1 },
    { id: "e4", source: "B", target: "F", weight: 1 },
    { id: "e5", source: "C", target: "E", weight: 1 },
  ]),
}

export const PRESET_CONVEX_HULL: GraphData = {
  directed: false,
  weighted: false,
  vertices: [
    { id: "A", label: "A", x: 120, y: 280 },
    { id: "B", label: "B", x: 265, y: 335 },
    { id: "C", label: "C", x: 485, y: 295 },
    { id: "D", label: "D", x: 525, y: 150 },
    { id: "E", label: "E", x: 355, y: 65 },
    { id: "F", label: "F", x: 150, y: 95 },
    { id: "G", label: "G", x: 270, y: 205 },
    { id: "H", label: "H", x: 385, y: 215 },
  ],
  edges: normalizeEdgeLabels([
    { id: "e1", source: "A", target: "G", weight: 1 },
    { id: "e2", source: "G", target: "H", weight: 1 },
    { id: "e3", source: "B", target: "G", weight: 1 },
    { id: "e4", source: "E", target: "H", weight: 1 },
  ]),
}
