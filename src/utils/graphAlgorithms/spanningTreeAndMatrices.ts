import {
  AdjacencyListEntry,
  EdgeVisualState,
  GraphAlgorithmStep,
  GraphData,
  MatrixCell,
  MatrixDisplayData,
  VertexVisualState,
} from "../../types/graphTypes"

// ── 1. ÁRBOL DE EXPANSIÓN: PRIM (MENOR O MAYOR PESO) ────────────────────────
export function runPrimSteps(
  graph: GraphData,
  startId?: string,
  mode: "min" | "max" = "min"
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const n = vertices.length
  if (n === 0) return steps

  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))
  const start = vertices.find((v) => v.id === startId) ?? vertices[0]
  const isMin = mode === "min"
  const modeTitle = isMin ? "Menor Peso (Mínimo)" : "Mayor Peso (Máximo)"

  const inTree = new Set<string>([start.id])
  const chosenEdges = new Set<string>()
  const rejectedEdges = new Set<string>()
  let totalWeight = 0

  steps.push({
    title: `Paso 0: Inicio de Prim (${modeTitle}) en vértice ${start.label}`,
    description: `Inicializamos el conjunto de vértices conectados U = {${start.label}} con peso acumulado W = 0. En cada paso buscaremos la arista frontera (u ∈ U, v ∉ U) de ${
      isMin ? "menor" : "mayor"
    } peso.`,
    formula: `U = { ${start.label} },   T = ∅,   Peso Total = 0`,
    vertexStates: {
      [start.id]: { status: "source", badge: "Raíz (U)" },
    },
    badgeGroups: [
      { title: "En el árbol (U)", items: [start.label], tone: "green" },
      {
        title: "Pendientes (V \\ U)",
        items: vertices.filter((v) => v.id !== start.id).map((v) => v.label),
        tone: "amber",
      },
    ],
  })

  while (inTree.size < n) {
    // Aristas en el corte (exactamente un extremo en inTree)
    const cutEdges = graph.edges.filter((e) => {
      const a = inTree.has(e.source)
      const b = inTree.has(e.target)
      return a !== b
    })

    // Marcar aristas cuyos ambos extremos ya están en U como descartadas por ciclo
    graph.edges.forEach((e) => {
      if (!chosenEdges.has(e.id) && inTree.has(e.source) && inTree.has(e.target)) {
        rejectedEdges.add(e.id)
      }
    })

    if (cutEdges.length === 0) {
      steps.push({
        title: "Grafo No Conexo: Corte vacío",
        description: `No existen aristas que conecten U = {${Array.from(inTree)
          .map((id) => labelOf.get(id))
          .join(", ")}} con los vértices restantes. Un árbol de expansión completo requiere que el grafo sea conexo.`,
        summaryCards: [
          { label: "Estado", value: "Grafo desconectado", accent: "warn" },
          { label: "Aristas elegidas", value: `${chosenEdges.size} de ${n - 1}`, accent: "warn" },
        ],
      })
      break
    }

    const sortedCut = [...cutEdges].sort((a, b) => {
      const wa = graph.weighted ? a.weight : 1
      const wb = graph.weighted ? b.weight : 1
      return isMin ? wa - wb : wb - wa
    })

    const best = sortedCut[0]
    const wBest = graph.weighted ? best.weight : 1
    const uIn = inTree.has(best.source) ? best.source : best.target
    const vOut = inTree.has(best.source) ? best.target : best.source

    // Paso A: Mostrar frontera candidata antes de elegir
    const vStatesExplore: Record<string, VertexVisualState> = {}
    vertices.forEach((v) => {
      vStatesExplore[v.id] = {
        status: inTree.has(v.id) ? "visited" : "default",
        badge: inTree.has(v.id) ? "En U" : undefined,
      }
    })
    const eStatesExplore: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      if (chosenEdges.has(e.id)) eStatesExplore[e.id] = { status: "accepted", thick: true }
      else if (cutEdges.some((ce) => ce.id === e.id)) eStatesExplore[e.id] = { status: "exploring", thick: true }
      else if (rejectedEdges.has(e.id)) eStatesExplore[e.id] = { status: "rejected", dashed: true }
      else eStatesExplore[e.id] = { status: "default" }
    })

    const candidateDesc = sortedCut.map((ce) => {
      const cw = graph.weighted ? ce.weight : 1
      return `(${labelOf.get(ce.source)}—${labelOf.get(ce.target)}, peso = ${cw})`
    })

    // Aceptar la mejor arista
    chosenEdges.add(best.id)
    inTree.add(vOut)
    totalWeight += wBest

    const vStatesAccept: Record<string, VertexVisualState> = {}
    vertices.forEach((v) => {
      vStatesAccept[v.id] = {
        status: v.id === vOut ? "selected" : inTree.has(v.id) ? "visited" : "default",
        badge: v.id === vOut ? `+${wBest}` : inTree.has(v.id) ? "En U" : undefined,
      }
    })
    const eStatesAccept: Record<string, EdgeVisualState> = { ...eStatesExplore }
    eStatesAccept[best.id] = { status: "accepted", thick: true }

    steps.push({
      title: `Paso ${chosenEdges.size}: Conectar ${labelOf.get(vOut)} mediante (${labelOf.get(uIn)} — ${labelOf.get(vOut)}) [peso ${wBest}]`,
      description: `Entre las ${cutEdges.length} arista(s) frontera entre U y V\\U, seleccionamos (${labelOf.get(uIn)} — ${labelOf.get(vOut)}) por tener el ${
        isMin ? "menor" : "mayor"
      } peso (${wBest}). Incorporamos ${labelOf.get(vOut)} al conjunto U.`,
      formula: `${isMin ? "mín" : "máx"} Frontera(U, V\\U) = w(${labelOf.get(uIn)}, ${labelOf.get(vOut)}) = ${wBest}   ⇒   Peso acumulado = ${totalWeight}`,
      detailList: [`Candidatas evaluadas en el corte: ${candidateDesc.join("  |  ")}`],
      vertexStates: vStatesAccept,
      edgeStates: eStatesAccept,
      badgeGroups: [
        {
          title: `Conectados U (${inTree.size}/${n})`,
          items: Array.from(inTree).map((id) => labelOf.get(id)!),
          tone: "green",
        },
        {
          title: "Pendientes V \\ U",
          items: vertices.filter((v) => !inTree.has(v.id)).map((v) => v.label),
          tone: "amber",
        },
      ],
      summaryCards: [
        { label: "Aristas en Árbol", value: `${chosenEdges.size} / ${n - 1}`, accent: "info" },
        { label: `Peso ${isMin ? "Mínimo" : "Máximo"}`, value: String(totalWeight), accent: "ok" },
      ],
    })
  }

  if (inTree.size === n) {
    const finalV: Record<string, VertexVisualState> = {}
    vertices.forEach((v) => (finalV[v.id] = { status: "selected", badge: "Conectado" }))
    const finalE: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      finalE[e.id] = chosenEdges.has(e.id)
        ? { status: "accepted", thick: true }
        : { status: "dimmed", dashed: true }
    })

    steps.push({
      title: `Árbol de Expansión de ${modeTitle} Completado (Prim)`,
      description: `Se han unido los ${n} vértices con exactamente |V| - 1 = ${n - 1} aristas sin ciclos y con peso total óptimo W(T) = ${totalWeight}.`,
      formula: `|E(T)| = |V| - 1 = ${n - 1},   ∑ w(e) = ${totalWeight}`,
      vertexStates: finalV,
      edgeStates: finalE,
      summaryCards: [
        { label: "Algoritmo", value: `Prim (${isMin ? "Mínimo" : "Máximo"})`, accent: "info" },
        { label: "Aristas T", value: `${chosenEdges.size}`, accent: "ok" },
        { label: "Peso Total W(T)", value: String(totalWeight), accent: "ok" },
      ],
    })
  }

  return steps
}

