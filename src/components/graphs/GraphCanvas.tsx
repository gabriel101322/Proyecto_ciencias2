import { useMemo, useRef, useState } from "react"
import {
  EdgeVisualState,
  GraphCanvasTool,
  GraphData,
  GraphEdge,
  RayLine,
  VertexVisualState,
} from "../../types/graphTypes"

const COLOR_PALETTE = [
  { fill: "#fbe4d8", stroke: "#853927", text: "#52241A" }, // C1 Terracota
  { fill: "#dcfce7", stroke: "#15803d", text: "#14532d" }, // C2 Esmeralda
  { fill: "#dbeafe", stroke: "#1d4ed8", text: "#1e3a8a" }, // C3 Azul Real
  { fill: "#fef3c7", stroke: "#b45309", text: "#78350f" }, // C4 Ámbar
  { fill: "#f3e8ff", stroke: "#7e22ce", text: "#581c87" }, // C5 Violeta
  { fill: "#ffe4e6", stroke: "#be123c", text: "#881337" }, // C6 Coral
  { fill: "#ccfbf1", stroke: "#0f766e", text: "#134e4a" }, // C7 Turquesa
  { fill: "#ecfccb", stroke: "#4d7c0f", text: "#365314" }, // C8 Oliva
]

interface GraphCanvasProps {
  graph: GraphData
  title?: string
  compact?: boolean
  readOnly?: boolean
  tool?: GraphCanvasTool
  defaultEdgeWeight?: number
  showEdgeNames?: boolean
  showCartesianGrid?: boolean
  vertexStates?: Record<string, VertexVisualState>
  edgeStates?: Record<string, EdgeVisualState>
  selectedVertexIds?: string[]
  highlightedVertexId?: string | null
  highlightedEdgeId?: string | null
  hullPolygon?: Array<{ x: number; y: number; label: string; id: string }>
  rayLines?: RayLine[]
  onMoveVertex?: (id: string, x: number, y: number) => void
  onAddVertexAt?: (x: number, y: number) => void
  onAddEdgeBetween?: (sourceId: string, targetId: string, weight: number) => void
  onDeleteVertex?: (id: string) => void
  onDeleteEdge?: (id: string) => void
  onUpdateEdgeWeight?: (edgeId: string, newWeight: number) => void
  onSelectVertex?: (id: string) => void
}

const VIEW_W = 630
const VIEW_H = 400
const NODE_R = 21

interface ComputedEdgeGeometry {
  edge: GraphEdge
  ux: number
  uy: number
  vx: number
  vy: number
  ctrlX: number
  ctrlY: number
  curved: boolean
  length: number
  pathD: string
  arrowPoints?: string
  badgeText: string
  labelX: number
  labelY: number
  anchorX: number
  anchorY: number
  hasLeader: boolean
  badgeW: number
  badgeH: number
}

function evalQuadPoint(
  ux: number,
  uy: number,
  cx: number,
  cy: number,
  vx: number,
  vy: number,
  t: number
) {
  const mt = 1 - t
  const x = mt * mt * ux + 2 * mt * t * cx + t * t * vx
  const y = mt * mt * uy + 2 * mt * t * cy + t * t * vy
  const tx = 2 * mt * (cx - ux) + 2 * t * (vx - cx)
  const ty = 2 * mt * (cy - uy) + 2 * t * (vy - cy)
  const tLen = Math.hypot(tx, ty) || 1
  return {
    x,
    y,
    ux: tx / tLen,
    uy: ty / tLen,
    nx: -ty / tLen,
    ny: tx / tLen,
  }
}

function segmentIntersection(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): { x: number; y: number } | null {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx)
  if (Math.abs(denom) < 1e-6) return null
  const s = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom
  const t = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom
  if (s > 0.06 && s < 0.94 && t > 0.06 && t < 0.94) {
    return { x: ax + s * (bx - ax), y: ay + s * (by - ay) }
  }
  return null
}

function pointToSegmentDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const vx = bx - ax
  const vy = by - ay
  const lenSq = vx * vx + vy * vy
  if (lenSq < 1e-6) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / lenSq))
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy))
}

