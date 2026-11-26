import {
  EdgeVisualState,
  GraphAlgorithmStep,
  GraphData,
  MatrixCell,
  MatrixDisplayData,
  VertexVisualState,
} from "../../types/graphTypes"
import { cloneGraph } from "../graphPresets"

const INF = Number.POSITIVE_INFINITY
const fmtDist = (d: number) => (Number.isFinite(d) ? String(d) : "∞")

function getOutgoingNeighbors(graph: GraphData, u: string) {
  const list: Array<{ neighbor: string; weight: number; edgeId: string }> = []
  for (const e of graph.edges) {
    const w = graph.weighted ? e.weight : 1
    if (e.source === u) {
      list.push({ neighbor: e.target, weight: w, edgeId: e.id })
    } else if (!graph.directed && e.target === u) {
      list.push({ neighbor: e.source, weight: w, edgeId: e.id })
    }
  }
  return list
}

function getIncomingNeighbors(graph: GraphData, v: string) {
  const list: Array<{ from: string; weight: number; edgeId: string }> = []
  for (const e of graph.edges) {
    const w = graph.weighted ? e.weight : 1
    if (e.target === v) {
      list.push({ from: e.source, weight: w, edgeId: e.id })
    } else if (!graph.directed && e.source === v) {
      list.push({ from: e.target, weight: w, edgeId: e.id })
    }
  }
  return list
}