// ── 2. ÁRBOL DE EXPANSIÓN: KRUSKAL (MENOR O MAYOR PESO) ─────────────────────
export function runKruskalSteps(
  graph: GraphData,
  mode: "min" | "max" = "min"
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const n = vertices.length
  if (n === 0) return steps

  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))
  const isMin = mode === "min"
  const modeTitle = isMin ? "Menor Peso (Mínimo)" : "Mayor Peso (Máximo)"

  // Ordenar todas las aristas
  const sortedEdges = [...graph.edges].sort((a, b) => {
    const wa = graph.weighted ? a.weight : 1
    const wb = graph.weighted ? b.weight : 1
    return isMin ? wa - wb : wb - wa
  })

  // Disjoint Set (Union-Find)
  const parent: Record<string, string> = {}
  vertices.forEach((v) => (parent[v.id] = v.id))
  const find = (x: string): string => {
    while (parent[x] !== x) x = parent[x]
    return x
  }

  const getComponents = (): string[][] => {
    const groups = new Map<string, string[]>()
    vertices.forEach((v) => {
      const root = find(v.id)
      if (!groups.has(root)) groups.set(root, [])
      groups.get(root)!.push(v.label)
    })
    return Array.from(groups.values())
  }

  const edgeDecision: Record<string, "pending" | "accepted" | "rejected"> = {}
  sortedEdges.forEach((e) => (edgeDecision[e.id] = "pending"))

  const buildEdgesTable = (activeEdgeId?: string): MatrixDisplayData => ({
    id: "kruskal-edges",
    title: `Aristas Ordenadas de ${isMin ? "Menor a Mayor" : "Mayor a Menor"} Peso`,
    rowHeaders: sortedEdges.map((e, i) => `#${i + 1} (${e.label ?? e.id})`),
    colHeaders: ["Extremos", "Peso", "Decisión"],
    cells: sortedEdges.map((e) => {
      const dec = edgeDecision[e.id]
      const w = graph.weighted ? e.weight : 1
      const hl: MatrixCell["highlight"] =
        e.id === activeEdgeId
          ? "pivot"
          : dec === "accepted"
          ? "updated"
          : dec === "rejected"
          ? "negative"
          : undefined
      return [
        { value: `${labelOf.get(e.source)} — ${labelOf.get(e.target)}`, highlight: hl },
        { value: w, highlight: hl },
        {
          value:
            dec === "accepted"
              ? "✓ Aceptada"
              : dec === "rejected"
              ? "✗ Ciclo (Rechazada)"
              : "Pendiente",
          highlight: hl,
        },
      ]
    }),
  })

  steps.push({
    title: `Paso 0: Ordenamiento de Aristas y Componentes Iniciales (${modeTitle})`,
    description: `Ordenamos las ${sortedEdges.length} aristas por peso ${
      isMin ? "ascendente" : "descendente"
    }. Inicialmente cada uno de los ${n} vértices constituye su propia componente conexa independiente.`,
    formula: `Componentes iniciales = ${vertices.map((v) => `{${v.label}}`).join(", ")}`,
    matrices: [buildEdgesTable()],
    badgeGroups: getComponents().map((comp, idx) => ({
      title: `Comp ${idx + 1}`,
      items: comp,
      tone: "primary",
    })),
  })

  let acceptedCount = 0
  let totalWeight = 0

  for (let i = 0; i < sortedEdges.length; i++) {
    if (acceptedCount === n - 1) break
    const e = sortedEdges[i]
    const w = graph.weighted ? e.weight : 1
    const uLbl = labelOf.get(e.source) ?? e.source
    const vLbl = labelOf.get(e.target) ?? e.target

    const rootU = find(e.source)
    const rootV = find(e.target)
    const formsCycle = rootU === rootV

    if (!formsCycle) {
      parent[rootV] = rootU
      edgeDecision[e.id] = "accepted"
      acceptedCount++
      totalWeight += w
    } else {
      edgeDecision[e.id] = "rejected"
    }

    const comps = getComponents()
    const vStates: Record<string, VertexVisualState> = {}
    // Colorear por componente conexa actual
    const rootToColor = new Map<string, number>()
    let cIdx = 1
    vertices.forEach((v) => {
      const r = find(v.id)
      if (!rootToColor.has(r)) rootToColor.set(r, cIdx++)
      vStates[v.id] = {
        status: v.id === e.source || v.id === e.target ? "active" : "visited",
        colorIndex: rootToColor.get(r),
        badge: `C${rootToColor.get(r)}`,
      }
    })

    const eStates: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((ge) => {
      if (edgeDecision[ge.id] === "accepted") {
        eStates[ge.id] = { status: "accepted", thick: true }
      } else if (ge.id === e.id && formsCycle) {
        eStates[ge.id] = { status: "rejected", dashed: true, thick: true }
      } else if (edgeDecision[ge.id] === "rejected") {
        eStates[ge.id] = { status: "rejected", dashed: true }
      } else {
        eStates[ge.id] = { status: "default" }
      }
    })

    steps.push({
      title: `Evaluación #${i + 1}: Arista (${uLbl} — ${vLbl}) de peso ${w} → ${
        formsCycle ? "RECHAZADA (Ciclo)" : "ACEPTADA"
      }`,
      description: formsCycle
        ? `Los vértices ${uLbl} y ${vLbl} ya pertenecen a la misma componente conexa. Agregar esta arista cerraría un ciclo, por lo que Kruskal la descarta.`
        : `${uLbl} y ${vLbl} están en componentes distintas. Aceptamos la arista y fusionamos ambas componentes. Peso acumulado: ${totalWeight}.`,
      formula: formsCycle
        ? `find(${uLbl}) = find(${vLbl})  ⇒  Forma ciclo (se descarta)`
        : `find(${uLbl}) ≠ find(${vLbl})  ⇒  Unir componentes  |  Peso = ${totalWeight}`,
      vertexStates: vStates,
      edgeStates: eStates,
      matrices: [buildEdgesTable(e.id)],
      badgeGroups: comps.map((comp, idx) => ({
        title: `Componente C${idx + 1}`,
        items: comp,
        tone: "green",
      })),
      summaryCards: [
        { label: "Aristas Aceptadas", value: `${acceptedCount} / ${n - 1}`, accent: "info" },
        { label: "Peso Acumulado", value: String(totalWeight), accent: "ok" },
      ],
    })
  }

  const finalE: Record<string, EdgeVisualState> = {}
  graph.edges.forEach((e) => {
    finalE[e.id] =
      edgeDecision[e.id] === "accepted"
        ? { status: "accepted", thick: true }
        : { status: "dimmed", dashed: true }
  })

  steps.push({
    title:
      acceptedCount === n - 1
        ? `Árbol de Expansión de ${modeTitle} Completado (Kruskal)`
        : `Bosque de Expansión Completado (Grafo con ${getComponents().length} componentes)`,
    description:
      acceptedCount === n - 1
        ? `Kruskal seleccionó ${acceptedCount} aristas uniendo todos los vértices en una única componente sin ciclos, con peso total óptimo W(T) = ${totalWeight}.`
        : `Se revisaron todas las aristas obteniendo un bosque generador de peso ${totalWeight} (el grafo original no era conexo).`,
    formula: `Aristas elegidas = ${acceptedCount},   Peso Total W(T) = ${totalWeight}`,
    edgeStates: finalE,
    matrices: [buildEdgesTable()],
    summaryCards: [
      { label: "Algoritmo", value: `Kruskal (${isMin ? "Mínimo" : "Máximo"})`, accent: "info" },
      { label: "Aristas en T", value: `${acceptedCount}`, accent: acceptedCount === n - 1 ? "ok" : "warn" },
      { label: "Peso Total W(T)", value: String(totalWeight), accent: "ok" },
    ],
  })

  return steps
}