export default function GraphCanvas({
  graph,
  title,
  compact = false,
  readOnly = false,
  tool = "move",
  defaultEdgeWeight = 1,
  showEdgeNames = false,
  showCartesianGrid = false,
  vertexStates,
  edgeStates,
  selectedVertexIds = [],
  highlightedVertexId,
  highlightedEdgeId,
  hullPolygon,
  rayLines,
  onMoveVertex,
  onAddVertexAt,
  onAddEdgeBetween,
  onDeleteVertex,
  onDeleteEdge,
  onUpdateEdgeWeight,
  onSelectVertex,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [pendingEdgeSource, setPendingEdgeSource] = useState<string | null>(null)
  const [editingEdge, setEditingEdge] = useState<{ id: string; value: string; x: number; y: number } | null>(null)

  const vMap = new Map(graph.vertices.map((v) => [v.id, v]))

  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 300, y: 200 }
    const rect = svg.getBoundingClientRect()
    const scaleX = VIEW_W / Math.max(rect.width, 1)
    const scaleY = VIEW_H / Math.max(rect.height, 1)
    const x = Math.max(36, Math.min(VIEW_W - 36, Math.round((clientX - rect.left) * scaleX)))
    const y = Math.max(40, Math.min(VIEW_H - 36, Math.round((clientY - rect.top) * scaleY)))
    return { x, y }
  }

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return
    if (e.target !== svgRef.current && !(e.target as Element).classList.contains("canvas-bg")) {
      return
    }
    if (tool === "add_vertex" && onAddVertexAt) {
      const { x, y } = toSvgCoords(e.clientX, e.clientY)
      onAddVertexAt(x, y)
    } else if (pendingEdgeSource) {
      setPendingEdgeSource(null)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId || readOnly || !onMoveVertex) return
    const { x, y } = toSvgCoords(e.clientX, e.clientY)
    onMoveVertex(draggingId, x, y)
  }

  const handlePointerUp = () => {
    if (draggingId) setDraggingId(null)
  }

  const handleVertexPointerDown = (e: React.PointerEvent, vertexId: string) => {
    e.stopPropagation()
    if (readOnly) return

    if (tool === "move") {
      setDraggingId(vertexId)
    } else if (tool === "delete") {
      onDeleteVertex?.(vertexId)
    } else if (tool === "select") {
      onSelectVertex?.(vertexId)
    } else if (tool === "add_edge") {
      if (!pendingEdgeSource) {
        setPendingEdgeSource(vertexId)
      } else if (pendingEdgeSource === vertexId) {
        setPendingEdgeSource(null)
      } else {
        onAddEdgeBetween?.(pendingEdgeSource, vertexId, defaultEdgeWeight)
        setPendingEdgeSource(null)
      }
    }
  }

  const handleEdgeClick = (e: React.MouseEvent, edge: GraphEdge, midX: number, midY: number) => {
    e.stopPropagation()
    if (readOnly) return
    if (tool === "delete") {
      onDeleteEdge?.(edge.id)
    } else if (graph.weighted && onUpdateEdgeWeight) {
      setEditingEdge({ id: edge.id, value: String(edge.weight), x: midX, y: midY })
    }
  }

  // Cálculo geométrico de aristas, puntas de flecha de alta visibilidad y anticolisión de pesos
  const edgeGeometries = useMemo<ComputedEdgeGeometry[]>(() => {
    const rawList: Array<{
      edge: GraphEdge
      idx: number
      ux: number
      uy: number
      vx: number
      vy: number
      ctrlX: number
      ctrlY: number
      curved: boolean
      length: number
      pathD: string
      arrowPoints?: string
      badgeText: string
      badgeW: number
      badgeH: number
      samples: Array<{ x: number; y: number }>
    }> = []

    graph.edges.forEach((edge, idx) => {
      const u = vMap.get(edge.source)
      const v = vMap.get(edge.target)
      if (!u || !v) return

      const curved =
        graph.directed &&
        graph.edges.some(
          (other) =>
            other.id !== edge.id &&
            other.source === edge.target &&
            other.target === edge.source
        )

      const dx = v.x - u.x
      const dy = v.y - u.y
      const dist = Math.hypot(dx, dy) || 1
      const nx = -dy / dist
      const ny = dx / dist
      const curveOffset = curved ? 26 : 0

      const ctrlX = (u.x + v.x) / 2 + nx * curveOffset
      const ctrlY = (u.y + v.y) / 2 + ny * curveOffset

      // Vector de llegada al nodo destino (tangente en el extremo final)
      const endVecX = v.x - ctrlX
      const endVecY = v.y - ctrlY
      const endLen = Math.hypot(endVecX, endVecY) || 1
      const dirX = endVecX / endLen
      const dirY = endVecY / endLen
      const perpX = -dirY
      const perpY = dirX

      // Punta de la flecha justo en el borde exterior del círculo destino
      const tipDistFromCenter = NODE_R + 2.5
      const tipX = v.x - dirX * tipDistFromCenter
      const tipY = v.y - dirY * tipDistFromCenter

      const arrowLen = 15.5
      const arrowHalfW = 6.8
      const notchDepth = 11.5

      const lineEndX = graph.directed ? tipX - dirX * notchDepth : v.x
      const lineEndY = graph.directed ? tipY - dirY * notchDepth : v.y

      // Recortar inicio en el borde del círculo origen
      const startVecX = ctrlX - u.x
      const startVecY = ctrlY - u.y
      const startLen = Math.hypot(startVecX, startVecY) || 1
      const lineStartX = u.x + (startVecX / startLen) * NODE_R
      const lineStartY = u.y + (startVecY / startLen) * NODE_R

      const pathD = curved
        ? `M ${lineStartX} ${lineStartY} Q ${ctrlX} ${ctrlY} ${lineEndX} ${lineEndY}`
        : `M ${lineStartX} ${lineStartY} L ${lineEndX} ${lineEndY}`

      let arrowPoints: string | undefined

      if (graph.directed) {
        const wing1X = tipX - dirX * arrowLen + perpX * arrowHalfW
        const wing1Y = tipY - dirY * arrowLen + perpY * arrowHalfW
        const notchX = tipX - dirX * notchDepth
        const notchY = tipY - dirY * notchDepth
        const wing2X = tipX - dirX * arrowLen - perpX * arrowHalfW
        const wing2Y = tipY - dirY * arrowLen - perpY * arrowHalfW
        arrowPoints = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${wing1X.toFixed(1)},${wing1Y.toFixed(1)} ${notchX.toFixed(1)},${notchY.toFixed(1)} ${wing2X.toFixed(1)},${wing2Y.toFixed(1)}`
      }

      const eState = edgeStates?.[edge.id]
      const eName = edge.label ?? `e${idx + 1}`
      const badgeText =
        eState?.labelOverride ??
        (showEdgeNames && graph.weighted
          ? `${eName}:${edge.weight}`
          : showEdgeNames
          ? eName
          : graph.weighted
          ? String(edge.weight)
          : "")

      const badgeW = badgeText ? Math.max(24, badgeText.length * 8.4 + 10) : 0
      const badgeH = badgeText ? 19 : 0

      // Polilínea muestreada en 4 tramos para detectar cruces entre aristas rectas o curvas
      const sampleTs = [0, 0.25, 0.5, 0.75, 1]
      const samples = sampleTs.map((t) => {
        const p = evalQuadPoint(u.x, u.y, ctrlX, ctrlY, v.x, v.y, t)
        return { x: p.x, y: p.y }
      })

      rawList.push({
        edge,
        idx,
        ux: u.x,
        uy: u.y,
        vx: v.x,
        vy: v.y,
        ctrlX,
        ctrlY,
        curved,
        length: dist,
        pathD,
        arrowPoints,
        badgeText,
        badgeW,
        badgeH,
        samples,
      })
    })

    // 1. Detectar todos los puntos donde dos aristas se cruzan
    const crossings: Array<{ x: number; y: number }> = []
    for (let i = 0; i < rawList.length; i++) {
      for (let j = i + 1; j < rawList.length; j++) {
        const a = rawList[i]
        const b = rawList[j]
        for (let sa = 0; sa < a.samples.length - 1; sa++) {
          for (let sb = 0; sb < b.samples.length - 1; sb++) {
            const hit = segmentIntersection(
              a.samples[sa].x,
              a.samples[sa].y,
              a.samples[sa + 1].x,
              a.samples[sa + 1].y,
              b.samples[sb].x,
              b.samples[sb].y,
              b.samples[sb + 1].x,
              b.samples[sb + 1].y
            )
            if (hit) crossings.push(hit)
          }
        }
      }
    }

    // 2. Ubicar cada etiqueta de peso evitando cruces, otras etiquetas, vértices y aristas ajenas
    const placedBoxes: Array<{ x: number; y: number; w: number; h: number }> = []
    const placementByEdgeId = new Map<
      string,
      { labelX: number; labelY: number; anchorX: number; anchorY: number; hasLeader: boolean }
    >()

    // Procesar primero las aristas más cortas (tienen menos margen para deslizar su etiqueta)
    const order = [...rawList].sort((a, b) => a.length - b.length)

    const tCandidatesUndirected = [0.5, 0.34, 0.66, 0.26, 0.74, 0.42, 0.58, 0.21, 0.79]
    const tCandidatesDirected = [0.44, 0.31, 0.57, 0.24, 0.64, 0.38, 0.5, 0.2]
    const normalOffsets = [0, 14, -14, 22, -22]

    for (const item of order) {
      if (!item.badgeText) {
        const mid = evalQuadPoint(item.ux, item.uy, item.ctrlX, item.ctrlY, item.vx, item.vy, 0.5)
        placementByEdgeId.set(item.edge.id, {
          labelX: mid.x,
          labelY: mid.y,
          anchorX: mid.x,
          anchorY: mid.y,
          hasLeader: false,
        })
        continue
      }

      const tList = graph.directed ? tCandidatesDirected : tCandidatesUndirected
      const preferredT = graph.directed ? 0.44 : 0.5

      let bestScore = Number.POSITIVE_INFINITY
      let bestPos = {
        labelX: (item.ux + item.vx) / 2,
        labelY: (item.uy + item.vy) / 2,
        anchorX: (item.ux + item.vx) / 2,
        anchorY: (item.uy + item.vy) / 2,
        hasLeader: false,
      }

      for (const nOff of normalOffsets) {
        for (const t of tList) {
          const anchor = evalQuadPoint(
            item.ux,
            item.uy,
            item.ctrlX,
            item.ctrlY,
            item.vx,
            item.vy,
            t
          )
          const cx = anchor.x + anchor.nx * nOff
          const cy = anchor.y + anchor.ny * nOff

          let penalty =
            Math.abs(t - preferredT) * 22 + (nOff === 0 ? 0 : 45 + Math.abs(nOff) * 2.5)

          // Mantener dentro del lienzo visible
          if (
            cx - item.badgeW / 2 < 8 ||
            cx + item.badgeW / 2 > VIEW_W - 8 ||
            cy - item.badgeH / 2 < 8 ||
            cy + item.badgeH / 2 > VIEW_H - 8
          ) {
            penalty += 15000
          }

          // Alejar de cualquier intersección X entre aristas
          for (const cr of crossings) {
            const dCross = Math.hypot(cx - cr.x, cy - cr.y)
            if (dCross < 30) {
              penalty += (30 - dCross) * 140
            }
          }

          // Evitar superposición con otras etiquetas ya ubicadas
          for (const box of placedBoxes) {
            const overlapX = (item.badgeW + box.w) / 2 + 6 - Math.abs(cx - box.x)
            const overlapY = (item.badgeH + box.h) / 2 + 5 - Math.abs(cy - box.y)
            if (overlapX > 0 && overlapY > 0) {
              penalty += 60000 + overlapX * overlapY * 120
            } else {
              const dBox = Math.hypot(cx - box.x, cy - box.y)
              if (dBox < 34) penalty += (34 - dBox) * 25
            }
          }

          // Evitar tapar vértices
          for (const vert of graph.vertices) {
            const dVert = Math.hypot(cx - vert.x, cy - vert.y)
            const minClear = NODE_R + 14
            if (dVert < minClear) {
              penalty += (minClear - dVert) * 900
            }
          }

          // Evitar posarse encima del trazo de otra arista distinta
          for (const other of rawList) {
            if (other.edge.id === item.edge.id) continue
            for (let s = 0; s < other.samples.length - 1; s++) {
              const dSeg = pointToSegmentDist(
                cx,
                cy,
                other.samples[s].x,
                other.samples[s].y,
                other.samples[s + 1].x,
                other.samples[s + 1].y
              )
              if (dSeg < 15) {
                penalty += (15 - dSeg) * 85
              }
            }
          }

          if (penalty < bestScore) {
            bestScore = penalty
            bestPos = {
              labelX: cx,
              labelY: cy,
              anchorX: anchor.x,
              anchorY: anchor.y,
              hasLeader: Math.abs(nOff) > 0,
            }
          }
        }
      }

      placedBoxes.push({
        x: bestPos.labelX,
        y: bestPos.labelY,
        w: item.badgeW,
        h: item.badgeH,
      })
      placementByEdgeId.set(item.edge.id, bestPos)
    }

    return rawList.map((item) => {
      const pos = placementByEdgeId.get(item.edge.id)!
      return {
        edge: item.edge,
        ux: item.ux,
        uy: item.uy,
        vx: item.vx,
        vy: item.vy,
        ctrlX: item.ctrlX,
        ctrlY: item.ctrlY,
        curved: item.curved,
        length: item.length,
        pathD: item.pathD,
        arrowPoints: item.arrowPoints,
        badgeText: item.badgeText,
        badgeW: item.badgeW,
        badgeH: item.badgeH,
        ...pos,
      }
    })
  }, [graph.vertices, graph.edges, graph.directed, graph.weighted, showEdgeNames, edgeStates])

  const getEdgeColors = (st?: EdgeVisualState, isCrossHighlighted?: boolean) => {
    if (isCrossHighlighted) {
      return { stroke: "#d97706", width: 4, opacity: 1 }
    }
    switch (st?.status) {
      case "accepted":
      case "shared":
        return { stroke: "#2f7d4f", width: st.thick ? 3.8 : 3.2, opacity: 1 }
      case "exploring":
        return { stroke: "#d97706", width: 3.6, opacity: 1 }
      case "rejected":
        return { stroke: "#c62828", width: st.thick ? 3 : 2.3, opacity: 0.78 }
      case "complement":
      case "new":
        return { stroke: "#0f766e", width: 3, opacity: 0.95 }
      case "g1":
        return { stroke: "#6B2E24", width: 3, opacity: 0.95 }
      case "g2":
        return { stroke: "#1d4ed8", width: 3, opacity: 0.95 }
      case "dimmed":
        return { stroke: "#52241A", width: 1.7, opacity: 0.22 }
      default:
        return { stroke: "#52241A", width: 2.4, opacity: 0.8 }
    }
  }

  const getVertexColors = (
    st?: VertexVisualState,
    isSelected?: boolean,
    isPendingSrc?: boolean,
    isCrossHighlighted?: boolean
  ) => {
    if (isPendingSrc || isCrossHighlighted) {
      return { fill: "#fef3c7", stroke: "#d97706", text: "#78350f", ring: "rgba(217,119,6,0.32)" }
    }
    if (st?.colorIndex && st.colorIndex >= 1) {
      const p = COLOR_PALETTE[(st.colorIndex - 1) % COLOR_PALETTE.length]
      return {
        fill: p.fill,
        stroke: p.stroke,
        text: p.text,
        ring: st.status === "active" ? "rgba(217,119,6,0.38)" : undefined,
      }
    }
    if (isSelected) {
      return { fill: "#dcfce7", stroke: "#2f7d4f", text: "#14532d", ring: "rgba(47,125,79,0.28)" }
    }
    switch (st?.status) {
      case "active":
        return { fill: "#fff7ed", stroke: "#d97706", text: "#7c2d12", ring: "rgba(217,119,6,0.35)" }
      case "source":
        return { fill: "#52241A", stroke: "#E6B793", text: "#ffffff", ring: "rgba(230,183,147,0.45)" }
      case "target":
        return { fill: "#1e3a8a", stroke: "#93c5fd", text: "#ffffff", ring: "rgba(59,130,246,0.35)" }
      case "selected":
        return { fill: "#dcfce7", stroke: "#2f7d4f", text: "#14532d", ring: "rgba(47,125,79,0.26)" }
      case "visited":
        return { fill: "#f5ebe1", stroke: "#6B2E24", text: "#52241A" }
      case "dominated":
        return { fill: "#ecfdf5", stroke: "#10b981", text: "#065f46" }
      case "blocked":
      case "removed":
        return { fill: "#fee2e2", stroke: "#c62828", text: "#991b1b" }
      case "merged":
        return { fill: "#fef3c7", stroke: "#6B2E24", text: "#52241A", ring: "rgba(230,183,147,0.5)" }
      default:
        return { fill: "#ffffff", stroke: "#52241A", text: "#2b1610" }
    }
  }

  const toolHint: Record<GraphCanvasTool, string> = {
    move: graph.weighted && !readOnly ? "Arrastra vértices • Clic en peso para editarlo" : "Arrastra los vértices libremente",
    add_vertex: "Haz clic en un espacio libre del lienzo para agregar vértices",
    add_edge: pendingEdgeSource
      ? `Origen ${vMap.get(pendingEdgeSource)?.label}: ahora haz clic en el vértice destino`
      : "Haz clic en el vértice origen y luego en el vértice destino",
    delete: "Haz clic sobre cualquier vértice o arista para eliminarlo",
    select: "Haz clic sobre los vértices para armar o probar tu propio subconjunto",
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#52241A]/15 bg-white shadow-sm">
      {(title || !readOnly) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#52241A]/10 bg-[#faf6f2]/80 px-3.5 py-2">
          {title && (
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#52241A]">
              {title}
            </span>
          )}
          {!readOnly && (
            <span className="text-[11px] font-medium text-[#52241A]/65">
              {toolHint[tool]}
            </span>
          )}
        </div>
      )}

      <div className={`relative flex-1 ${compact ? "min-h-[215px]" : "min-h-[340px]"} w-full bg-[#faf6f2]/35`}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          onClick={handleSvgClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`h-full w-full select-none ${
            readOnly
              ? "cursor-default"
              : tool === "add_vertex"
              ? "cursor-crosshair"
              : draggingId
              ? "cursor-grabbing"
              : "cursor-default"
          }`}
        >
          {/* Fondo clicable */}
          <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="transparent" className="canvas-bg" />

          {/* Cuadrícula cartesiana opcional */}
          {showCartesianGrid && (
            <g className="pointer-events-none" opacity={0.45}>
              {Array.from({ length: 12 }, (_, i) => (i + 1) * 50).map((gx) => (
                <g key={`gx-${gx}`}>
                  <line x1={gx} y1={15} x2={gx} y2={VIEW_H - 15} stroke="#52241A" strokeOpacity={0.12} strokeDasharray="3 3" />
                  <text x={gx} y={VIEW_H - 4} textAnchor="middle" fontSize="9" fill="#52241A" opacity={0.55}>
                    {gx}
                  </text>
                </g>
              ))}
              {Array.from({ length: 7 }, (_, i) => (i + 1) * 50).map((gy) => (
                <g key={`gy-${gy}`}>
                  <line x1={25} y1={gy} x2={VIEW_W - 15} y2={gy} stroke="#52241A" strokeOpacity={0.12} strokeDasharray="3 3" />
                  <text x={18} y={gy + 3} textAnchor="end" fontSize="9" fill="#52241A" opacity={0.55}>
                    {VIEW_H - gy}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Polígono sombreado para Envolvente Convexa */}
          {hullPolygon && hullPolygon.length >= 3 && (
            <polygon
              points={hullPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="#2f7d4f"
              fillOpacity={0.13}
              stroke="#2f7d4f"
              strokeWidth={3}
              strokeLinejoin="round"
              className="pointer-events-none transition-all duration-300"
            />
          )}

          {/* Rayos auxiliares (Graham Scan / ángulos polares / giros) */}
          {rayLines &&
            rayLines.map((rl, idx) => {
              const stroke =
                rl.tone === "ok"
                  ? "#2f7d4f"
                  : rl.tone === "warn"
                  ? "#c62828"
                  : "#1d4ed8"
              const mx = (rl.x1 + rl.x2) / 2
              const my = (rl.y1 + rl.y2) / 2
              return (
                <g key={`ray-${idx}`} className="pointer-events-none">
                  <line
                    x1={rl.x1}
                    y1={rl.y1}
                    x2={rl.x2}
                    y2={rl.y2}
                    stroke={stroke}
                    strokeWidth={rl.tone === "ok" ? 2.8 : 1.8}
                    strokeDasharray={rl.dashed ? "5 4" : undefined}
                    strokeOpacity={0.85}
                  />
                  {rl.label && (
                    <g transform={`translate(${mx}, ${my})`}>
                      <rect x={-22} y={-9} width={44} height={16} rx={4} fill="#ffffff" fillOpacity={0.9} />
                      <text textAnchor="middle" y={3} fontSize="10" fontWeight="700" fill={stroke}>
                        {rl.label}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

          {/* Capa 1: Líneas y puntas de flecha de las aristas */}
          {edgeGeometries.map((geom) => {
            const { edge, pathD, arrowPoints, labelX, labelY } = geom
            const eState = edgeStates?.[edge.id]
            const isCrossHl = highlightedEdgeId === edge.id
            const style = getEdgeColors(eState, isCrossHl)

            return (
              <g
                key={`line-${edge.id}`}
                onClick={(ev) => handleEdgeClick(ev, edge, labelX, labelY)}
                className={!readOnly && (tool === "delete" || graph.weighted) ? "cursor-pointer" : ""}
              >
                {/* Área ancha transparente para clic cómodo */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth={14} />
                <path
                  d={pathD}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={style.width}
                  strokeOpacity={style.opacity}
                  strokeDasharray={eState?.dashed ? "6 4" : undefined}
                  strokeLinecap="round"
                  className="transition-colors duration-300"
                />

                {/* Punta de flecha grande y definida con halo blanco para máxima nitidez */}
                {arrowPoints && (
                  <polygon
                    points={arrowPoints}
                    fill={style.stroke}
                    fillOpacity={Math.min(1, style.opacity + 0.15)}
                    stroke="#ffffff"
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                    style={{ paintOrder: "stroke" }}
                    className="pointer-events-none transition-colors duration-300"
                  />
                )}
              </g>
            )
          })}

          {/* Capa 2: Etiquetas de pesos / nombres de arista (anticolisión sobre las líneas) */}
          {edgeGeometries.map((geom) => {
            const { edge, badgeText, badgeW, badgeH, labelX, labelY, anchorX, anchorY, hasLeader } = geom
            if (!badgeText) return null
            const eState = edgeStates?.[edge.id]
            const isCrossHl = highlightedEdgeId === edge.id
            const style = getEdgeColors(eState, isCrossHl)

            return (
              <g
                key={`badge-${edge.id}`}
                onClick={(ev) => handleEdgeClick(ev, edge, labelX, labelY)}
                className={!readOnly && (tool === "delete" || graph.weighted) ? "cursor-pointer" : ""}
              >
                {hasLeader && (
                  <line
                    x1={anchorX}
                    y1={anchorY}
                    x2={labelX}
                    y2={labelY}
                    stroke={style.stroke}
                    strokeWidth={1.2}
                    strokeDasharray="2 2"
                    strokeOpacity={Math.max(0.45, style.opacity)}
                  />
                )}
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    x={-badgeW / 2}
                    y={-badgeH / 2}
                    width={badgeW}
                    height={badgeH}
                    rx={5.5}
                    fill="#ffffff"
                    stroke={style.stroke}
                    strokeOpacity={Math.max(0.5, style.opacity)}
                    strokeWidth={1.4}
                  />
                  <text
                    textAnchor="middle"
                    y={3.8}
                    fontSize="10.5"
                    fontWeight="700"
                    fill={style.stroke}
                    opacity={Math.max(0.7, style.opacity)}
                  >
                    {badgeText}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Capa 3: Vértices */}
          {graph.vertices.map((v) => {
            const vState = vertexStates?.[v.id]
            const isSelected = selectedVertexIds.includes(v.id)
            const isPendingSrc = pendingEdgeSource === v.id
            const isCrossHl = highlightedVertexId === v.id
            const colors = getVertexColors(vState, isSelected, isPendingSrc, isCrossHl)

            return (
              <g
                key={v.id}
                transform={`translate(${v.x}, ${v.y})`}
                onPointerDown={(ev) => handleVertexPointerDown(ev, v.id)}
                opacity={vState?.dimmed ? 0.42 : 1}
                className={`transition-opacity duration-300 ${
                  readOnly
                    ? "cursor-default"
                    : tool === "move"
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-pointer"
                }`}
              >
                {colors.ring && (
                  <circle
                    r={NODE_R + 6}
                    fill="none"
                    stroke={colors.ring}
                    strokeWidth={6}
                  />
                )}
                <circle
                  r={NODE_R}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={2.5}
                />
                <text
                  textAnchor="middle"
                  y={4.5}
                  fontSize={v.label.length > 2 ? "11" : "13"}
                  fontWeight="700"
                  fill={colors.text}
                >
                  {v.label}
                </text>

                {vState?.badge && (
                  <g transform={`translate(0, ${-NODE_R - 11})`} className="pointer-events-none">
                    <rect
                      x={-Math.max(20, vState.badge.length * 3.6 + 6)}
                      y={-9}
                      width={Math.max(40, vState.badge.length * 7.2 + 12)}
                      height={16}
                      rx={6}
                      fill="#52241A"
                    />
                    <text
                      textAnchor="middle"
                      y={2.5}
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#faf6f2"
                    >
                      {vState.badge}
                    </text>
                  </g>
                )}

                {vState?.subBadge && (
                  <g transform={`translate(0, ${NODE_R + 12})`} className="pointer-events-none">
                    <rect
                      x={-Math.max(18, vState.subBadge.length * 3.3 + 5)}
                      y={-8}
                      width={Math.max(36, vState.subBadge.length * 6.6 + 10)}
                      height={14}
                      rx={4}
                      fill="#ffffff"
                      fillOpacity={0.92}
                      stroke="#52241A"
                      strokeOpacity={0.2}
                    />
                    <text
                      textAnchor="middle"
                      y={2.5}
                      fontSize="9"
                      fontWeight="600"
                      fill="#52241A"
                    >
                      {vState.subBadge}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {graph.vertices.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-semibold text-[#52241A]/55">Lienzo vacío — Crea tu grafo desde cero</p>
            <p className="mt-1 max-w-xs text-xs text-[#52241A]/45">
              {readOnly
                ? "El grafo resultante aparecerá aquí cuando agregues vértices en G₁ y G₂."
                : 'Haz clic en el lienzo con "+ Vértice" activo para colocar nodos, o pulsa "↺ Ejemplo Guiado" si deseas cargar un modelo base.'}
            </p>
          </div>
        )}

        {/* Editor flotante rápido para peso de arista */}
        {editingEdge && (
          <div className="absolute inset-x-4 bottom-3 z-20 mx-auto flex max-w-xs items-center gap-2 rounded-xl border border-[#52241A]/20 bg-white px-3 py-2 shadow-lg">
            <span className="text-xs font-semibold text-[#52241A]">Nuevo peso:</span>
            <input
              autoFocus
              type="number"
              value={editingEdge.value}
              onChange={(e) => setEditingEdge({ ...editingEdge, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const parsed = Number(editingEdge.value)
                  if (Number.isFinite(parsed)) onUpdateEdgeWeight?.(editingEdge.id, parsed)
                  setEditingEdge(null)
                } else if (e.key === "Escape") {
                  setEditingEdge(null)
                }
              }}
              className="h-7 w-20 rounded-md border border-[#52241A]/25 px-2 text-xs font-semibold text-[#2b1610] outline-none focus:border-[#6B2E24]"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = Number(editingEdge.value)
                if (Number.isFinite(parsed)) onUpdateEdgeWeight?.(editingEdge.id, parsed)
                setEditingEdge(null)
              }}
              className="rounded-md bg-[#52241A] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#6B2E24]"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setEditingEdge(null)}
              className="rounded-md px-2 py-1 text-xs text-[#52241A]/70 hover:bg-[#52241A]/10"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
