export interface GraphVertex {
  id: string
  label: string
  x: number
  y: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  weight: number
  label?: string
}

export interface GraphData {
  vertices: GraphVertex[]
  edges: GraphEdge[]
  directed: boolean
  weighted: boolean
}

export type VertexHighlightStatus =
  | "default"
  | "active"
  | "visited"
  | "selected"
  | "dominated"
  | "blocked"
  | "source"
  | "target"
  | "removed"
  | "merged"

export interface VertexVisualState {
  status?: VertexHighlightStatus
  badge?: string
  subBadge?: string
  colorIndex?: number // 1-based palette index for coloring / partitioning
  dimmed?: boolean
}

export type EdgeHighlightStatus =
  | "default"
  | "exploring"
  | "accepted"
  | "rejected"
  | "dimmed"
  | "new"
  | "complement"
  | "g1"
  | "g2"
  | "shared"

export interface EdgeVisualState {
  status?: EdgeHighlightStatus
  dashed?: boolean
  thick?: boolean
  labelOverride?: string
}

export interface MatrixCell {
  value: string | number
  highlight?: "pivot" | "updated" | "active" | "infinity" | "positive" | "negative" | "zero"
  tooltip?: string
}

export interface MatrixDisplayData {
  id: string
  title: string
  subtitle?: string
  rowHeaders: string[]
  colHeaders: string[]
  cells: MatrixCell[][]
  footerNote?: string
}

export interface AdjacencyListEntry {
  vertexId: string
  vertexLabel: string
  degreeInfo?: string
  neighbors: Array<{
    targetLabel: string
    edgeLabel?: string
    weight?: number
    edgeId: string
    targetId: string
  }>
}

export interface RayLine {
  x1: number
  y1: number
  x2: number
  y2: number
  label?: string
  tone?: "neutral" | "ok" | "warn" | "info"
  dashed?: boolean
}

export interface GraphBadgeGroup {
  title: string
  items: string[]
  tone?: "primary" | "green" | "amber" | "red" | "blue" | "purple"
}

export interface GraphSummaryCard {
  label: string
  value: string
  accent?: "ok" | "warn" | "info"
}

export interface GraphAlgorithmStep {
  title: string
  description: string
  formula?: string
  detailList?: string[]
  vertexStates?: Record<string, VertexVisualState>
  edgeStates?: Record<string, EdgeVisualState>
  overrideGraph?: GraphData
  hullPolygon?: Array<{ x: number; y: number; label: string; id: string }>
  rayLines?: RayLine[]
  matrices?: MatrixDisplayData[]
  badgeGroups?: GraphBadgeGroup[]
  summaryCards?: GraphSummaryCard[]
}

export type GraphCanvasTool = "move" | "add_vertex" | "add_edge" | "delete" | "select"