// ── 3. REPRESENTACIÓN MATRICIAL Y EN LISTA (ADYACENCIA E INCIDENCIA) ────────
export interface FullGraphRepresentations {
  adjacencyMatrix: MatrixDisplayData
  incidenceMatrix: MatrixDisplayData
  adjacencyList: AdjacencyListEntry[]
  incidenceList: AdjacencyListEntry[]
}

export function buildGraphRepresentations(
  graph: GraphData,
  showWeightsInAdj = false
): FullGraphRepresentations {
  const vertices = graph.vertices
  const edges = graph.edges
  const n = vertices.length
  const m = edges.length
  const idxOf = new Map(vertices.map((v, i) => [v.id, i]))
  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))

  // 1. Matriz de Adyacencia
  const adjRaw: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const outDeg = Array(n).fill(0)
  const inDeg = Array(n).fill(0)

  edges.forEach((e) => {
    const u = idxOf.get(e.source)
    const v = idxOf.get(e.target)
    if (u === undefined || v === undefined) return
    const val = showWeightsInAdj && graph.weighted ? e.weight : 1
    adjRaw[u][v] = val
    outDeg[u]++
    inDeg[v]++
    if (!graph.directed && u !== v) {
      adjRaw[v][u] = val
      outDeg[v]++
      inDeg[u]++
    }
  })

  const adjColHeaders = [
    ...vertices.map((v) => v.label),
    graph.directed ? "d⁺(v)" : "Grado d(v)",
  ]
  const adjCells: MatrixCell[][] = adjRaw.map((row, i) => [
    ...row.map((val) => ({
      value: val,
      highlight: (val !== 0 ? "positive" : "zero") as MatrixCell["highlight"],
      tooltip: `A[${vertices[i].label}]`,
    })),
    {
      value: outDeg[i],
      highlight: "pivot" as MatrixCell["highlight"],
    },
  ])

  if (graph.directed && n > 0) {
    // Fila adicional para grados de entrada d-(v)
    adjCells.push([
      ...inDeg.map((d) => ({ value: d, highlight: "pivot" as MatrixCell["highlight"] })),
      { value: `${edges.length} arcos`, highlight: "pivot" as MatrixCell["highlight"] },
    ])
  }

  const adjacencyMatrix: MatrixDisplayData = {
    id: "repr-adj-matrix",
    title: `Matriz de Adyacencia A (${n} × ${n})`,
    subtitle: graph.directed
      ? "A[i][j] indica arco dirigido desde la fila i hacia la columna j. La última columna suma d⁺ y la última fila suma d⁻."
      : "Matriz simétrica (A[i][j] = A[j][i]): vale 1 (o peso) cuando existe arista entre el vértice i y el vértice j.",
    rowHeaders: graph.directed && n > 0
      ? [...vertices.map((v) => v.label), "d⁻(v)"]
      : vertices.map((v) => v.label),
    colHeaders: adjColHeaders,
    cells: adjCells,
  }

  // 2. Matriz de Incidencia (n vértices x m aristas)
  const edgeNames = edges.map((e, idx) => e.label ?? `e${idx + 1}`)
  const incCells: MatrixCell[][] = vertices.map((v) =>
    edges.map((e) => {
      let val = 0
      if (graph.directed) {
        if (e.source === v.id && e.target === v.id) val = 2
        else if (e.source === v.id) val = 1 // Sale (+1)
        else if (e.target === v.id) val = -1 // Entra (-1)
      } else {
        if (e.source === v.id && e.target === v.id) val = 2
        else if (e.source === v.id || e.target === v.id) val = 1
      }
      return {
        value: val > 0 && graph.directed && val === 1 ? "+1" : val,
        highlight:
          val > 0
            ? "positive"
            : val < 0
            ? "negative"
            : ("zero" as MatrixCell["highlight"]),
        tooltip: `${v.label} respecto a ${e.label ?? e.id} (${labelOf.get(e.source)}→${labelOf.get(e.target)})`,
      }
    })
  )

  const incidenceMatrix: MatrixDisplayData = {
    id: "repr-inc-matrix",
    title: `Matriz de Incidencia M (${n} × ${m})`,
    subtitle: graph.directed
      ? "Filas = vértices, Columnas = aristas: +1 si el arco sale del vértice, -1 si entra al vértice, 0 si no incide."
      : "Filas = vértices, Columnas = aristas: 1 si el vértice es extremo de la arista (cada columna suma 2), 0 en otro caso.",
    rowHeaders: vertices.map((v) => v.label),
    colHeaders:
      m > 0
        ? edges.map(
            (e, idx) =>
              `${edgeNames[idx]} (${labelOf.get(e.source)}${graph.directed ? "→" : "-"}${labelOf.get(e.target)})`
          )
        : ["Sin aristas"],
    cells: m > 0 ? incCells : vertices.map(() => [{ value: "-" }]),
  }

  // 3. Lista de Adyacencia
  const adjacencyList: AdjacencyListEntry[] = vertices.map((v, i) => {
    const neighbors: AdjacencyListEntry["neighbors"] = []
    edges.forEach((e, eIdx) => {
      const eName = edgeNames[eIdx]
      if (e.source === v.id) {
        neighbors.push({
          targetId: e.target,
          targetLabel: labelOf.get(e.target) ?? e.target,
          edgeLabel: eName,
          weight: graph.weighted ? e.weight : undefined,
          edgeId: e.id,
        })
      } else if (!graph.directed && e.target === v.id) {
        neighbors.push({
          targetId: e.source,
          targetLabel: labelOf.get(e.source) ?? e.source,
          edgeLabel: eName,
          weight: graph.weighted ? e.weight : undefined,
          edgeId: e.id,
        })
      }
    })
    return {
      vertexId: v.id,
      vertexLabel: v.label,
      degreeInfo: graph.directed ? `d⁺=${outDeg[i]}, d⁻=${inDeg[i]}` : `d=${outDeg[i]}`,
      neighbors,
    }
  })

  // 4. Lista de Incidencia
  const incidenceList: AdjacencyListEntry[] = vertices.map((v) => {
    const incident: AdjacencyListEntry["neighbors"] = []
    edges.forEach((e, eIdx) => {
      const eName = edgeNames[eIdx]
      if (e.source === v.id) {
        incident.push({
          targetId: e.target,
          targetLabel: `${eName}${graph.directed ? " (+1 sale)" : ` (${v.label}-${labelOf.get(e.target)})`}`,
          edgeLabel: eName,
          weight: graph.weighted ? e.weight : undefined,
          edgeId: e.id,
        })
      } else if (e.target === v.id) {
        incident.push({
          targetId: e.source,
          targetLabel: `${eName}${graph.directed ? " (-1 entra)" : ` (${v.label}-${labelOf.get(e.source)})`}`,
          edgeLabel: eName,
          weight: graph.weighted ? e.weight : undefined,
          edgeId: e.id,
        })
      }
    })
    return {
      vertexId: v.id,
      vertexLabel: v.label,
      degreeInfo: `${incident.length} inc.`,
      neighbors: incident,
    }
  })

  return {
    adjacencyMatrix,
    incidenceMatrix,
    adjacencyList,
    incidenceList,
  }
}