// ── 1. ALGORITMO DE DIJKSTRA ────────────────────────────────────────────────
export function runDijkstraSteps(
  graph: GraphData,
  sourceId: string,
  targetId?: string
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  if (vertices.length === 0) return steps

  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))
  const src = vertices.find((v) => v.id === sourceId) ?? vertices[0]

  const hasNegative = graph.weighted && graph.edges.some((e) => e.weight < 0)
  if (hasNegative) {
    steps.push({
      title: "Advertencia: Arista con peso negativo detectada",
      description:
        "El algoritmo de Dijkstra requiere que todos los pesos sean mayores o iguales a 0 para garantizar optimalidad. Para pesos negativos utiliza el algoritmo de Bellman.",
      summaryCards: [{ label: "Estado", value: "Pesos negativos presentes", accent: "warn" }],
    })
    return steps
  }

  const dist: Record<string, number> = {}
  const prev: Record<string, string | null> = {}
  const predEdge: Record<string, string | null> = {}
  const visited = new Set<string>()

  for (const v of vertices) {
    dist[v.id] = v.id === src.id ? 0 : INF
    prev[v.id] = null
    predEdge[v.id] = null
  }

  const historyRows: Array<{ iterLabel: string; cells: MatrixCell[] }> = []

  const snapshotTable = (iterLabel: string, justLockedId?: string, updatedIds?: Set<string>): MatrixDisplayData => {
    const rowCells: MatrixCell[] = vertices.map((v) => {
      const d = dist[v.id]
      const p = prev[v.id] ? labelOf.get(prev[v.id]!) ?? prev[v.id] : "-"
      const locked = visited.has(v.id)
      const val = !Number.isFinite(d) ? "∞" : `[${d}, ${p}]${locked ? " *" : ""}`
      let highlight: MatrixCell["highlight"] = undefined
      if (v.id === justLockedId) highlight = "pivot"
      else if (updatedIds?.has(v.id)) highlight = "updated"
      else if (!Number.isFinite(d)) highlight = "infinity"
      return { value: val, highlight }
    })
    historyRows.push({ iterLabel, cells: rowCells })
    return {
      id: "dijkstra-iter",
      title: "Tabla de Etiquetas [distancia, predecesor]",
      subtitle: "El asterisco (*) indica que la etiqueta del vértice ya es permanente (definitiva).",
      rowHeaders: historyRows.map((r) => r.iterLabel),
      colHeaders: vertices.map((v) => v.label),
      cells: historyRows.map((r) => r.cells.map((c) => ({ ...c }))),
    }
  }

  const buildVisuals = (currentId?: string, exploringEdgeId?: string) => {
    const vertexStates: Record<string, VertexVisualState> = {}
    const edgeStates: Record<string, EdgeVisualState> = {}
    for (const v of vertices) {
      const pLbl = prev[v.id] ? labelOf.get(prev[v.id]!) : "-"
      vertexStates[v.id] = {
        status:
          v.id === currentId
            ? "active"
            : visited.has(v.id)
            ? "visited"
            : v.id === src.id
            ? "source"
            : "default",
        badge: `d=${fmtDist(dist[v.id])}`,
        subBadge: prev[v.id] ? `←${pLbl}` : v.id === src.id ? "Origen" : undefined,
      }
    }
    for (const e of graph.edges) {
      if (e.id === exploringEdgeId) {
        edgeStates[e.id] = { status: "exploring", thick: true }
      } else if (Object.values(predEdge).includes(e.id)) {
        edgeStates[e.id] = { status: "accepted", thick: true }
      } else {
        edgeStates[e.id] = { status: "default" }
      }
    }
    return { vertexStates, edgeStates }
  }

  // Paso 0: Inicialización
  const initTable = snapshotTable("Inicio")
  const initVis = buildVisuals(src.id)
  steps.push({
    title: `Paso 0: Inicialización desde ${src.label}`,
    description: `Asignamos distancia 0 al vértice origen ${src.label} y distancia infinita (∞) a todos los demás vértices, ya que aún no conocemos ningún camino hacia ellos.`,
    formula: `d(${src.label}) = 0,   d(v) = ∞  ∀ v ≠ ${src.label}`,
    ...initVis,
    matrices: [initTable],
  })

  for (let stepIdx = 1; stepIdx <= vertices.length; stepIdx++) {
    // Elegir no visitado con distancia mínima
    let uId: string | null = null
    let minD = INF
    for (const v of vertices) {
      if (!visited.has(v.id) && dist[v.id] < minD) {
        minD = dist[v.id]
        uId = v.id
      }
    }

    if (!uId) break
    visited.add(uId)
    const uLbl = labelOf.get(uId) ?? uId

    const updatedSet = new Set<string>()
    const relaxNotes: string[] = []

    for (const { neighbor, weight, edgeId } of getOutgoingNeighbors(graph, uId)) {
      if (visited.has(neighbor)) continue
      const vLbl = labelOf.get(neighbor) ?? neighbor
      const candidate = dist[uId] + weight
      const oldD = dist[neighbor]

      if (candidate < oldD) {
        dist[neighbor] = candidate
        prev[neighbor] = uId
        predEdge[neighbor] = edgeId
        updatedSet.add(neighbor)
        relaxNotes.push(
          `Arista (${uLbl} → ${vLbl}, peso ${weight}): ${dist[uId]} + ${weight} = ${candidate} < ${fmtDist(oldD)} ⇒ Mejora: d(${vLbl}) = ${candidate}, pred = ${uLbl}.`
        )
      } else {
        relaxNotes.push(
          `Arista (${uLbl} → ${vLbl}, peso ${weight}): ${dist[uId]} + ${weight} = ${candidate} ≥ ${fmtDist(oldD)} ⇒ Se conserva d(${vLbl}) = ${fmtDist(oldD)}.`
        )
      }
    }

    const tbl = snapshotTable(`Iter ${stepIdx} (${uLbl}*)`, uId, updatedSet)
    const vis = buildVisuals(uId)

    steps.push({
      title: `Iteración ${stepIdx}: Fijar vértice ${uLbl} (d = ${dist[uId]})`,
      description:
        relaxNotes.length > 0
          ? `Seleccionamos ${uLbl} por tener la menor distancia temporal entre los no visitados y relajamos sus vecinos adyacentes.`
          : `Seleccionamos ${uLbl} con distancia definitiva ${dist[uId]}. No tiene vecinos no visitados por relajar.`,
      formula: "d(v) = mín { d(v),  d(u) + w(u, v) }",
      detailList: relaxNotes,
      ...vis,
      matrices: [tbl],
    })
  }

  // Paso final: Reconstruir ruta(s)
  const finalVis = buildVisuals()
  const chosenTarget = targetId && targetId !== "ALL" ? vertices.find((v) => v.id === targetId) : null

  if (chosenTarget) {
    const pathIds: string[] = []
    const pathEdges = new Set<string>()
    if (Number.isFinite(dist[chosenTarget.id])) {
      let curr: string | null = chosenTarget.id
      while (curr) {
        pathIds.unshift(curr)
        if (predEdge[curr]) pathEdges.add(predEdge[curr]!)
        curr = prev[curr]
      }
    }

    for (const v of vertices) {
      finalVis.vertexStates[v.id] = {
        ...finalVis.vertexStates[v.id],
        status:
          v.id === src.id
            ? "source"
            : v.id === chosenTarget.id
            ? "target"
            : pathIds.includes(v.id)
            ? "selected"
            : "default",
        dimmed: pathIds.length > 0 && !pathIds.includes(v.id),
      }
    }
    for (const e of graph.edges) {
      finalVis.edgeStates[e.id] = pathEdges.has(e.id)
        ? { status: "accepted", thick: true }
        : { status: "dimmed" }
    }

    const pathLabels = pathIds.map((id) => labelOf.get(id) ?? id).join(" → ")
    steps.push({
      title: `Resultado Final: Camino mínimo de ${src.label} a ${chosenTarget.label}`,
      description: Number.isFinite(dist[chosenTarget.id])
        ? `La ruta más corta desde ${src.label} hasta ${chosenTarget.label} recorre ${pathLabels} con un costo total acumulado de ${dist[chosenTarget.id]}.`
        : `No existe ningún camino alcanzable desde ${src.label} hasta ${chosenTarget.label}.`,
      formula: Number.isFinite(dist[chosenTarget.id])
        ? `Ruta: ${pathLabels}   |   Costo mínimo = ${dist[chosenTarget.id]}`
        : `d(${chosenTarget.label}) = ∞`,
      ...finalVis,
      matrices: [historyRows.length > 0 ? {
        id: "dijkstra-final",
        title: "Tabla Completa de Dijkstra",
        rowHeaders: historyRows.map((r) => r.iterLabel),
        colHeaders: vertices.map((v) => v.label),
        cells: historyRows.map((r) => r.cells),
      } : initTable],
      summaryCards: [
        { label: "Origen → Destino", value: `${src.label} → ${chosenTarget.label}`, accent: "info" },
        { label: "Costo Mínimo", value: fmtDist(dist[chosenTarget.id]), accent: Number.isFinite(dist[chosenTarget.id]) ? "ok" : "warn" },
        { label: " Secuencia", value: pathLabels || "Inalcanzable", accent: "ok" },
      ],
    })
  } else {
    const summaryList = vertices.map((v) => {
      if (!Number.isFinite(dist[v.id])) return `${src.label} → ${v.label}: Inalcanzable (∞)`
      const seq: string[] = []
      let curr: string | null = v.id
      while (curr) {
        seq.unshift(labelOf.get(curr) ?? curr)
        curr = prev[curr]
      }
      return `${src.label} → ${v.label}: costo ${dist[v.id]}  (${seq.join(" → ")})`
    })

    steps.push({
      title: `Árbol de Caminos Mínimos desde ${src.label}`,
      description: `Se han determinado las distancias mínimas definitivas desde ${src.label} hacia todos los vértices alcanzables del grafo.`,
      detailList: summaryList,
      ...finalVis,
      matrices: [
        {
          id: "dijkstra-final",
          title: "Tabla Completa de Iteraciones de Dijkstra",
          rowHeaders: historyRows.map((r) => r.iterLabel),
          colHeaders: vertices.map((v) => v.label),
          cells: historyRows.map((r) => r.cells),
        },
      ],
    })
  }

  return steps
}

