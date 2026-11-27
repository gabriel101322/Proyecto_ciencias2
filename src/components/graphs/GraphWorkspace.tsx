import { useEffect, useMemo, useState } from "react"
import { GraphTopicOption } from "../../constants"
import {
  GraphAlgorithmStep,
  GraphCanvasTool,
  GraphData,
  VertexVisualState,
} from "../../types/graphTypes"
import {
  cloneGraph,
  edgeConnects,
  nextVertexLabel,
  normalizeEdgeLabels,
  PRESET_BELLMAN_ORDINAL,
  PRESET_COLORING,
  PRESET_CONVEX_HULL,
  PRESET_DIJKSTRA,
  PRESET_FLOYD,
  PRESET_IND_DOM,
  PRESET_MATCHING,
  PRESET_MATRICES,
  PRESET_MST,
  PRESET_PRODUCT_G1,
  PRESET_PRODUCT_G2,
  PRESET_SET_OPS_G1,
  PRESET_SET_OPS_G2,
  PRESET_UNARY_OPS,
} from "../../utils/graphPresets"
import {
  runBellmanOrdinalSteps,
  runDijkstraSteps,
  runFloydSteps,
} from "../../utils/graphAlgorithms/shortestPaths"
import {
  BinaryGraphOpType,
  runBinaryGraphOpSteps,
  runComplementSteps,
  runDeleteVertexSteps,
  runFuseVerticesSteps,
} from "../../utils/graphAlgorithms/graphOperations"
import {
  buildGraphRepresentations,
  runKruskalSteps,
  runPrimSteps,
  runRepresentationSteps,
} from "../../utils/graphAlgorithms/spanningTreeAndMatrices"
import {
  runChromaticPolynomialSteps,
  runConvexHullSteps,
  runGreedyColoringSteps,
  runMaxIndependentSetSteps,
  runMaxMatchingSteps,
  runMinDominatingSetSteps,
  validateCustomVertexSet,
} from "../../utils/graphAlgorithms/coloringSetsMatchingHull"
import GraphCanvas from "./GraphCanvas"
import { LinkedListView, MatrixTableView } from "./GraphMatrixAndLists"
import GraphStepPlayer from "./GraphStepPlayer"

const TOPIC_HEADERS: Record<string, { title: string; subtitle: string }> = {
  "Caminos mínimos": {
    title: "Caminos mínimos",
    subtitle: "Floyd, Dijkstra y Bellman con función ordinal",
  },
  "Operaciones entre grafos": {
    title: "Operaciones entre grafos",
    subtitle: "Unión, intersección, sumas, productos y composición",
  },
  "Operaciones sobre un grafo": {
    title: "Operaciones sobre un grafo",
    subtitle: "Insertar, borrar, fusionar y complemento",
  },
  "Árbol de expansión": {
    title: "Árbol de expansión — Prim y Kruskal",
    subtitle: "El de menor o mayor peso que une todos los vértices",
  },
  "Representación matricial": {
    title: "Representación matricial",
    subtitle: "Incidencia y adyacencia, en matriz y en lista",
  },
  "Coloreado y particionamiento": {
    title: "Coloreado y particionamiento",
    subtitle: "Primer color libre y polinomio cromático",
  },
  "Conjuntos independientes y dominantes": {
    title: "Conjuntos independientes y dominantes",
    subtitle: "Independiente máximo y dominante mínimo",
  },
  "Pareamientos y envolventes": {
    title: "Pareamientos y envolventes",
    subtitle: "Pareamiento máximo y envolvente convexa",
  },
}

function createEmptyGraphForTopic(topic: string, subAlgo?: string): GraphData {
  switch (topic) {
    case "Caminos mínimos":
      return {
        directed: subAlgo === "floyd" || subAlgo === "bellman",
        weighted: true,
        vertices: [],
        edges: [],
      }
    case "Árbol de expansión":
      return {
        directed: false,
        weighted: true,
        vertices: [],
        edges: [],
      }
    default:
      return {
        directed: false,
        weighted: false,
        vertices: [],
        edges: [],
      }
  }
}

function getGuidedExampleForTopic(topic: string, subAlgo?: string): GraphData {
  switch (topic) {
    case "Caminos mínimos":
      if (subAlgo === "floyd") return cloneGraph(PRESET_FLOYD)
      if (subAlgo === "bellman") return cloneGraph(PRESET_BELLMAN_ORDINAL)
      return cloneGraph(PRESET_DIJKSTRA)
    case "Operaciones sobre un grafo":
      return cloneGraph(PRESET_UNARY_OPS)
    case "Árbol de expansión":
      return cloneGraph(PRESET_MST)
    case "Representación matricial":
      return cloneGraph(PRESET_MATRICES)
    case "Coloreado y particionamiento":
      return cloneGraph(PRESET_COLORING)
    case "Conjuntos independientes y dominantes":
      return cloneGraph(PRESET_IND_DOM)
    case "Pareamientos y envolventes":
      if (subAlgo === "hull") return cloneGraph(PRESET_CONVEX_HULL)
      return cloneGraph(PRESET_MATCHING)
    default:
      return cloneGraph(PRESET_DIJKSTRA)
  }
}

interface GraphWorkspaceProps {
  activeOption: string
  onNotify: (text: string, tone: "info" | "ok" | "warn") => void
}