export function runRepresentationSteps(
  graph: GraphData,
  showWeightsInAdj = false
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const full = buildGraphRepresentations(graph, showWeightsInAdj)
  const labelOf = new Map(graph.vertices.map((v) => [v.id, v.label]))

  steps.push({
    title: "Paso 1: Identificación de Vértices V y Etiquetado de Aristas E",
    description: `Numeramos los ${graph.vertices.length} vértices para las filas de nuestras estructuras y etiquetamos cada una de las ${graph.edges.length} aristas como e₁, e₂, … para las columnas de incidencia.`,
    formula: `V = { ${graph.vertices.map((v) => v.label).join(", ")} },   E = { ${graph.edges
      .map((e, i) => `${e.label ?? `e${i + 1}`}=(${labelOf.get(e.source)},${labelOf.get(e.target)})`)
      .join(", ")} }`,
    matrices: [full.adjacencyMatrix],
  })

  // Paso por cada vértice construyendo su fila de adyacencia y lista
  graph.vertices.forEach((v, idx) => {
    const vStates: Record<string, VertexVisualState> = {
      [v.id]: { status: "active", badge: `Fila ${idx + 1}` },
    }
    const eStates: Record<string, EdgeVisualState> = {}
    const neighbors = full.adjacencyList[idx]?.neighbors ?? []
    neighbors.forEach((nb) => {
      vStates[nb.targetId] = { status: "selected", badge: "Vecino" }
      eStates[nb.edgeId] = { status: "accepted", thick: true }
    })

    steps.push({
      title: `Paso ${idx + 2}: Adyacencias e Incidencias desde el vértice ${v.label}`,
      description:
        neighbors.length > 0
          ? `Desde ${v.label} alcanzamos a [${neighbors
              .map((nb) => nb.targetLabel)
              .join(", ")}]. Marcamos esas columnas en la fila ${v.label} de la Matriz de Adyacencia y enlazamos sus nodos en la Lista de Adyacencia.`
          : `El vértice ${v.label} no tiene salidas adyacentes: su fila en la Matriz de Adyacencia queda en ceros y su puntero de lista apunta a NULL.`,
      formula: `Adj[${v.label}] → [ ${neighbors.map((nb) => nb.targetLabel).join(" → ") || "NULL"} ]`,
      vertexStates: vStates,
      edgeStates: eStates,
      matrices: [full.adjacencyMatrix, full.incidenceMatrix],
    })
  })

  steps.push({
    title: "Resumen Completo: 4 Representaciones Equivalentes",
    description:
      "Tanto la Matriz y Lista de Adyacencia (relación vértice–vértice) como la Matriz y Lista de Incidencia (relación vértice–arista) codifican exactamente el mismo grafo.",
    formula: `Adyacencia: O(|V|²) en matriz vs O(|V|+|E|) en lista  |  Incidencia: O(|V|·|E|) en matriz`,
    matrices: [full.adjacencyMatrix, full.incidenceMatrix],
    summaryCards: [
      { label: "Matriz Adyacencia", value: `${graph.vertices.length} × ${graph.vertices.length}`, accent: "info" },
      { label: "Matriz Incidencia", value: `${graph.vertices.length} × ${graph.edges.length}`, accent: "ok" },
    ],
  })

  return steps
}