// ── 2. ALGORITMO DE FLOYD-WARSHALL ──────────────────────────────────────────
export function runFloydSteps(
  graph: GraphData,
  queryFromId?: string,
  queryToId?: string
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const n = vertices.length
  if (n === 0) return steps

  const D: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (i === j ? 0 : INF))
  )
  const nextHop: Array<Array<number | null>> = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => null)
  )
  // Matriz de recorrido P (vértice intermedio / destino clásico en CC2)
  const P: string[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (i === j ? "-" : vertices[j].label))
  )

  const idxOf = new Map(vertices.map((v, i) => [v.id, i]))

  for (const e of graph.edges) {
    const u = idxOf.get(e.source)
    const v = idxOf.get(e.target)
    if (u === undefined || v === undefined) continue
    const w = graph.weighted ? e.weight : 1
    if (w < D[u][v]) {
      D[u][v] = w
      nextHop[u][v] = v
    }
    if (!graph.directed && w < D[v][u]) {
      D[v][u] = w
      nextHop[v][u] = u
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && !Number.isFinite(D[i][j])) {
        P[i][j] = "-"
      }
    }
  }

  const headers = vertices.map((v) => v.label)

  const buildMatrices = (
    kIdx: number | null,
    updatedPairs: Set<string>
  ): MatrixDisplayData[] => {
    const dCells: MatrixCell[][] = D.map((row, i) =>
      row.map((val, j) => {
        const key = `${i}-${j}`
        let highlight: MatrixCell["highlight"] = undefined
        if (updatedPairs.has(key)) highlight = "updated"
        else if (kIdx !== null && (i === kIdx || j === kIdx)) highlight = "pivot"
        else if (!Number.isFinite(val)) highlight = "infinity"
        return { value: fmtDist(val), highlight }
      })
    )

    const pCells: MatrixCell[][] = P.map((row, i) =>
      row.map((val, j) => {
        const key = `${i}-${j}`
        let highlight: MatrixCell["highlight"] = undefined
        if (updatedPairs.has(key)) highlight = "updated"
        else if (kIdx !== null && (i === kIdx || j === kIdx)) highlight = "pivot"
        return { value: val, highlight }
      })
    )

    const tag = kIdx === null ? "0" : String(kIdx + 1)
    return [
      {
        id: `floyd-d-${tag}`,
        title: `Matriz de Distancias D(${tag})`,
        subtitle:
          kIdx === null
            ? "Pesos directos iniciales (0 en la diagonal, ∞ donde no hay arista directa)."
            : `Pivote k = ${vertices[kIdx].label}: fila y columna resaltadas sirven de puente intermedio.`,
        rowHeaders: headers,
        colHeaders: headers,
        cells: dCells,
      },
      {
        id: `floyd-p-${tag}`,
        title: `Matriz de Recorridos P(${tag})`,
        subtitle: "Registra el vértice intermedio/siguiente por donde pasa el camino más corto.",
        rowHeaders: headers,
        colHeaders: headers,
        cells: pCells,
      },
    ]
  }

  steps.push({
    title: "Paso 0: Matrices Iniciales D(0) y P(0)",
    description:
      "Construimos la matriz de distancias directas D(0) a partir de las aristas del grafo y la matriz inicial de recorridos P(0).",
    formula: "D⁰[i][j] = w(i, j) si (i, j) ∈ E,  0 si i = j,  ∞ en otro caso",
    matrices: buildMatrices(null, new Set()),
  })

  for (let k = 0; k < n; k++) {
    const updatedPairs = new Set<string>()
    const updatesLog: string[] = []
    const kLbl = vertices[k].label

    for (let i = 0; i < n; i++) {
      if (i === k || !Number.isFinite(D[i][k])) continue
      for (let j = 0; j < n; j++) {
        if (j === k || i === j || !Number.isFinite(D[k][j])) continue
        const throughK = D[i][k] + D[k][j]
        if (throughK < D[i][j]) {
          const oldVal = fmtDist(D[i][j])
          D[i][j] = throughK
          nextHop[i][j] = nextHop[i][k]
          P[i][j] = kLbl
          updatedPairs.add(`${i}-${j}`)
          updatesLog.push(
            `Par (${vertices[i].label} → ${vertices[j].label}): D[${vertices[i].label}][${kLbl}] + D[${kLbl}][${vertices[j].label}] = ${D[i][k]} + ${D[k][j]} = ${throughK} < ${oldVal}  ⇒  Nuevo mínimo = ${throughK} pasando por ${kLbl}.`
          )
        }
      }
    }

    const vStates: Record<string, VertexVisualState> = {}
    vertices.forEach((v, idx) => {
      vStates[v.id] = {
        status: idx === k ? "active" : "default",
        badge: idx === k ? "Pivote k" : undefined,
      }
    })

    steps.push({
      title: `Iteración k = ${k + 1}: Vértice intermedio ${kLbl}`,
      description:
        updatesLog.length > 0
          ? `Usando ${kLbl} como escala intermedia mejoramos ${updatesLog.length} camino(s) en la matriz.`
          : `Al evaluar pasar por ${kLbl}, ningún par (i, j) obtiene una distancia menor que la actual.`,
      formula: `D(${k + 1})[i][j] = mín { D(${k})[i][j],  D(${k})[i][${kLbl}] + D(${k})[${kLbl}][j] }`,
      detailList: updatesLog.length > 0 ? updatesLog : [`Sin cambios al usar ${kLbl} como pivote.`],
      vertexStates: vStates,
      matrices: buildMatrices(k, updatedPairs),
    })
  }

  // Consulta opcional de ruta entre dos vértices
  const uIdx = queryFromId ? idxOf.get(queryFromId) : 0
  const vIdx = queryToId ? idxOf.get(queryToId) : n - 1
  if (uIdx !== undefined && vIdx !== undefined && uIdx !== vIdx) {
    const pathIndices: number[] = []
    const edgeSet = new Set<string>()
    if (nextHop[uIdx][vIdx] !== null) {
      let curr: number | null = uIdx
      const guard = new Set<number>()
      while (curr !== null && !guard.has(curr)) {
        guard.add(curr)
        pathIndices.push(curr)
        if (curr === vIdx) break
        curr = nextHop[curr][vIdx]
      }
      for (let p = 0; p < pathIndices.length - 1; p++) {
        const a = vertices[pathIndices[p]].id
        const b = vertices[pathIndices[p + 1]].id
        const matchEdge = graph.edges.find(
          (e) =>
            (e.source === a && e.target === b) ||
            (!graph.directed && e.source === b && e.target === a)
        )
        if (matchEdge) edgeSet.add(matchEdge.id)
      }
    }

    const vStates: Record<string, VertexVisualState> = {}
    vertices.forEach((v, i) => {
      vStates[v.id] = {
        status:
          i === uIdx
            ? "source"
            : i === vIdx
            ? "target"
            : pathIndices.includes(i)
            ? "selected"
            : "default",
        badge: i === uIdx ? "Origen" : i === vIdx ? `Costo=${fmtDist(D[uIdx][vIdx])}` : undefined,
      }
    })
    const eStates: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      eStates[e.id] = edgeSet.has(e.id)
        ? { status: "accepted", thick: true }
        : { status: "dimmed" }
    })

    const seq = pathIndices.map((i) => vertices[i].label).join(" → ")
    steps.push({
      title: `Consulta de Ruta Mínima: ${vertices[uIdx].label} → ${vertices[vIdx].label}`,
      description:
        pathIndices.length > 1
          ? `Según las matrices finales D(${n}) y P(${n}), el camino óptimo de ${vertices[uIdx].label} a ${vertices[vIdx].label} es ${seq} con distancia ${D[uIdx][vIdx]}.`
          : `No existe ruta dirigida desde ${vertices[uIdx].label} hasta ${vertices[vIdx].label}.`,
      formula:
        pathIndices.length > 1
          ? `Ruta(${vertices[uIdx].label}, ${vertices[vIdx].label}): ${seq}   |   Distancia = ${D[uIdx][vIdx]}`
          : `D[${vertices[uIdx].label}][${vertices[vIdx].label}] = ∞`,
      vertexStates: vStates,
      edgeStates: eStates,
      matrices: buildMatrices(null, new Set()),
      summaryCards: [
        { label: "Par Consultado", value: `${vertices[uIdx].label} → ${vertices[vIdx].label}`, accent: "info" },
        { label: "Distancia Mínima", value: fmtDist(D[uIdx][vIdx]), accent: Number.isFinite(D[uIdx][vIdx]) ? "ok" : "warn" },
        { label: "Recorrido", value: seq || "Inalcanzable", accent: "ok" },
      ],
    })
  }

  return steps
}