export default function GraphWorkspace({ activeOption, onNotify }: GraphWorkspaceProps) {
  const topic = activeOption as GraphTopicOption

  // Grafo principal vacío al iniciar para que el usuario construya desde cero
  const [graph, setGraph] = useState<GraphData>(() => createEmptyGraphForTopic(topic))
  const [undoStack, setUndoStack] = useState<GraphData[]>([])

  // Dos grafos vacíos al iniciar para "Operaciones entre grafos"
  const [graphG1, setGraphG1] = useState<GraphData>(() => ({
    directed: false,
    weighted: false,
    vertices: [],
    edges: [],
  }))
  const [graphG2, setGraphG2] = useState<GraphData>(() => ({
    directed: false,
    weighted: false,
    vertices: [],
    edges: [],
  }))
  const [activeDualTarget, setActiveDualTarget] = useState<"G1" | "G2">("G1")

  // Herramienta inicial "+ Vértice" para empezar a crear el grafo con un clic
  const [tool, setTool] = useState<GraphCanvasTool>("add_vertex")
  const [defaultEdgeWeight, setDefaultEdgeWeight] = useState<number>(3)

  // Sub-algoritmos y parámetros por tema
  const [shortestAlgo, setShortestAlgo] = useState<"dijkstra" | "floyd" | "bellman">("dijkstra")
  const [sourceVertexId, setSourceVertexId] = useState<string>("A")
  const [targetVertexId, setTargetVertexId] = useState<string>("F")
  const [bellmanArrangeLevels, setBellmanArrangeLevels] = useState<boolean>(true)

  const [binaryOp, setBinaryOp] = useState<BinaryGraphOpType>("union")

  // Controles de "Operaciones sobre un grafo"
  const [newVertexName, setNewVertexName] = useState<string>("")
  const [opEdgeSrc, setOpEdgeSrc] = useState<string>("A")
  const [opEdgeTgt, setOpEdgeTgt] = useState<string>("D")
  const [opEdgeWeight, setOpEdgeWeight] = useState<number>(1)
  const [deleteVertexTarget, setDeleteVertexTarget] = useState<string>("C")
  const [deleteEdgeTarget, setDeleteEdgeTarget] = useState<string>("")
  const [fuseU, setFuseU] = useState<string>("A")
  const [fuseV, setFuseV] = useState<string>("B")

  // Árbol de expansión
  const [mstAlgo, setMstAlgo] = useState<"prim" | "kruskal">("prim")
  const [mstMode, setMstMode] = useState<"min" | "max">("min")

  // Representación matricial
  const [reprMode, setReprMode] = useState<"interactive" | "steps">("interactive")
  const [showWeightsInAdj, setShowWeightsInAdj] = useState<boolean>(false)

  // Coloreado y particionamiento
  const [coloringMode, setColoringMode] = useState<"greedy" | "polynomial">("greedy")
  const [coloringOrder, setColoringOrder] = useState<"welsh_powell" | "natural">("welsh_powell")

  // Conjuntos independientes y dominantes
  const [setTopicMode, setSetTopicMode] = useState<"independent" | "dominating">("independent")
  const [labInteractiveSet, setLabInteractiveSet] = useState<boolean>(false)
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([])

  // Pareamientos y envolventes
  const [matchHullMode, setMatchHullMode] = useState<"matching" | "hull">("matching")

  // Estado del reproductor paso a paso
  const [steps, setSteps] = useState<GraphAlgorithmStep[]>([])
  const [stepIdx, setStepIdx] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speedMs, setSpeedMs] = useState<number>(1200)
  const [showLogicPanel, setShowLogicPanel] = useState<boolean>(true)
  const [binaryOpViewMode, setBinaryOpViewMode] = useState<"vertices" | "edges">("edges")

  // Resaltado cruzado matriz <-> grafo
  const [hoveredVertexId, setHoveredVertexId] = useState<string | null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

  // Al cambiar de categoría de Grafos, iniciar con el lienzo vacío para crear desde cero
  useEffect(() => {
    setIsPlaying(false)
    setTool("add_vertex")
    setCustomSelectedIds([])
    setLabInteractiveSet(false)
    setUndoStack([])
    setSteps([])
    setStepIdx(0)

    if (topic === "Operaciones entre grafos") {
      setGraphG1({ directed: false, weighted: false, vertices: [], edges: [] })
      setGraphG2({ directed: false, weighted: false, vertices: [], edges: [] })
    } else {
      const sub =
        topic === "Caminos mínimos"
          ? shortestAlgo
          : topic === "Pareamientos y envolventes"
          ? matchHullMode
          : undefined
      setGraph(createEmptyGraphForTopic(topic, sub))
      setSourceVertexId("")
      setTargetVertexId(topic === "Caminos mínimos" ? "ALL" : "")
      setDeleteEdgeTarget("")
    }
  }, [topic])

  // Sincronizar selectores cuando cambian los vértices/aristas del grafo
  useEffect(() => {
    if (graph.vertices.length > 0) {
      if (!graph.vertices.some((v) => v.id === sourceVertexId)) {
        setSourceVertexId(graph.vertices[0].id)
      }
      if (targetVertexId !== "ALL" && !graph.vertices.some((v) => v.id === targetVertexId)) {
        setTargetVertexId(graph.vertices[graph.vertices.length - 1].id)
      }
      if (!graph.vertices.some((v) => v.id === fuseU)) {
        setFuseU(graph.vertices[0].id)
      }
      if (!graph.vertices.some((v) => v.id === fuseV)) {
        setFuseV(graph.vertices[Math.min(1, graph.vertices.length - 1)].id)
      }
      if (!graph.vertices.some((v) => v.id === deleteVertexTarget)) {
        setDeleteVertexTarget(graph.vertices[0].id)
      }
      if (!graph.vertices.some((v) => v.id === opEdgeSrc)) {
        setOpEdgeSrc(graph.vertices[0].id)
      }
      if (!graph.vertices.some((v) => v.id === opEdgeTgt)) {
        setOpEdgeTgt(graph.vertices[Math.min(1, graph.vertices.length - 1)].id)
      }
    }
    if (graph.edges.length > 0 && !graph.edges.some((e) => e.id === deleteEdgeTarget)) {
      setDeleteEdgeTarget(graph.edges[0].id)
    }
  }, [graph])

  // Reproducción automática del paso a paso
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return
    if (stepIdx >= steps.length - 1) {
      setIsPlaying(false)
      return
    }
    const timer = setTimeout(() => {
      setStepIdx((prev) => Math.min(steps.length - 1, prev + 1))
    }, speedMs)
    return () => clearTimeout(timer)
  }, [isPlaying, stepIdx, steps.length, speedMs])

  // Recálculo automático de pasos para temas analíticos
  useEffect(() => {
    if (topic === "Operaciones sobre un grafo") return
    let computed: GraphAlgorithmStep[] = []

    if (topic === "Caminos mínimos") {
      if (shortestAlgo === "dijkstra") {
        computed = runDijkstraSteps(graph, sourceVertexId, targetVertexId)
      } else if (shortestAlgo === "floyd") {
        computed = runFloydSteps(
          graph,
          sourceVertexId,
          targetVertexId === "ALL" ? graph.vertices[graph.vertices.length - 1]?.id : targetVertexId
        )
      } else {
        computed = runBellmanOrdinalSteps(graph, sourceVertexId, bellmanArrangeLevels)
      }
    } else if (topic === "Operaciones entre grafos") {
      if (graphG1.vertices.length === 0 && graphG2.vertices.length === 0) {
        computed = []
      } else {
        computed = runBinaryGraphOpSteps(graphG1, graphG2, binaryOp)
      }
    } else if (topic === "Árbol de expansión") {
      computed =
        mstAlgo === "prim"
          ? runPrimSteps(graph, sourceVertexId, mstMode)
          : runKruskalSteps(graph, mstMode)
    } else if (topic === "Representación matricial") {
      computed = graph.vertices.length === 0 ? [] : runRepresentationSteps(graph, showWeightsInAdj)
    } else if (topic === "Coloreado y particionamiento") {
      computed =
        coloringMode === "greedy"
          ? runGreedyColoringSteps(graph, coloringOrder)
          : runChromaticPolynomialSteps(graph)
    } else if (topic === "Conjuntos independientes y dominantes") {
      computed =
        setTopicMode === "independent"
          ? runMaxIndependentSetSteps(graph)
          : runMinDominatingSetSteps(graph)
    } else if (topic === "Pareamientos y envolventes") {
      if (graph.vertices.length === 0) {
        computed = []
      } else {
        computed =
          matchHullMode === "matching"
            ? runMaxMatchingSteps(graph)
            : runConvexHullSteps(graph)
      }
    }

    setSteps(computed)
    setStepIdx((prev) => (computed.length === 0 ? 0 : Math.min(prev, computed.length - 1)))
  }, [
    topic,
    graph,
    graphG1,
    graphG2,
    shortestAlgo,
    sourceVertexId,
    targetVertexId,
    bellmanArrangeLevels,
    binaryOp,
    mstAlgo,
    mstMode,
    showWeightsInAdj,
    coloringMode,
    coloringOrder,
    setTopicMode,
    matchHullMode,
  ])

  // Representaciones en vivo para la pestaña "Representación matricial"
  const liveRepresentations = useMemo(
    () => buildGraphRepresentations(graph, showWeightsInAdj),
    [graph, showWeightsInAdj]
  )

  // Validación en vivo del modo laboratorio (Conjuntos independientes/dominantes)
  const customSetValidation = useMemo(() => {
    if (!labInteractiveSet) return null
    return validateCustomVertexSet(graph, customSelectedIds, setTopicMode)
  }, [graph, customSelectedIds, setTopicMode, labInteractiveSet])

  // ── Mutadores de edición de grafos ─────────────────────────────────────────
  const mutateTargetGraph = (
    updater: (prev: GraphData) => GraphData,
    target: "MAIN" | "G1" | "G2" = "MAIN"
  ) => {
    setIsPlaying(false)
    if (target === "G1") {
      setGraphG1((prev) => updater(prev))
    } else if (target === "G2") {
      setGraphG2((prev) => updater(prev))
    } else {
      setGraph((prev) => updater(prev))
      if (topic === "Operaciones sobre un grafo") {
        setSteps([])
      }
    }
  }

  const handleMoveVertex = (
    id: string,
    x: number,
    y: number,
    target: "MAIN" | "G1" | "G2" = "MAIN"
  ) => {
    const applyMove = (prev: GraphData): GraphData => ({
      ...prev,
      vertices: prev.vertices.map((v) => (v.id === id ? { ...v, x, y } : v)),
    })
    if (target === "G1") setGraphG1(applyMove)
    else if (target === "G2") setGraphG2(applyMove)
    else setGraph(applyMove)
  }

  const handleAddVertexAt = (
    x: number,
    y: number,
    target: "MAIN" | "G1" | "G2" = "MAIN"
  ) => {
    mutateTargetGraph((prev) => {
      const lbl = nextVertexLabel(prev.vertices)
      return {
        ...prev,
        vertices: [...prev.vertices, { id: lbl, label: lbl, x, y }],
      }
    }, target)
  }

  const handleAddEdgeBetween = (
    srcId: string,
    tgtId: string,
    w: number,
    target: "MAIN" | "G1" | "G2" = "MAIN"
  ) => {
    mutateTargetGraph((prev) => {
      if (prev.edges.some((e) => edgeConnects(e, srcId, tgtId, prev.directed))) {
        onNotify("Esa arista ya existe en el grafo.", "warn")
        return prev
      }
      const nextEdges = normalizeEdgeLabels([
        ...prev.edges,
        {
          id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          source: srcId,
          target: tgtId,
          weight: w,
        },
      ])
      return { ...prev, edges: nextEdges }
    }, target)
  }

  const handleDeleteVertex = (
    vertexId: string,
    target: "MAIN" | "G1" | "G2" = "MAIN"
  ) => {
    if (target === "MAIN" && topic === "Operaciones sobre un grafo") {
      pushUndo(graph)
      const { steps: delSteps, nextGraph } = runDeleteVertexSteps(graph, vertexId)
      setGraph(nextGraph)
      setSteps(delSteps)
      setStepIdx(0)
      return
    }
    mutateTargetGraph(
      (prev) => ({
        ...prev,
        vertices: prev.vertices.filter((v) => v.id !== vertexId),
        edges: normalizeEdgeLabels(
          prev.edges.filter((e) => e.source !== vertexId && e.target !== vertexId)
        ),
      }),
      target
    )
  }

  const handleDeleteEdge = (
    edgeId: string,
    target: "MAIN" | "G1" | "G2" = "MAIN"
  ) => {
    mutateTargetGraph(
      (prev) => ({
        ...prev,
        edges: normalizeEdgeLabels(prev.edges.filter((e) => e.id !== edgeId)),
      }),
      target
    )
  }

  const handleUpdateEdgeWeight = (edgeId: string, newWeight: number) => {
    mutateTargetGraph((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, weight: newWeight } : e)),
    }))
  }

  const pushUndo = (snapshot: GraphData) => {
    setUndoStack((prev) => [...prev.slice(-9), cloneGraph(snapshot)])
  }

  // ── Acciones explícitas de "Operaciones sobre un grafo" ────────────────────
  const execUnaryInsertVertex = () => {
    const raw = newVertexName.trim().toUpperCase()
    const lbl = raw || nextVertexLabel(graph.vertices)
    if (graph.vertices.some((v) => v.label.toUpperCase() === lbl)) {
      onNotify(`Ya existe un vértice llamado "${lbl}".`, "warn")
      return
    }
    pushUndo(graph)
    const angle = (graph.vertices.length * 1.35) % (Math.PI * 2)
    const x = Math.round(315 + 130 * Math.cos(angle))
    const y = Math.round(200 + 115 * Math.sin(angle))
    const nextG: GraphData = {
      ...cloneGraph(graph),
      vertices: [...graph.vertices, { id: lbl, label: lbl, x, y }],
    }
    setGraph(nextG)
    setNewVertexName("")
    setSteps([
      {
        title: `Operación: Insertar Vértice (${lbl})`,
        description: `Se agregó el nuevo vértice aislado ${lbl} al conjunto V(G) sin modificar el conjunto de aristas E(G).`,
        formula: `V(G') = V(G) ∪ { ${lbl} }   ⇒   |V'| = ${nextG.vertices.length}`,
        overrideGraph: nextG,
        vertexStates: { [lbl]: { status: "selected", badge: "Nuevo" } },
      },
    ])
    setStepIdx(0)
  }

  const execUnaryInsertEdge = () => {
    if (!opEdgeSrc || !opEdgeTgt || opEdgeSrc === opEdgeTgt) {
      onNotify("Selecciona dos vértices distintos para unir con una arista.", "warn")
      return
    }
    if (graph.edges.some((e) => edgeConnects(e, opEdgeSrc, opEdgeTgt, graph.directed))) {
      onNotify("Ya existe esa arista en el grafo.", "warn")
      return
    }
    pushUndo(graph)
    const newId = `e_${Date.now()}`
    const nextEdges = normalizeEdgeLabels([
      ...graph.edges,
      { id: newId, source: opEdgeSrc, target: opEdgeTgt, weight: opEdgeWeight },
    ])
    const nextG: GraphData = { ...cloneGraph(graph), edges: nextEdges }
    const uLbl = graph.vertices.find((v) => v.id === opEdgeSrc)?.label ?? opEdgeSrc
    const vLbl = graph.vertices.find((v) => v.id === opEdgeTgt)?.label ?? opEdgeTgt
    setGraph(nextG)
    setSteps([
      {
        title: `Operación: Insertar Arista (${uLbl}, ${vLbl})`,
        description: `Se añadió la conexión entre ${uLbl} y ${vLbl} al conjunto E(G).`,
        formula: `E(G') = E(G) ∪ { (${uLbl}, ${vLbl}) }   ⇒   |E'| = ${nextG.edges.length}`,
        overrideGraph: nextG,
        edgeStates: { [newId]: { status: "accepted", thick: true } },
      },
    ])
    setStepIdx(0)
  }

  const execUnaryDeleteVertex = () => {
    if (!deleteVertexTarget) return
    pushUndo(graph)
    const { steps: delSteps, nextGraph } = runDeleteVertexSteps(graph, deleteVertexTarget)
    setGraph(nextGraph)
    setSteps(delSteps)
    setStepIdx(0)
  }

  const execUnaryDeleteEdge = () => {
    const edge = graph.edges.find((e) => e.id === deleteEdgeTarget)
    if (!edge) return
    pushUndo(graph)
    const before = cloneGraph(graph)
    const uLbl = before.vertices.find((v) => v.id === edge.source)?.label ?? edge.source
    const vLbl = before.vertices.find((v) => v.id === edge.target)?.label ?? edge.target
    const after: GraphData = {
      ...before,
      edges: normalizeEdgeLabels(before.edges.filter((e) => e.id !== edge.id)),
    }
    setGraph(after)
    setSteps([
      {
        title: `Paso 1: Seleccionar arista ${edge.label ?? ""} = (${uLbl}, ${vLbl})`,
        description: `Al borrar únicamente una arista (G − e), se elimina el enlace (${uLbl}, ${vLbl}) pero AMBOS vértices extremos permanecen intactos en V(G).`,
        formula: `G − e = (V,  E \\ { (${uLbl}, ${vLbl}) })`,
        overrideGraph: before,
        edgeStates: { [edge.id]: { status: "rejected", dashed: true, thick: true } },
      },
      {
        title: `Paso 2: Grafo resultante G − (${uLbl}, ${vLbl})`,
        description: `La arista fue suprimida. Ahora |V| = ${after.vertices.length} y |E| = ${after.edges.length}.`,
        overrideGraph: after,
      },
    ])
    setStepIdx(0)
  }

  const execUnaryFuse = () => {
    if (!fuseU || !fuseV || fuseU === fuseV) {
      onNotify("Elige dos vértices distintos para fusionarlos.", "warn")
      return
    }
    pushUndo(graph)
    const { steps: fuseSteps, nextGraph } = runFuseVerticesSteps(graph, fuseU, fuseV)
    setGraph(nextGraph)
    setSteps(fuseSteps)
    setStepIdx(0)
  }

  const execUnaryComplement = () => {
    if (graph.vertices.length < 2) {
      onNotify("Se necesitan al menos 2 vértices para calcular el complemento.", "warn")
      return
    }
    pushUndo(graph)
    const { steps: compSteps, nextGraph } = runComplementSteps(graph)
    setGraph(nextGraph)
    setSteps(compSteps)
    setStepIdx(0)
  }

  // ── Guardar / Abrir JSON del Grafo ─────────────────────────────────────────
  const handleSaveGraphJson = () => {
    const payload =
      topic === "Operaciones entre grafos"
        ? { type: "graph_dual", topic, g1: graphG1, g2: graphG2 }
        : { type: "graph", topic, graph }

    let fileName = window.prompt("Nombre del archivo para guardar el grafo:", `grafo_${topic.toLowerCase().replace(/\s+/g, "_")}`)
    if (!fileName) return
    if (!fileName.endsWith(".json")) fileName += ".json"

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onNotify(`Grafo guardado exitosamente como ${fileName}.`, "ok")
  }

  const handleOpenGraphJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result ?? ""))
        if (parsed.type === "graph" && parsed.graph?.vertices) {
          setGraph(parsed.graph)
          onNotify("Grafo cargado exitosamente.", "ok")
        } else if (parsed.type === "graph_dual" && parsed.g1 && parsed.g2) {
          setGraphG1(parsed.g1)
          setGraphG2(parsed.g2)
          onNotify("Par de grafos G₁ y G₂ cargado exitosamente.", "ok")
        } else {
          onNotify("El archivo JSON no corresponde a un grafo válido.", "warn")
        }
      } catch {
        onNotify("Error al leer el archivo JSON.", "warn")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  // Paso activo actual
  const activeStep = steps.length > 0 ? steps[Math.min(stepIdx, steps.length - 1)] : null
  const displayedMainGraph = activeStep?.overrideGraph ?? graph

  // Grafo resultante directo para Operaciones entre grafos (siempre completo con vértices y aristas)
  const binaryResultGraph = useMemo(() => {
    if (steps.length === 0) {
      return { directed: false, weighted: false, vertices: [], edges: [] }
    }
    return (
      steps[steps.length - 1]?.overrideGraph ?? {
        directed: false,
        weighted: false,
        vertices: [],
        edges: [],
      }
    )
  }, [steps])

  // Si está en Modo Laboratorio de conjuntos independientes/dominantes, construir estados visuales propios
  const labVertexStates = useMemo(() => {
    if (!labInteractiveSet) return undefined
    const states: Record<string, VertexVisualState> = {}
    const selectedSet = new Set(customSelectedIds)
    graph.vertices.forEach((v) => {
      if (selectedSet.has(v.id)) {
        states[v.id] = {
          status: setTopicMode === "independent" ? "selected" : "source",
          badge: setTopicMode === "independent" ? "En S" : "En D",
        }
      } else if (setTopicMode === "dominating") {
        const isCov = graph.edges.some(
          (e) =>
            (e.source === v.id && selectedSet.has(e.target)) ||
            (e.target === v.id && selectedSet.has(e.source))
        )
        states[v.id] = isCov
          ? { status: "dominated", badge: "Cubierto" }
          : { status: "default", badge: "Falta" }
      }
    })
    return states
  }, [labInteractiveSet, customSelectedIds, graph, setTopicMode])

  const headerMeta = TOPIC_HEADERS[topic] ?? { title: topic, subtitle: "" }

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 flex-col gap-2">
      {/* 1. Barra Superior: Título Académico + Herramientas de Edición + Archivo */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-[#52241A]/15 bg-white px-3 py-1.5 shadow-2xs shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <h2 className="text-sm font-bold text-[#52241A] whitespace-nowrap">{headerMeta.title}</h2>
          {headerMeta.subtitle && (
            <span className="hidden xl:inline text-[11px] text-[#52241A]/65">• {headerMeta.subtitle}</span>
          )}
        </div>

        {/* Barra de herramientas del lienzo */}
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: "move", label: "✋ Mover" },
              { id: "add_vertex", label: "⊕ Vértice" },
              { id: "add_edge", label: "↗ Arista" },
              { id: "delete", label: "⌫ Borrar" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setLabInteractiveSet(false)
                setTool(t.id)
              }}
              className={`h-7 rounded-lg px-2 text-[11px] font-semibold transition ${
                tool === t.id && !labInteractiveSet
                  ? "bg-[#52241A] text-white shadow-xs"
                  : "border border-[#52241A]/15 bg-[#faf6f2] text-[#52241A] hover:bg-[#E6B793]/30"
              }`}
            >
              {t.label}
            </button>
          ))}

          {tool === "add_edge" && graph.weighted && topic !== "Operaciones entre grafos" && (
            <label className="flex items-center gap-1 rounded-lg border border-[#52241A]/20 bg-white px-1.5 py-0.5 text-[11px]">
              <span className="font-semibold text-[#52241A]/70">Peso:</span>
              <input
                type="number"
                value={defaultEdgeWeight}
                onChange={(e) => setDefaultEdgeWeight(Number(e.target.value) || 1)}
                className="w-10 font-mono font-bold text-[#52241A] outline-none text-xs"
              />
            </label>
          )}

          {topic !== "Operaciones entre grafos" && (
            <>
              <button
                type="button"
                onClick={() =>
                  mutateTargetGraph((g) => ({ ...g, directed: !g.directed }))
                }
                className={`h-7 rounded-lg border px-2 text-[11px] font-semibold transition ${
                  graph.directed
                    ? "border-[#6B2E24] bg-[#E6B793]/40 text-[#52241A]"
                    : "border-[#52241A]/15 bg-white text-[#52241A]/75 hover:bg-[#faf6f2]"
                }`}
              >
                {graph.directed ? "➔ Dirigido" : "— No Dirigido"}
              </button>

              <button
                type="button"
                onClick={() =>
                  mutateTargetGraph((g) => ({ ...g, weighted: !g.weighted }))
                }
                className={`h-7 rounded-lg border px-2 text-[11px] font-semibold transition ${
                  graph.weighted
                    ? "border-[#6B2E24] bg-[#E6B793]/40 text-[#52241A]"
                    : "border-[#52241A]/15 bg-white text-[#52241A]/75 hover:bg-[#faf6f2]"
                }`}
              >
                {graph.weighted ? "# Con Pesos" : "Sin Pesos"}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setTool("move")
              if (topic === "Operaciones entre grafos") {
                if (binaryOp === "suma_join") {
                  setGraphG1({
                    directed: false,
                    weighted: false,
                    vertices: [
                      { id: "A", label: "A", x: 95, y: 95 },
                      { id: "B", label: "B", x: 235, y: 95 },
                      { id: "C", label: "C", x: 165, y: 220 },
                    ],
                    edges: normalizeEdgeLabels([
                      { id: "j1", source: "A", target: "B", weight: 1 },
                      { id: "j2", source: "B", target: "C", weight: 1 },
                    ]),
                  })
                  setGraphG2({
                    directed: false,
                    weighted: false,
                    vertices: [
                      { id: "X", label: "X", x: 95, y: 155 },
                      { id: "Y", label: "Y", x: 235, y: 155 },
                    ],
                    edges: normalizeEdgeLabels([
                      { id: "j3", source: "X", target: "Y", weight: 1 },
                    ]),
                  })
                } else {
                  const isProd =
                    binaryOp === "prod_cartesiano" ||
                    binaryOp === "prod_tensorial" ||
                    binaryOp === "prod_fuerte" ||
                    binaryOp === "composicion"
                  setGraphG1(cloneGraph(isProd ? PRESET_PRODUCT_G1 : PRESET_SET_OPS_G1))
                  setGraphG2(cloneGraph(isProd ? PRESET_PRODUCT_G2 : PRESET_SET_OPS_G2))
                }
              } else {
                const sub =
                  topic === "Caminos mínimos"
                    ? shortestAlgo
                    : topic === "Pareamientos y envolventes"
                    ? matchHullMode
                    : undefined
                const preset = getGuidedExampleForTopic(topic, sub)
                setGraph(preset)
                if (preset.vertices.length > 0) {
                  setSourceVertexId(preset.vertices[0].id)
                  setTargetVertexId(
                    topic === "Caminos mínimos" && shortestAlgo === "dijkstra"
                      ? preset.vertices[preset.vertices.length - 1].id
                      : preset.vertices[preset.vertices.length - 1].id
                  )
                }
                setStepIdx(0)
              }
              onNotify("Ejemplo guiado cargado.", "info")
            }}
            className="h-7 rounded-lg bg-[#E6B793]/35 px-2 text-[11px] font-bold text-[#52241A] transition hover:bg-[#E6B793]/60"
          >
            ↺ Ejemplo
          </button>

          <button
            type="button"
            onClick={() => {
              if (topic === "Operaciones entre grafos") {
                if (activeDualTarget === "G1")
                  setGraphG1((g) => ({ ...g, vertices: [], edges: [] }))
                else setGraphG2((g) => ({ ...g, vertices: [], edges: [] }))
              } else {
                pushUndo(graph)
                setGraph((g) => ({ ...g, vertices: [], edges: [] }))
                setSteps([])
              }
            }}
            className="h-7 rounded-lg border border-[#52241A]/15 bg-white px-2 text-[11px] font-medium text-[#52241A]/75 hover:bg-[#52241A]/5"
          >
            Vaciar
          </button>
        </div>

        {/* Abrir / Guardar / Imprimir */}
        <div className="flex items-center gap-1 shrink-0">
          <label className="flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[11px] font-medium text-[#52241A] shadow-2xs hover:bg-[#52241A]/5">
            <input type="file" accept=".json" className="hidden" onChange={handleOpenGraphJson} />
            Abrir
          </label>
          <button
            type="button"
            onClick={handleSaveGraphJson}
            className="h-7 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[11px] font-medium text-[#52241A] shadow-2xs hover:bg-[#52241A]/5"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="h-7 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[11px] font-medium text-[#52241A] shadow-2xs hover:bg-[#52241A]/5"
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* 2. Barra de Controles Específicos del Tema Activo */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#52241A]/12 bg-[#faf6f2] px-3 py-1.5 shadow-2xs shrink-0 text-xs">
        {/* TEMA 1: CAMINOS MÍNIMOS */}
        {topic === "Caminos mínimos" && (
          <>
            <div className="flex items-center gap-1 rounded-xl bg-[#52241A]/8 p-1">
              {(
                [
                  { id: "dijkstra", label: "Dijkstra" },
                  { id: "floyd", label: "Floyd-Warshall" },
                  { id: "bellman", label: "Bellman (Función Ordinal)" },
                ] as const
              ).map((alg) => (
                <button
                  key={alg.id}
                  type="button"
                  onClick={() => {
                    setShortestAlgo(alg.id)
                    if (alg.id === "bellman" || alg.id === "floyd") {
                      setGraph((prev) => ({ ...prev, directed: true }))
                    }
                    setStepIdx(0)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    shortestAlgo === alg.id
                      ? "bg-[#52241A] text-white shadow-xs"
                      : "text-[#52241A] hover:bg-white/70"
                  }`}
                >
                  {alg.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#52241A]">
              <span>Origen:</span>
              <select
                value={sourceVertexId}
                onChange={(e) => {
                  setSourceVertexId(e.target.value)
                  setStepIdx(0)
                }}
                className="h-8 rounded-lg border border-[#52241A]/20 bg-white px-2 text-xs font-bold text-[#52241A]"
              >
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>

            {shortestAlgo !== "bellman" && (
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#52241A]">
                <span>{shortestAlgo === "floyd" ? "Consultar ruta a:" : "Destino:"}</span>
                <select
                  value={targetVertexId}
                  onChange={(e) => {
                    setTargetVertexId(e.target.value)
                    if (shortestAlgo === "floyd") setStepIdx(steps.length - 1)
                  }}
                  className="h-8 rounded-lg border border-[#52241A]/20 bg-white px-2 text-xs font-bold text-[#52241A]"
                >
                  {shortestAlgo === "dijkstra" && <option value="ALL">Todos los vértices</option>}
                  {graph.vertices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {shortestAlgo === "bellman" && (
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#52241A]/15 bg-white px-2.5 py-1.5 text-xs font-medium text-[#52241A]">
                <input
                  type="checkbox"
                  checked={bellmanArrangeLevels}
                  onChange={(e) => setBellmanArrangeLevels(e.target.checked)}
                  className="accent-[#52241A]"
                />
                Alinear visualmente niveles N₀, N₁, N₂…
              </label>
            )}
          </>
        )}

        {/* TEMA 2: OPERACIONES ENTRE GRAFOS */}
        {topic === "Operaciones entre grafos" && (
          <>
            <label className="flex items-center gap-2 text-xs font-bold text-[#52241A]">
              <span>Operación:</span>
              <select
                value={binaryOp}
                onChange={(e) => {
                  const nextOp = e.target.value as BinaryGraphOpType
                  setBinaryOp(nextOp)
                  setStepIdx(0)
                }}
                className="h-8 rounded-lg border border-[#52241A]/25 bg-white px-2.5 text-xs font-bold text-[#52241A]"
              >
                <optgroup label="Conjuntos y Sumas">
                  <option value="union">Unión (G₁ ∪ G₂)</option>
                  <option value="interseccion">Intersección (G₁ ∩ G₂)</option>
                  <option value="suma_anillo">Suma Anillo / Dif. Simétrica (G₁ ⊕ G₂)</option>
                  <option value="suma_join">Suma Completa / Join (G₁ + G₂)</option>
                </optgroup>
                <optgroup label="Productos y Composición (V₁ × V₂)">
                  <option value="prod_cartesiano">Producto Cartesiano (G₁ × G₂)</option>
                  <option value="prod_tensorial">Producto Tensorial (G₁ ⊗ G₂)</option>
                  <option value="prod_fuerte">Producto Fuerte (G₁ ☒ G₂)</option>
                  <option value="composicion">Composición Lexicográfica G₁[G₂]</option>
                </optgroup>
              </select>
            </label>

            <div className="flex items-center gap-1 rounded-lg bg-[#52241A]/8 p-1 text-xs">
              <span className="px-1.5 font-semibold text-[#52241A]/70">Editar en:</span>
              {(["G1", "G2"] as const).map((gKey) => (
                <button
                  key={gKey}
                  type="button"
                  onClick={() => setActiveDualTarget(gKey)}
                  className={`rounded-md px-2.5 py-1 font-bold ${
                    activeDualTarget === gKey
                      ? "bg-[#52241A] text-white"
                      : "text-[#52241A] hover:bg-white/60"
                  }`}
                >
                  Grafo {gKey === "G1" ? "G₁" : "G₂"}
                </button>
              ))}
            </div>
          </>
        )}

        {/* TEMA 3: OPERACIONES SOBRE UN GRAFO */}
        {topic === "Operaciones sobre un grafo" && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Insertar vértice */}
            <div className="flex items-center gap-1 rounded-xl border border-[#52241A]/15 bg-white px-2.5 py-1">
              <input
                type="text"
                maxLength={4}
                value={newVertexName}
                onChange={(e) => setNewVertexName(e.target.value)}
                placeholder="Letra (auto)"
                className="h-7 w-20 rounded border border-[#52241A]/15 px-1.5 text-xs font-semibold outline-none"
              />
              <button
                type="button"
                onClick={execUnaryInsertVertex}
                className="h-7 rounded-lg bg-[#52241A] px-2.5 text-xs font-bold text-white hover:bg-[#6B2E24]"
              >
                + Insertar Vértice
              </button>
            </div>

            {/* Insertar arista */}
            <div className="flex items-center gap-1 rounded-xl border border-[#52241A]/15 bg-white px-2.5 py-1 text-xs">
              <select
                value={opEdgeSrc}
                onChange={(e) => setOpEdgeSrc(e.target.value)}
                className="h-7 rounded border border-[#52241A]/15 px-1 font-bold"
              >
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <span>—</span>
              <select
                value={opEdgeTgt}
                onChange={(e) => setOpEdgeTgt(e.target.value)}
                className="h-7 rounded border border-[#52241A]/15 px-1 font-bold"
              >
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={execUnaryInsertEdge}
                className="h-7 rounded-lg bg-[#52241A] px-2.5 font-bold text-white hover:bg-[#6B2E24]"
              >
                + Arista
              </button>
            </div>

            {/* Borrar vértice / arista */}
            <div className="flex items-center gap-1 rounded-xl border border-[#52241A]/15 bg-white px-2.5 py-1 text-xs">
              <select
                value={deleteVertexTarget}
                onChange={(e) => setDeleteVertexTarget(e.target.value)}
                className="h-7 rounded border border-[#52241A]/15 px-1 font-bold"
              >
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={execUnaryDeleteVertex}
                disabled={graph.vertices.length === 0}
                className="h-7 rounded-lg bg-[#a23b2a] px-2.5 font-bold text-white hover:bg-[#872f20] disabled:opacity-40"
              >
                Borrar Vértice
              </button>
              {graph.edges.length > 0 && (
                <>
                  <select
                    value={deleteEdgeTarget}
                    onChange={(e) => setDeleteEdgeTarget(e.target.value)}
                    className="ml-1 h-7 rounded border border-[#52241A]/15 px-1 font-mono text-[11px]"
                  >
                    {graph.edges.map((e) => {
                      const u = graph.vertices.find((v) => v.id === e.source)?.label ?? e.source
                      const v = graph.vertices.find((v) => v.id === e.target)?.label ?? e.target
                      return (
                        <option key={e.id} value={e.id}>
                          {u}-{v}
                        </option>
                      )
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={execUnaryDeleteEdge}
                    className="h-7 rounded-lg border border-[#a23b2a]/40 px-2 font-bold text-[#a23b2a] hover:bg-[#a23b2a]/10"
                  >
                    Borrar Arista
                  </button>
                </>
              )}
            </div>

            {/* Fusionar dos vértices */}
            <div className="flex items-center gap-1 rounded-xl border border-[#52241A]/15 bg-white px-2.5 py-1 text-xs">
              <select
                value={fuseU}
                onChange={(e) => setFuseU(e.target.value)}
                className="h-7 rounded border border-[#52241A]/15 px-1 font-bold"
              >
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <span>+</span>
              <select
                value={fuseV}
                onChange={(e) => setFuseV(e.target.value)}
                className="h-7 rounded border border-[#52241A]/15 px-1 font-bold"
              >
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={execUnaryFuse}
                disabled={graph.vertices.length < 2}
                className="h-7 rounded-lg bg-[#6B2E24] px-2.5 font-bold text-white hover:bg-[#52241A] disabled:opacity-40"
              >
                Fusionar
              </button>
            </div>

            {/* Complemento */}
            <button
              type="button"
              onClick={execUnaryComplement}
              className="h-9 rounded-xl bg-[#2f7d4f] px-3 text-xs font-bold text-white shadow-2xs hover:bg-[#25663f]"
            >
              ⇄ Complemento (G̅)
            </button>

            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const prev = undoStack[undoStack.length - 1]
                  setUndoStack((s) => s.slice(0, -1))
                  setGraph(prev)
                  setSteps([])
                }}
                className="h-9 rounded-xl border border-[#52241A]/25 bg-white px-3 text-xs font-semibold text-[#52241A] hover:bg-[#52241A]/5"
              >
                ↶ Deshacer
              </button>
            )}
          </div>
        )}

        {/* TEMA 4: ÁRBOL DE EXPANSIÓN — PRIM Y KRUSKAL */}
        {topic === "Árbol de expansión" && (
          <>
            <div className="flex items-center gap-1 rounded-xl bg-[#52241A]/8 p-1">
              {(["prim", "kruskal"] as const).map((alg) => (
                <button
                  key={alg}
                  type="button"
                  onClick={() => {
                    setMstAlgo(alg)
                    setStepIdx(0)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                    mstAlgo === alg
                      ? "bg-[#52241A] text-white shadow-xs"
                      : "text-[#52241A] hover:bg-white/70"
                  }`}
                >
                  Algoritmo de {alg === "prim" ? "Prim" : "Kruskal"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-[#52241A]/8 p-1">
              {(
                [
                  { id: "min", label: "Menor Peso (Mínimo)" },
                  { id: "max", label: "Mayor Peso (Máximo)" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMstMode(m.id)
                    setStepIdx(0)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    mstMode === m.id
                      ? "bg-[#2f7d4f] text-white shadow-xs"
                      : "text-[#52241A] hover:bg-white/70"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mstAlgo === "prim" && (
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#52241A]">
                <span>Vértice inicial:</span>
                <select
                  value={sourceVertexId}
                  onChange={(e) => {
                    setSourceVertexId(e.target.value)
                    setStepIdx(0)
                  }}
                  className="h-8 rounded-lg border border-[#52241A]/20 bg-white px-2 text-xs font-bold text-[#52241A]"
                >
                  {graph.vertices.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        {/* TEMA 5: REPRESENTACIÓN MATRICIAL */}
        {topic === "Representación matricial" && (
          <>
            <div className="flex items-center gap-1 rounded-xl bg-[#52241A]/8 p-1">
              {(
                [
                  { id: "interactive", label: "Vista Simultánea (Matrices + Listas)" },
                  { id: "steps", label: "Construcción Paso a Paso" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setReprMode(m.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    reprMode === m.id
                      ? "bg-[#52241A] text-white shadow-xs"
                      : "text-[#52241A] hover:bg-white/70"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {graph.weighted && (
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#52241A]/15 bg-white px-2.5 py-1.5 text-xs font-medium text-[#52241A]">
                <input
                  type="checkbox"
                  checked={showWeightsInAdj}
                  onChange={(e) => setShowWeightsInAdj(e.target.checked)}
                  className="accent-[#52241A]"
                />
                Mostrar pesos w(i,j) en Matriz de Adyacencia
              </label>
            )}
          </>
        )}

        {/* TEMA 6: COLOREADO Y PARTICIONAMIENTO */}
        {topic === "Coloreado y particionamiento" && (
          <>
            <div className="flex items-center gap-1 rounded-xl bg-[#52241A]/8 p-1">
              {(
                [
                  { id: "greedy", label: "Primer Color Libre y Particionamiento" },
                  { id: "polynomial", label: "Polinomio Cromático P(G, k)" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setColoringMode(m.id)
                    setStepIdx(0)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    coloringMode === m.id
                      ? "bg-[#52241A] text-white shadow-xs"
                      : "text-[#52241A] hover:bg-white/70"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {coloringMode === "greedy" && (
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#52241A]">
                <span>Orden de vértices:</span>
                <select
                  value={coloringOrder}
                  onChange={(e) => {
                    setColoringOrder(e.target.value as "welsh_powell" | "natural")
                    setStepIdx(0)
                  }}
                  className="h-8 rounded-lg border border-[#52241A]/20 bg-white px-2 text-xs font-bold text-[#52241A]"
                >
                  <option value="welsh_powell">Welsh-Powell (Mayor grado primero)</option>
                  <option value="natural">Orden Natural (Alfabético)</option>
                </select>
              </label>
            )}
          </>
        )}

        {/* TEMA 7: CONJUNTOS INDEPENDIENTES Y DOMINANTES */}
        {topic === "Conjuntos independientes y dominantes" && (
          <>
            <div className="flex items-center gap-1 rounded-xl bg-[#52241A]/8 p-1">
              {(
                [
                  { id: "independent", label: "Independiente Máximo α(G)" },
                  { id: "dominating", label: "Dominante Mínimo γ(G)" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSetTopicMode(m.id)
                    setCustomSelectedIds([])
                    setStepIdx(0)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    setTopicMode === m.id
                      ? "bg-[#52241A] text-white shadow-xs"
                      : "text-[#52241A] hover:bg-white/70"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !labInteractiveSet
                setLabInteractiveSet(next)
                setCustomSelectedIds([])
                if (next) setTool("select")
                else setTool("move")
              }}
              className={`h-8 rounded-lg px-3 text-xs font-bold transition ${
                labInteractiveSet
                  ? "bg-[#2f7d4f] text-white shadow-xs"
                  : "border border-[#52241A]/20 bg-white text-[#52241A] hover:bg-[#E6B793]/30"
              }`}
            >
              {labInteractiveSet ? "✓ Probando mi propio conjunto (clic en nodos)" : "🧪 Probar mi propio conjunto"}
            </button>

            {labInteractiveSet && customSetValidation && (
              <div
                className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                  customSetValidation.valid
                    ? "border-[#2f7d4f]/35 bg-[#2f7d4f]/12 text-[#1f5c39]"
                    : "border-[#a23b2a]/35 bg-[#a23b2a]/10 text-[#a23b2a]"
                }`}
              >
                <strong>{customSetValidation.summary}:</strong> {customSetValidation.detail}
              </div>
            )}
          </>
        )}

        {/* TEMA 8: PAREAMIENTOS Y ENVOLVENTES */}
        {topic === "Pareamientos y envolventes" && (
          <div className="flex items-center gap-1 rounded-xl bg-[#52241A]/8 p-1">
            {(
              [
                { id: "matching", label: "Pareamiento Máximo ν(G)" },
                { id: "hull", label: "Envolvente Convexa (Graham Scan)" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMatchHullMode(m.id)
                  setStepIdx(0)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  matchHullMode === m.id
                    ? "bg-[#52241A] text-white shadow-xs"
                    : "text-[#52241A] hover:bg-white/70"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Área Principal Dividida: Lienzo(s) Gráfico(s) + Panel Paso a Paso / Matrices */}
      <div className="flex min-h-0 min-w-0 flex-1 gap-2.5 overflow-hidden">
        {/* Columna Izquierda: Visualización del Grafo */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 h-full overflow-hidden">
          {topic === "Operaciones entre grafos" ? (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 flex-1 min-h-0">
                <div
                  onClick={() => setActiveDualTarget("G1")}
                  className={`flex flex-col rounded-2xl transition h-full min-h-0 flex-1 ${
                    activeDualTarget === "G1" ? "ring-2 ring-[#6B2E24]" : ""
                  }`}
                >
                  <GraphCanvas
                    graph={graphG1}
                    title="Grafo G₁ (Entrada)"
                    compact
                    tool={activeDualTarget === "G1" ? tool : "move"}
                    onMoveVertex={(id, x, y) => handleMoveVertex(id, x, y, "G1")}
                    onAddVertexAt={(x, y) => handleAddVertexAt(x, y, "G1")}
                    onAddEdgeBetween={(s, t, w) => handleAddEdgeBetween(s, t, w, "G1")}
                    onDeleteVertex={(id) => handleDeleteVertex(id, "G1")}
                    onDeleteEdge={(id) => handleDeleteEdge(id, "G1")}
                  />
                </div>
                <div
                  onClick={() => setActiveDualTarget("G2")}
                  className={`flex flex-col rounded-2xl transition h-full min-h-0 flex-1 ${
                    activeDualTarget === "G2" ? "ring-2 ring-[#6B2E24]" : ""
                  }`}
                >
                  <GraphCanvas
                    graph={graphG2}
                    title="Grafo G₂ (Entrada)"
                    compact
                    tool={activeDualTarget === "G2" ? tool : "move"}
                    onMoveVertex={(id, x, y) => handleMoveVertex(id, x, y, "G2")}
                    onAddVertexAt={(x, y) => handleAddVertexAt(x, y, "G2")}
                    onAddEdgeBetween={(s, t, w) => handleAddEdgeBetween(s, t, w, "G2")}
                    onDeleteVertex={(id) => handleDeleteVertex(id, "G2")}
                    onDeleteEdge={(id) => handleDeleteEdge(id, "G2")}
                  />
                </div>
              </div>

              <GraphCanvas
                graph={binaryResultGraph}
                title="Grafo Resultado"
                compact
                readOnly
                vertexStates={
                  binaryOpViewMode === "vertices"
                    ? steps[0]?.vertexStates
                    : steps[steps.length - 1]?.vertexStates
                }
                edgeStates={steps[steps.length - 1]?.edgeStates}
              />
            </>
          ) : (
            <GraphCanvas
              graph={displayedMainGraph}
              title={`Grafo G (${displayedMainGraph.vertices.length} vértices, ${displayedMainGraph.edges.length} aristas)`}
              tool={labInteractiveSet ? "select" : tool}
              defaultEdgeWeight={defaultEdgeWeight}
              showEdgeNames={topic === "Representación matricial" || (topic === "Árbol de expansión" && mstAlgo === "kruskal")}
              showCartesianGrid={topic === "Pareamientos y envolventes" && matchHullMode === "hull"}
              vertexStates={labInteractiveSet ? labVertexStates : activeStep?.vertexStates}
              edgeStates={labInteractiveSet ? undefined : activeStep?.edgeStates}
              selectedVertexIds={labInteractiveSet ? customSelectedIds : []}
              highlightedVertexId={hoveredVertexId}
              highlightedEdgeId={hoveredEdgeId}
              hullPolygon={activeStep?.hullPolygon}
              rayLines={activeStep?.rayLines}
              onMoveVertex={(id, x, y) => handleMoveVertex(id, x, y, "MAIN")}
              onAddVertexAt={(x, y) => handleAddVertexAt(x, y, "MAIN")}
              onAddEdgeBetween={(s, t, w) => handleAddEdgeBetween(s, t, w, "MAIN")}
              onDeleteVertex={(id) => handleDeleteVertex(id, "MAIN")}
              onDeleteEdge={(id) => handleDeleteEdge(id, "MAIN")}
              onUpdateEdgeWeight={handleUpdateEdgeWeight}
              onSelectVertex={(vId) => {
                setCustomSelectedIds((prev) =>
                  prev.includes(vId) ? prev.filter((x) => x !== vId) : [...prev, vId]
                )
              }}
            />
          )}
        </div>

        {/* Columna Derecha: Explicación Paso a Paso o Vista Simultánea de 4 Representaciones */}
        {showLogicPanel ? (
          <div
            className={`flex min-h-0 min-w-0 flex-col h-full overflow-hidden shrink-0 transition-all duration-300 ${
              topic === "Operaciones entre grafos"
                ? "w-72 sm:w-80 xl:w-84"
                : topic === "Representación matricial" && reprMode === "interactive"
                ? "w-80 lg:w-96 xl:w-[440px]"
                : "w-72 lg:w-80 xl:w-96"
            }`}
          >
            {topic === "Operaciones entre grafos" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#52241A]/15 bg-white shadow-sm h-full">
                {/* Encabezado sin slider ni controles de reproducción */}
                <div className="border-b border-[#52241A]/15 bg-[#52241A] px-3.5 py-2 text-white shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E6B793] truncate">
                      Explicación de la Operación
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLogicPanel(false)}
                      title="Minimizar panel"
                      className="flex size-6 items-center justify-center rounded-md bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Contenido: cálculo directo y selección de Vértices / Aristas */}
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#faf6f2]/35 p-3">
                  {steps.length === 0 ? (
                    <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-4 text-center">
                      <p className="text-sm font-medium text-[#52241A]/55">
                        Agrega vértices a G₁ y G₂ o carga un Ejemplo Guiado para iniciar.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Tarjetas interactivas para SELECCIONAR Vértices o Aristas */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#52241A]/60">
                          Seleccionar regla / detalle:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setBinaryOpViewMode("vertices")}
                            className={`flex flex-col rounded-xl border p-2.5 text-left transition-all ${
                              binaryOpViewMode === "vertices"
                                ? "border-[#2f7d4f] bg-[#2f7d4f]/15 text-[#1f5c39] ring-2 ring-[#2f7d4f]/30 shadow-xs"
                                : "border-[#52241A]/15 bg-white text-[#52241A] hover:bg-[#faf6f2] hover:border-[#52241A]/30"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80">
                              <span>Vértices |V|</span>
                              {binaryOpViewMode === "vertices" && (
                                <span className="text-[10px] font-bold text-[#2f7d4f]">✓ Activo</span>
                              )}
                            </div>
                            <div className="mt-1 font-mono text-base font-bold">
                              {binaryResultGraph.vertices.length}
                            </div>
                            <span className="text-[10px] opacity-75 mt-0.5">
                              {binaryOpViewMode === "vertices" ? "Mostrando regla" : "Clic para ver regla"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBinaryOpViewMode("edges")}
                            className={`flex flex-col rounded-xl border p-2.5 text-left transition-all ${
                              binaryOpViewMode === "edges"
                                ? "border-[#2f7d4f] bg-[#2f7d4f]/15 text-[#1f5c39] ring-2 ring-[#2f7d4f]/30 shadow-xs"
                                : "border-[#52241A]/15 bg-white text-[#52241A] hover:bg-[#faf6f2] hover:border-[#52241A]/30"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80">
                              <span>Aristas |E|</span>
                              {binaryOpViewMode === "edges" && (
                                <span className="text-[10px] font-bold text-[#2f7d4f]">✓ Activo</span>
                              )}
                            </div>
                            <div className="mt-1 font-mono text-base font-bold">
                              {binaryResultGraph.edges.length}
                            </div>
                            <span className="text-[10px] opacity-75 mt-0.5">
                              {binaryOpViewMode === "edges" ? "Mostrando regla" : "Clic para ver regla"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Tarjeta explicativa según el modo seleccionado */}
                      {binaryOpViewMode === "vertices" ? (
                        <div className="space-y-2.5">
                          <div className="rounded-xl border border-[#E6B793]/60 bg-white p-3.5 shadow-2xs">
                            <h4 className="text-[13px] font-bold text-[#52241A]">
                              {steps[0]?.title ?? "Conjunto de Vértices"}
                            </h4>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-[#2b1610]/85">
                              {steps[0]?.description}
                            </p>
                            {steps[0]?.formula && (
                              <div className="mt-2.5 overflow-x-auto rounded-lg border border-[#52241A]/12 bg-[#faf6f2] px-3 py-2 font-mono text-[11.5px] font-semibold text-[#6B2E24]">
                                {steps[0].formula}
                              </div>
                            )}
                          </div>

                          {/* Badges de pertenencia de vértices */}
                          {binaryResultGraph.vertices.length > 0 && steps[0]?.vertexStates && (
                            <div className="rounded-xl border border-[#52241A]/12 bg-white p-3 shadow-2xs">
                              <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#52241A]/65">
                                Clasificación en el Grafo Resultado
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {binaryResultGraph.vertices.map((v) => {
                                  const st = steps[0]?.vertexStates?.[v.id]
                                  return (
                                    <span
                                      key={v.id}
                                      className="inline-flex items-center gap-1 rounded-md border border-[#52241A]/15 bg-[#faf6f2] px-2 py-1 font-mono text-[11px] font-semibold text-[#52241A]"
                                    >
                                      <span>{v.label}</span>
                                      {st?.badge && (
                                        <span className="rounded bg-[#52241A]/10 px-1 text-[9.5px] font-bold text-[#6B2E24]">
                                          {st.badge}
                                        </span>
                                      )}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {/* Información de Aristas (último paso) */}
                          {(() => {
                            const edgeStep = steps[steps.length - 1]
                            return (
                              <>
                                <div className="rounded-xl border border-[#E6B793]/60 bg-white p-3.5 shadow-2xs">
                                  <h4 className="text-[13px] font-bold text-[#52241A]">
                                    {edgeStep?.title ?? "Construcción de Aristas"}
                                  </h4>
                                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#2b1610]/85">
                                    {edgeStep?.description}
                                  </p>
                                  {edgeStep?.formula && (
                                    <div className="mt-2.5 overflow-x-auto rounded-lg border border-[#52241A]/12 bg-[#faf6f2] px-3 py-2 font-mono text-[11.5px] font-semibold text-[#6B2E24]">
                                      {edgeStep.formula}
                                    </div>
                                  )}
                                </div>

                                {/* Detalle de evaluaciones de aristas */}
                                {edgeStep?.detailList && edgeStep.detailList.length > 0 && (
                                  <div className="rounded-xl border border-[#52241A]/12 bg-white p-3 shadow-2xs">
                                    <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#52241A]/65">
                                      Detalle de Evaluaciones ({edgeStep.detailList.length})
                                    </div>
                                    <ul className="space-y-1 text-xs text-[#2b1610]/85 max-h-56 overflow-y-auto pr-1">
                                      {edgeStep.detailList.map((line, i) => (
                                        <li
                                          key={i}
                                          className="rounded-md bg-[#faf6f2]/80 px-2.5 py-1 font-mono text-[11px] leading-snug border border-[#52241A]/8"
                                        >
                                          {line}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : topic === "Representación matricial" && reprMode === "interactive" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#52241A]/15 bg-white shadow-sm h-full">
                <div className="border-b border-[#52241A]/15 bg-[#52241A] px-3.5 py-1.5 text-white shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E6B793] truncate">
                      Adyacencia e Incidencia
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLogicPanel(false)}
                      title="Minimizar panel"
                      className="flex size-6 items-center justify-center rounded-md bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-white/75 truncate">
                    Pasa el cursor sobre cualquier fila o nodo enlazado para iluminarlo en el grafo.
                  </p>
                </div>
                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#faf6f2]/35 p-3">
                  <MatrixTableView
                    matrix={liveRepresentations.adjacencyMatrix}
                    onHoverRowVertexLabel={(lbl) => {
                      const found = graph.vertices.find((v) => v.label === lbl)
                      setHoveredVertexId(found?.id ?? null)
                    }}
                  />
                  <LinkedListView
                    title="Lista de Adyacencia"
                    subtitle="Cada vértice apunta dinámicamente a la lista enlazada de sus vecinos directos."
                    entries={liveRepresentations.adjacencyList}
                    onHoverVertex={setHoveredVertexId}
                    onHoverEdge={setHoveredEdgeId}
                  />
                  <MatrixTableView
                    matrix={liveRepresentations.incidenceMatrix}
                    onHoverRowVertexLabel={(lbl) => {
                      const found = graph.vertices.find((v) => v.label === lbl)
                      setHoveredVertexId(found?.id ?? null)
                    }}
                  />
                  <LinkedListView
                    title="Lista de Incidencia"
                    subtitle="Cada vértice enlaza todas las aristas eₖ que inciden sobre él."
                    entries={liveRepresentations.incidenceList}
                    onHoverVertex={setHoveredVertexId}
                    onHoverEdge={setHoveredEdgeId}
                  />
                </div>
              </div>
            ) : (
              <GraphStepPlayer
                steps={steps}
                currentStepIndex={stepIdx}
                isPlaying={isPlaying}
                speedMs={speedMs}
                onStepChange={(idx) => {
                  setIsPlaying(false)
                  setStepIdx(idx)
                }}
                onTogglePlay={() => {
                  if (stepIdx >= steps.length - 1) setStepIdx(0)
                  setIsPlaying((p) => !p)
                }}
                onSpeedChange={setSpeedMs}
                onHoverVertexLabel={(lbl) => {
                  const found = displayedMainGraph.vertices.find((v) => v.label === lbl)
                  setHoveredVertexId(found?.id ?? null)
                }}
                onToggleCollapse={() => setShowLogicPanel(false)}
                emptyHint={
                  topic === "Operaciones sobre un grafo"
                    ? "Ejecuta Insertar, Borrar, Fusionar o Complemento en la barra superior para ver la demostración paso a paso."
                    : "Agrega vértices o carga un Ejemplo Guiado para iniciar."
                }
              />
            )}
          </div>
        ) : (
          <div className="flex shrink-0 h-full items-start">
            <button
              type="button"
              onClick={() => setShowLogicPanel(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#52241A]/20 bg-white px-2 py-4 text-xs font-bold text-[#52241A] shadow-sm hover:bg-[#faf6f2] transition [writing-mode:vertical-lr]"
              title="Mostrar Explicación Paso a Paso"
            >
              <span>◀ Explicación</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