// ── 3. ALGORITMO DE BELLMAN CON FUNCIÓN ORDINAL ─────────────────────────────
export function runBellmanOrdinalSteps(
  graph: GraphData,
  sourceId?: string,
  arrangeByLevels = true
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const n = vertices.length
  if (n === 0) return steps

  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))

  // Si el grafo es dirigido, calculamos la Función Ordinal por niveles N0, N1, ...
  if (graph.directed) {
    const inDeg: Record<string, number> = {}
    vertices.forEach((v) => (inDeg[v.id] = 0))
    graph.edges.forEach((e) => {
      if (inDeg[e.target] !== undefined) inDeg[e.target]++
    })

    const remaining = new Set(vertices.map((v) => v.id))
    const levels: string[][] = []
    const levelOf: Record<string, number> = {}
    const degSnapshots: Array<{ stage: string; degs: Record<string, string> }> = []

    while (remaining.size > 0) {
      const zeroNodes = Array.from(remaining).filter((id) => inDeg[id] === 0)
      const snap: Record<string, string> = {}
      vertices.forEach((v) => {
        snap[v.id] = remaining.has(v.id) ? String(inDeg[v.id]) : "-"
      })

      if (zeroNodes.length === 0) {
        // Hay un ciclo dirigido -> pasamos al modo Bellman-Ford iterativo con explicación clara
        break
      }

      const lvlIdx = levels.length
      degSnapshots.push({ stage: `Nivel N${lvlIdx}`, degs: snap })
      levels.push(zeroNodes)
      zeroNodes.forEach((id) => {
        levelOf[id] = lvlIdx
        remaining.delete(id)
      })
      for (const u of zeroNodes) {
        for (const e of graph.edges) {
          if (e.source === u && remaining.has(e.target)) {
            inDeg[e.target]--
          }
        }
      }
    }

    // Si es un DAG válido (todos los vértices fueron clasificados por la función ordinal)
    if (remaining.size === 0) {
      const ordinalOrder: string[] = levels.flat()
      const ordinalNum: Record<string, number> = {}
      ordinalOrder.forEach((id, idx) => {
        ordinalNum[id] = idx + 1
      })

      // Opcionalmente generamos un grafo ordenado visualmente por niveles de izquierda a derecha
      const workingGraph = cloneGraph(graph)
      if (arrangeByLevels && levels.length > 1) {
        const marginX = 95
        const usableW = 450
        levels.forEach((lvl, lIdx) => {
          const x =
            levels.length === 1
              ? 320
              : marginX + (lIdx * usableW) / (levels.length - 1)
          lvl.forEach((id, posIdx) => {
            const vObj = workingGraph.vertices.find((v) => v.id === id)
            if (vObj) {
              vObj.x = Math.round(x)
              vObj.y = Math.round(((posIdx + 1) * 400) / (lvl.length + 1))
            }
          })
        })
      }

      const ordinalMatrix: MatrixDisplayData = {
        id: "bellman-ordinal-table",
        title: "Cálculo de Niveles y Función Ordinal (Grados de Entrada d⁻)",
        subtitle: "En cada etapa, los vértices con grado de entrada d⁻(v) = 0 forman el nivel Nk y se suprimen sus arcos salientes.",
        rowHeaders: degSnapshots.map((s) => s.stage),
        colHeaders: vertices.map((v) => v.label),
        cells: degSnapshots.map((s, rIdx) =>
          vertices.map((v) => ({
            value: s.degs[v.id],
            highlight: levels[rIdx]?.includes(v.id) ? "updated" : undefined,
          }))
        ),
      }

      // Paso 1: Mostrar Función Ordinal completa
      const ordStates: Record<string, VertexVisualState> = {}
      vertices.forEach((v) => {
        ordStates[v.id] = {
          status: "visited",
          badge: `N${levelOf[v.id]}`,
          subBadge: `ord=${ordinalNum[v.id]}`,
          colorIndex: (levelOf[v.id] % 6) + 1,
        }
      })

      steps.push({
        title: "Fase 1: Función Ordinal y Niveles del Grafo Acíclico",
        description:
          "Identificamos sucesivamente los vértices sin predecesores (d⁻ = 0) para particionar el grafo en niveles N₀, N₁, … y numerar los vértices con la función ordinal f(v).",
        formula: "N₀ = { v ∈ V | d⁻(v) = 0 },   Nₖ = { v ∈ V \\ ∪Nᵢ | d⁻(v) = 0 }",
        overrideGraph: workingGraph,
        vertexStates: ordStates,
        matrices: [ordinalMatrix],
        badgeGroups: levels.map((lvl, idx) => ({
          title: `Nivel N${idx}`,
          items: lvl.map((id) => `${labelOf.get(id)} (ord ${ordinalNum[id]})`),
          tone: "primary",
        })),
      })

      // Fase 2: Ecuación de optimalidad de Bellman siguiendo el orden ordinal
      const srcId =
        sourceId && vertices.some((v) => v.id === sourceId)
          ? sourceId
          : ordinalOrder[0]
      const lambda: Record<string, number> = {}
      const pred: Record<string, string | null> = {}
      const predEdge: Record<string, string | null> = {}

      vertices.forEach((v) => {
        lambda[v.id] = v.id === srcId ? 0 : INF
        pred[v.id] = null
        predEdge[v.id] = null
      })

      for (let idx = 0; idx < ordinalOrder.length; idx++) {
        const vId = ordinalOrder[idx]
        const vLbl = labelOf.get(vId) ?? vId
        const incoming = getIncomingNeighbors(workingGraph, vId)
        const details: string[] = []

        if (vId === srcId) {
          details.push(`Vértice origen ${vLbl}: λ(${vLbl}) = 0 por definición.`)
        } else if (incoming.length === 0) {
          details.push(
            `El vértice ${vLbl} tiene grado de entrada 0 y no es el origen seleccionado (${labelOf.get(srcId)}), por lo que λ(${vLbl}) = ∞.`
          )
        } else {
          const terms: string[] = []
          for (const inc of incoming) {
            const uLbl = labelOf.get(inc.from) ?? inc.from
            const val = lambda[inc.from] + inc.weight
            terms.push(
              `λ(${uLbl}) + w(${uLbl},${vLbl}) = ${fmtDist(lambda[inc.from])} + ${inc.weight} = ${fmtDist(val)}`
            )
            if (val < lambda[vId]) {
              lambda[vId] = val
              pred[vId] = inc.from
              predEdge[vId] = inc.edgeId
            }
          }
          details.push(...terms)
          details.push(
            `⇒ Mínimo para ${vLbl}: λ(${vLbl}) = ${fmtDist(lambda[vId])}${
              pred[vId] ? ` (vía ${labelOf.get(pred[vId]!)})` : ""
            }`
          )
        }

        const vStates: Record<string, VertexVisualState> = {}
        const eStates: Record<string, EdgeVisualState> = {}
        ordinalOrder.forEach((id, pos) => {
          vStates[id] = {
            status:
              id === vId
                ? "active"
                : pos < idx
                ? "visited"
                : "default",
            badge: pos <= idx ? `λ=${fmtDist(lambda[id])}` : `N${levelOf[id]}`,
            subBadge: `ord ${ordinalNum[id]}${pred[id] ? ` ←${labelOf.get(pred[id]!)}` : ""}`,
          }
        })
        workingGraph.edges.forEach((e) => {
          if (e.target === vId) {
            eStates[e.id] =
              predEdge[vId] === e.id
                ? { status: "accepted", thick: true }
                : { status: "exploring" }
          } else if (Object.values(predEdge).includes(e.id)) {
            eStates[e.id] = { status: "accepted", thick: true }
          } else {
            eStates[e.id] = { status: "default" }
          }
        })

        steps.push({
          title: `Evaluación Ordinal #${idx + 1}: Vértice ${vLbl} (Nivel N${levelOf[vId]})`,
          description: `Calculamos λ(${vLbl}) revisando únicamente sus predecesores directos Γ⁻(${vLbl}), los cuales ya tienen su valor óptimo definitivo gracias al orden ordinal.`,
          formula: `λ(${vLbl}) = mín_{u ∈ Γ⁻(${vLbl})} { λ(u) + w(u, ${vLbl}) } = ${fmtDist(lambda[vId])}`,
          detailList: details,
          overrideGraph: workingGraph,
          vertexStates: vStates,
          edgeStates: eStates,
          matrices: [
            {
              id: `bellman-lambda-${idx}`,
              title: "Valores Óptimos λ(v) en Orden Ordinal",
              rowHeaders: ["Nivel", "λ(v)", "Predecesor"],
              colHeaders: ordinalOrder.map((id) => `${labelOf.get(id)} (${ordinalNum[id]})`),
              cells: [
                ordinalOrder.map((id) => ({ value: `N${levelOf[id]}` })),
                ordinalOrder.map((id, p) => ({
                  value: p <= idx ? fmtDist(lambda[id]) : "…",
                  highlight: id === vId ? "updated" : undefined,
                })),
                ordinalOrder.map((id, p) => ({
                  value: p <= idx ? (pred[id] ? labelOf.get(pred[id]!)! : "-") : "…",
                })),
              ],
            },
          ],
        })
      }

      return steps
    }
  }

  // Fallback pedagógico: Bellman-Ford general (si es no dirigido o contiene ciclos)
  const src = vertices.find((v) => v.id === sourceId) ?? vertices[0]
  const dist: Record<string, number> = {}
  const prev: Record<string, string | null> = {}
  const predEdge: Record<string, string | null> = {}
  vertices.forEach((v) => {
    dist[v.id] = v.id === src.id ? 0 : INF
    prev[v.id] = null
    predEdge[v.id] = null
  })

  steps.push({
    title: "Nota sobre Función Ordinal: Presencia de Ciclos / Aristas Bidireccionales",
    description: graph.directed
      ? `El grafo contiene al menos un circuito dirigido, por lo que no todos los vértices alcanzan grado de entrada d⁻ = 0. Ejecutamos entonces la formulación iterativa de Bellman-Ford desde ${src.label} en hasta |V| - 1 = ${n - 1} pasadas.`
      : `El grafo es no dirigido (cada arista equivale a un par simétrico). Para ver la partición por niveles N₀, N₁, … activa "Dirigido" o carga el ejemplo de Función Ordinal. Ejecutamos Bellman-Ford desde ${src.label}.`,
    formula: `λ⁰(${src.label}) = 0,   λᵏ(v) = mín { λᵏ⁻¹(v),  mín_{(u,v)∈E} (λᵏ⁻¹(u) + w(u,v)) }`,
  })

  for (let pass = 1; pass <= n - 1; pass++) {
    let anyChange = false
    const logs: string[] = []
    for (const e of graph.edges) {
      const w = graph.weighted ? e.weight : 1
      const pairs = graph.directed
        ? [[e.source, e.target]]
        : [
            [e.source, e.target],
            [e.target, e.source],
          ]
      for (const [u, v] of pairs) {
        if (Number.isFinite(dist[u]) && dist[u] + w < dist[v]) {
          const old = fmtDist(dist[v])
          dist[v] = dist[u] + w
          prev[v] = u
          predEdge[v] = e.id
          anyChange = true
          logs.push(
            `(${labelOf.get(u)} → ${labelOf.get(v)}): ${dist[u]} + ${w} = ${dist[v]} < ${old} ⇒ λ(${labelOf.get(v)}) = ${dist[v]}`
          )
        }
      }
    }

    const vStates: Record<string, VertexVisualState> = {}
    vertices.forEach((v) => {
      vStates[v.id] = {
        status: v.id === src.id ? "source" : Number.isFinite(dist[v.id]) ? "visited" : "default",
        badge: `λ=${fmtDist(dist[v.id])}`,
        subBadge: prev[v.id] ? `←${labelOf.get(prev[v.id]!)}` : undefined,
      }
    })
    const eStates: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      eStates[e.id] = Object.values(predEdge).includes(e.id)
        ? { status: "accepted", thick: true }
        : { status: "default" }
    })

    steps.push({
      title: `Iteración ${pass} de ${n - 1} (Relajación de Bellman-Ford)`,
      description: anyChange
        ? `Se actualizaron distancias tras relajar todas las aristas en la pasada ${pass}.`
        : `No hubo mejoras en la pasada ${pass}; las etiquetas λ(v) ya convergieron al óptimo.`,
      detailList: logs.length > 0 ? logs : ["Ninguna arista redujo distancias en esta pasada."],
      vertexStates: vStates,
      edgeStates: eStates,
    })

    if (!anyChange) break
  }

  return steps
}
