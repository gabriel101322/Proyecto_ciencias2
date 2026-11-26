import {
  EdgeVisualState,
  GraphAlgorithmStep,
  GraphData,
  GraphEdge,
  GraphVertex,
  VertexVisualState,
} from "../../types/graphTypes"
import { cloneGraph, edgeConnects, normalizeEdgeLabels } from "../graphPresets"

export type BinaryGraphOpType =
  | "union"
  | "interseccion"
  | "suma_anillo"
  | "suma_join"
  | "prod_cartesiano"
  | "prod_tensorial"
  | "prod_fuerte"
  | "composicion"

function circleLayout(labels: string[], cx = 315, cy = 200, r = 135): GraphVertex[] {
  if (labels.length === 1) {
    return [{ id: labels[0], label: labels[0], x: cx, y: cy }]
  }
  return labels.map((lbl, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / labels.length
    return {
      id: lbl,
      label: lbl,
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
    }
  })
}

function gridLayout(v1: GraphVertex[], v2: GraphVertex[]): GraphVertex[] {
  const rows = v1.length
  const cols = v2.length
  const padX = 105
  const padY = 85
  const usableW = 430
  const usableH = 230

  const result: GraphVertex[] = []
  v1.forEach((u, r) => {
    v2.forEach((v, c) => {
      const x = cols === 1 ? 315 : Math.round(padX + (c * usableW) / (cols - 1))
      const y = rows === 1 ? 200 : Math.round(padY + (r * usableH) / (rows - 1))
      const pairLabel = `${u.label}${v.label}`
      result.push({
        id: `${u.id}__${v.id}`,
        label: pairLabel,
        x,
        y,
      })
    })
  })
  return result
}

function canonicalEdgeKey(u: string, v: string, directed: boolean): string {
  if (directed) return `${u}->${v}`
  return u < v ? `${u}--${v}` : `${v}--${u}`
}

// ── 1. OPERACIONES ENTRE DOS GRAFOS (G1 y G2) ───────────────────────────────
export function runBinaryGraphOpSteps(
  g1: GraphData,
  g2: GraphData,
  op: BinaryGraphOpType
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const directed = g1.directed || g2.directed

  const labels1 = g1.vertices.map((v) => v.label)
  const labels2 = g2.vertices.map((v) => v.label)
  const setV1 = new Set(labels1)
  const setV2 = new Set(labels2)

  const idToLabel1 = new Map(g1.vertices.map((v) => [v.id, v.label]))
  const idToLabel2 = new Map(g2.vertices.map((v) => [v.id, v.label]))

  const edges1Map = new Map<string, { u: string; v: string }>()
  g1.edges.forEach((e) => {
    const u = idToLabel1.get(e.source) ?? e.source
    const v = idToLabel1.get(e.target) ?? e.target
    edges1Map.set(canonicalEdgeKey(u, v, directed), { u, v })
  })

  const edges2Map = new Map<string, { u: string; v: string }>()
  g2.edges.forEach((e) => {
    const u = idToLabel2.get(e.source) ?? e.source
    const v = idToLabel2.get(e.target) ?? e.target
    edges2Map.set(canonicalEdgeKey(u, v, directed), { u, v })
  })

  // Operaciones conjuntistas (Unión, Intersección, Suma Anillo, Suma Completa/Join)
  if (
    op === "union" ||
    op === "interseccion" ||
    op === "suma_anillo" ||
    op === "suma_join"
  ) {
    const unionLabels = Array.from(new Set([...labels1, ...labels2]))
    const interLabels = labels1.filter((l) => setV2.has(l))

    const targetLabels = op === "interseccion" ? interLabels : unionLabels
    const resultVertices = circleLayout(targetLabels)

    const vStatesStep1: Record<string, VertexVisualState> = {}
    resultVertices.forEach((v) => {
      const inBoth = setV1.has(v.label) && setV2.has(v.label)
      vStatesStep1[v.id] = {
        status: inBoth ? "selected" : "visited",
        badge: inBoth ? "G₁∩G₂" : setV1.has(v.label) ? "Solo G₁" : "Solo G₂",
      }
    })

    const step1Graph: GraphData = {
      directed,
      weighted: false,
      vertices: resultVertices,
      edges: [],
    }

    const opFormulas: Record<string, { name: string; vRule: string; eRule: string }> = {
      union: {
        name: "Unión (G₁ ∪ G₂)",
        vRule: "V(G₁ ∪ G₂) = V₁ ∪ V₂",
        eRule: "E(G₁ ∪ G₂) = E₁ ∪ E₂",
      },
      interseccion: {
        name: "Intersección (G₁ ∩ G₂)",
        vRule: "V(G₁ ∩ G₂) = V₁ ∩ V₂",
        eRule: "E(G₁ ∩ G₂) = E₁ ∩ E₂",
      },
      suma_anillo: {
        name: "Suma Anillo / Diferencia Simétrica (G₁ ⊕ G₂)",
        vRule: "V(G₁ ⊕ G₂) = V₁ ∪ V₂",
        eRule: "E(G₁ ⊕ G₂) = (E₁ ∪ E₂) \\ (E₁ ∩ E₂)  (aristas en uno solo, no en ambos)",
      },
      suma_join: {
        name: "Suma Completa / Join (G₁ + G₂)",
        vRule: "V(G₁ + G₂) = V₁ ∪ V₂",
        eRule: "E(G₁ + G₂) = E₁ ∪ E₂ ∪ { (u, v) : u ∈ V₁, v ∈ V₂, u ≠ v }",
      },
    }

    const info = opFormulas[op]
    steps.push({
      title: `Paso 1: Conjunto de Vértices para ${info.name}`,
      description:
        targetLabels.length > 0
          ? `Determinamos el conjunto de vértices resultante a partir de V₁ = {${labels1.join(", ")}} y V₂ = {${labels2.join(", ")}}.`
          : "V₁ y V₂ no tienen etiquetas en común (V₁ ∩ V₂ = ∅). Renombra o agrega vértices con la misma letra en G₁ y G₂ para obtener una intersección no vacía.",
      formula: `${info.vRule} = { ${targetLabels.join(", ") || "∅"} }`,
      overrideGraph: step1Graph,
      vertexStates: vStatesStep1,
    })

    const resultEdges: GraphEdge[] = []
    const edgeStates: Record<string, EdgeVisualState> = {}
    const explanationItems: string[] = []

    const allKeys = new Set([...edges1Map.keys(), ...edges2Map.keys()])
    let idx = 1

    allKeys.forEach((k) => {
      const in1 = edges1Map.has(k)
      const in2 = edges2Map.has(k)
      const pair = (edges1Map.get(k) ?? edges2Map.get(k))!

      if (op === "union") {
        const id = `res_e${idx++}`
        resultEdges.push({ id, source: pair.u, target: pair.v, weight: 1 })
        edgeStates[id] = {
          status: in1 && in2 ? "shared" : in1 ? "g1" : "g2",
          thick: true,
        }
        explanationItems.push(
          `Arista (${pair.u}, ${pair.v}): ${
            in1 && in2 ? "común en E₁ y E₂" : in1 ? "proviene de E₁" : "proviene de E₂"
          } ⇒ Incluida.`
        )
      } else if (op === "interseccion") {
        if (in1 && in2 && setV1.has(pair.u) && setV2.has(pair.u) && setV1.has(pair.v) && setV2.has(pair.v)) {
          const id = `res_e${idx++}`
          resultEdges.push({ id, source: pair.u, target: pair.v, weight: 1 })
          edgeStates[id] = { status: "accepted", thick: true }
          explanationItems.push(`Arista (${pair.u}, ${pair.v}) ∈ E₁ ∩ E₂ ⇒ Se conserva.`)
        } else {
          explanationItems.push(`Arista (${pair.u}, ${pair.v}) solo pertenece a ${in1 ? "G₁" : "G₂"} ⇒ Se descarta.`)
        }
      } else if (op === "suma_anillo") {
        if (in1 !== in2) {
          const id = `res_e${idx++}`
          resultEdges.push({ id, source: pair.u, target: pair.v, weight: 1 })
          edgeStates[id] = { status: in1 ? "g1" : "g2", thick: true }
          explanationItems.push(
            `Arista (${pair.u}, ${pair.v}) exclusiva de ${in1 ? "G₁" : "G₂"} ⇒ Se conserva en G₁ ⊕ G₂.`
          )
        } else {
          explanationItems.push(
            `Arista (${pair.u}, ${pair.v}) aparece en ambos grafos (E₁ ∩ E₂) ⇒ Se cancela en la suma anillo.`
          )
        }
      } else if (op === "suma_join") {
        const id = `res_e${idx++}`
        resultEdges.push({ id, source: pair.u, target: pair.v, weight: 1 })
        edgeStates[id] = { status: in1 && in2 ? "shared" : in1 ? "g1" : "g2" }
      }
    })

    if (op === "suma_join") {
      const existingKeys = new Set(
        resultEdges.map((e) => canonicalEdgeKey(e.source, e.target, directed))
      )
      for (const u of labels1) {
        for (const v of labels2) {
          if (u === v) continue
          const key = canonicalEdgeKey(u, v, directed)
          if (!existingKeys.has(key)) {
            existingKeys.add(key)
            const id = `res_e${idx++}`
            resultEdges.push({ id, source: u, target: v, weight: 1 })
            edgeStates[id] = { status: "new", dashed: true, thick: true }
            explanationItems.push(`Nueva arista cruzada (${u}, ${v}) conectando u ∈ V₁ con v ∈ V₂.`)
          }
        }
      }
    }

    const finalGraph: GraphData = {
      directed,
      weighted: false,
      vertices: resultVertices,
      edges: normalizeEdgeLabels(resultEdges),
    }
    // Remap edgeStates to normalized IDs (same ids preserved)
    steps.push({
      title: `Paso 2: Construcción de Aristas — ${info.name}`,
      description: `Aplicamos la regla de adyacencia de ${info.name}. El grafo resultante tiene |V| = ${finalGraph.vertices.length} vértices y |E| = ${finalGraph.edges.length} aristas.`,
      formula: info.eRule,
      detailList: explanationItems.length > 0 ? explanationItems : ["El resultado no contiene aristas."],
      overrideGraph: finalGraph,
      vertexStates: vStatesStep1,
      edgeStates,
      summaryCards: [
        { label: "Vértices |V|", value: String(finalGraph.vertices.length), accent: "info" },
        { label: "Aristas |E|", value: String(finalGraph.edges.length), accent: "ok" },
      ],
    })

    return steps
  }

  // Operaciones sobre el Producto Cartesiano de Vértices V1 × V2:
  // Producto Cartesiano (×), Tensorial (⊗), Fuerte (☒) y Composición Lexicográfica (G1[G2])
  if (g1.vertices.length * g2.vertices.length > 25) {
    steps.push({
      title: "Límite pedagógico de visualización (|V₁| × |V₂| > 25)",
      description: `Actualmente |V₁| = ${g1.vertices.length} y |V₂| = ${g2.vertices.length}, lo que generaría ${
        g1.vertices.length * g2.vertices.length
      } vértices pares. Usa grafos de hasta 5×5 vértices (o carga el Ejemplo de Productos) para visualizar la malla con claridad.`,
      summaryCards: [{ label: "Pares V₁×V₂", value: `${g1.vertices.length * g2.vertices.length} nodos`, accent: "warn" }],
    })
    return steps
  }

  const prodVertices = gridLayout(g1.vertices, g2.vertices)
  const hasEdge1 = (uId: string, vId: string) =>
    uId !== vId && g1.edges.some((e) => edgeConnects(e, uId, vId, directed))
  const hasEdge2 = (uId: string, vId: string) =>
    uId !== vId && g2.edges.some((e) => edgeConnects(e, uId, vId, directed))

  const opMeta = {
    prod_cartesiano: {
      name: "Producto Cartesiano (G₁ × G₂)",
      formula: "(u₁, u₂) ~ (v₁, v₂)  ⇔  [u₁ = v₁ ∧ (u₂, v₂) ∈ E₂]  ∨  [u₂ = v₂ ∧ (u₁, v₁) ∈ E₁]",
    },
    prod_tensorial: {
      name: "Producto Tensorial / Directo (G₁ ⊗ G₂)",
      formula: "(u₁, u₂) ~ (v₁, v₂)  ⇔  (u₁, v₁) ∈ E₁  ∧  (u₂, v₂) ∈ E₂",
    },
    prod_fuerte: {
      name: "Producto Fuerte / Normal (G₁ ☒ G₂)",
      formula: "E(G₁ ☒ G₂) = E(G₁ × G₂) ∪ E(G₁ ⊗ G₂)",
    },
    composicion: {
      name: "Composición / Producto Lexicográfico G₁[G₂]",
      formula: "(u₁, u₂) ~ (v₁, v₂)  ⇔  (u₁, v₁) ∈ E₁  ∨  [u₁ = v₁ ∧ (u₂, v₂) ∈ E₂]",
    },
  }[op]

  // Paso 1: Malla V1 x V2
  steps.push({
    title: `Paso 1: Malla de Vértices Pares V₁ × V₂ (${prodVertices.length} vértices)`,
    description: `Cada fila representa un vértice de G₁ (${labels1.join(", ")}) y cada columna un vértice de G₂ (${labels2.join(", ")}), formando pares ordenados (u, v).`,
    formula: `V = V₁ × V₂ = { ${prodVertices.map((p) => p.label).join(", ")} }`,
    overrideGraph: {
      directed,
      weighted: false,
      vertices: prodVertices,
      edges: [],
    },
  })

  const pairs: Array<[GraphVertex, GraphVertex, string, string, string, string]> = []
  for (let i = 0; i < g1.vertices.length; i++) {
    for (let a = 0; a < g2.vertices.length; a++) {
      for (let j = 0; j < g1.vertices.length; j++) {
        for (let b = 0; b < g2.vertices.length; b++) {
          if (i === j && a === b) continue
          if (!directed && (i > j || (i === j && a > b))) continue
          const nodeA = prodVertices[i * g2.vertices.length + a]
          const nodeB = prodVertices[j * g2.vertices.length + b]
          pairs.push([
            nodeA,
            nodeB,
            g1.vertices[i].id,
            g2.vertices[a].id,
            g1.vertices[j].id,
            g2.vertices[b].id,
          ])
        }
      }
    }
  }

  const phase1Edges: GraphEdge[] = []
  const phase2Edges: GraphEdge[] = []
  const edgeStates: Record<string, EdgeVisualState> = {}
  const details: string[] = []
  let eCounter = 1

  for (const [nodeA, nodeB, u1, u2, v1, v2] of pairs) {
    const sameU = u1 === v1
    const sameV = u2 === v2
    const adj1 = hasEdge1(u1, v1)
    const adj2 = hasEdge2(u2, v2)

    if (op === "prod_cartesiano") {
      if (sameU && adj2) {
        const id = `pe_${eCounter++}`
        phase1Edges.push({ id, source: nodeA.id, target: nodeB.id, weight: 1 })
        edgeStates[id] = { status: "g2", thick: true }
        details.push(`(${nodeA.label}, ${nodeB.label}): mismo u₁ y adyacentes en G₂ (arista horizontal).`)
      } else if (sameV && adj1) {
        const id = `pe_${eCounter++}`
        phase2Edges.push({ id, source: nodeA.id, target: nodeB.id, weight: 1 })
        edgeStates[id] = { status: "g1", thick: true }
        details.push(`(${nodeA.label}, ${nodeB.label}): mismo u₂ y adyacentes en G₁ (arista vertical).`)
      }
    } else if (op === "prod_tensorial") {
      if (adj1 && adj2) {
        const id = `pe_${eCounter++}`
        phase2Edges.push({ id, source: nodeA.id, target: nodeB.id, weight: 1 })
        edgeStates[id] = { status: "accepted", thick: true }
        details.push(`(${nodeA.label}, ${nodeB.label}): adyacentes simultáneamente en G₁ y en G₂ (diagonal).`)
      }
    } else if (op === "prod_fuerte") {
      if ((sameU && adj2) || (sameV && adj1)) {
        const id = `pe_${eCounter++}`
        phase1Edges.push({ id, source: nodeA.id, target: nodeB.id, weight: 1 })
        edgeStates[id] = { status: "g1" }
        details.push(`(${nodeA.label}, ${nodeB.label}): aporte cartesiano.`)
      } else if (adj1 && adj2) {
        const id = `pe_${eCounter++}`
        phase2Edges.push({ id, source: nodeA.id, target: nodeB.id, weight: 1 })
        edgeStates[id] = { status: "new", dashed: true, thick: true }
        details.push(`(${nodeA.label}, ${nodeB.label}): aporte tensorial diagonal.`)
      }
    } else if (op === "composicion") {
      if (sameU && adj2) {
        const id = `pe_${eCounter++}`
        phase1Edges.push({ id, source: nodeA.id, target: nodeB.id, weight: 1 })
        edgeStates[id] = { status: "g2", thick: true }
        details.push(`(${nodeA.label}, ${nodeB.label}): copia interna de G₂ para u₁ fijo.`)
      } else if (adj1) {
        const id = `pe_${eCounter++}`
        phase2Edges.push({ id, source: nodeA.id, target: nodeB.id, weight: 1 })
        edgeStates[id] = { status: "new", thick: false }
        details.push(`(${nodeA.label}, ${nodeB.label}): como (${u1},${v1}) ∈ E₁, conecta todos los pares entre sus filas.`)
      }
    }
  }

  if (phase1Edges.length > 0) {
    steps.push({
      title: `Paso 2: Primer grupo de adyacencias (${phase1Edges.length} aristas)`,
      description:
        op === "composicion"
          ? "Primero dibujamos una copia de G₂ dentro de cada fila (cuando u₁ = v₁ y (u₂, v₂) ∈ E₂)."
          : "Trazamos las conexiones estructurales base sobre las copias de la rejilla.",
      formula: opMeta.formula,
      overrideGraph: {
        directed,
        weighted: false,
        vertices: prodVertices,
        edges: normalizeEdgeLabels(phase1Edges),
      },
      edgeStates,
    })
  }

  const allProdEdges = normalizeEdgeLabels([...phase1Edges, ...phase2Edges])
  steps.push({
    title: `Resultado Final: ${opMeta.name}`,
    description: `Se completan todas las conexiones según la definición formal. Total: ${prodVertices.length} vértices y ${allProdEdges.length} aristas.`,
    formula: opMeta.formula,
    detailList: details.slice(0, 18),
    overrideGraph: {
      directed,
      weighted: false,
      vertices: prodVertices,
      edges: allProdEdges,
    },
    edgeStates,
    summaryCards: [
      { label: "|V₁ × V₂|", value: String(prodVertices.length), accent: "info" },
      { label: "Aristas Totales", value: String(allProdEdges.length), accent: "ok" },
    ],
  })

  return steps
}

// ── 2. OPERACIONES SOBRE UN GRAFO (Insertar, Borrar, Fusionar, Complemento) ──
export function runDeleteVertexSteps(
  graph: GraphData,
  vertexId: string
): { steps: GraphAlgorithmStep[]; nextGraph: GraphData } {
  const v = graph.vertices.find((n) => n.id === vertexId)
  if (!v) return { steps: [], nextGraph: graph }

  const before = cloneGraph(graph)
  const incident = before.edges.filter(
    (e) => e.source === vertexId || e.target === vertexId
  )

  const vStates1: Record<string, VertexVisualState> = {
    [vertexId]: { status: "removed", badge: "Eliminar" },
  }
  const eStates1: Record<string, EdgeVisualState> = {}
  incident.forEach((e) => {
    eStates1[e.id] = { status: "rejected", dashed: true, thick: true }
  })

  const after: GraphData = {
    ...before,
    vertices: before.vertices.filter((n) => n.id !== vertexId),
    edges: normalizeEdgeLabels(
      before.edges.filter((e) => e.source !== vertexId && e.target !== vertexId)
    ),
  }

  const steps: GraphAlgorithmStep[] = [
    {
      title: `Paso 1: Identificar ${v.label} y sus ${incident.length} arista(s) incidente(s)`,
      description: `Al suprimir un vértice G - ${v.label}, por definición debemos eliminar también todas las aristas que tienen a ${v.label} como extremo para que ninguna arista quede sin vértice soporte.`,
      formula: `G' = (V \\ {${v.label}},  E \\ { e ∈ E : ${v.label} ∈ e })`,
      overrideGraph: before,
      vertexStates: vStates1,
      edgeStates: eStates1,
    },
    {
      title: `Paso 2: Grafo resultante G - ${v.label}`,
      description: `Se eliminó el vértice ${v.label} junto con ${incident.length} arista(s). Quedan ${after.vertices.length} vértices y ${after.edges.length} aristas.`,
      formula: `|V'| = ${after.vertices.length},   |E'| = ${after.edges.length}`,
      overrideGraph: after,
    },
  ]

  return { steps, nextGraph: after }
}

export function runFuseVerticesSteps(
  graph: GraphData,
  uId: string,
  vId: string
): { steps: GraphAlgorithmStep[]; nextGraph: GraphData } {
  if (uId === vId) return { steps: [], nextGraph: graph }
  const u = graph.vertices.find((n) => n.id === uId)
  const v = graph.vertices.find((n) => n.id === vId)
  if (!u || !v) return { steps: [], nextGraph: graph }

  const before = cloneGraph(graph)
  const mergedLabel = `${u.label}${v.label}`
  const mergedId = `F_${u.id}_${v.id}_${Date.now().toString(36).slice(-3)}`
  const midX = Math.round((u.x + v.x) / 2)
  const midY = Math.round((u.y + v.y) / 2)

  const vStates1: Record<string, VertexVisualState> = {
    [uId]: { status: "active", badge: "Fusionar" },
    [vId]: { status: "active", badge: "Fusionar" },
  }
  const eStates1: Record<string, EdgeVisualState> = {}
  before.edges.forEach((e) => {
    const both =
      (e.source === uId && e.target === vId) ||
      (e.source === vId && e.target === uId)
    if (both) {
      eStates1[e.id] = { status: "rejected", dashed: true, thick: true }
    } else if (e.source === uId || e.target === uId || e.source === vId || e.target === vId) {
      eStates1[e.id] = { status: "exploring", thick: true }
    }
  })

  // Construir grafo fusionado simple (sin bucles ni aristas paralelas duplicadas)
  const remainingVertices: GraphVertex[] = before.vertices
    .filter((n) => n.id !== uId && n.id !== vId)
    .map((n) => ({ ...n }))
  remainingVertices.push({ id: mergedId, label: mergedLabel, x: midX, y: midY })

  const redirectedEdges: GraphEdge[] = []
  const seenKeys = new Set<string>()
  const notes: string[] = []

  for (const e of before.edges) {
    const newSrc = e.source === uId || e.source === vId ? mergedId : e.source
    const newTgt = e.target === uId || e.target === vId ? mergedId : e.target
    if (newSrc === newTgt) {
      notes.push(`La arista interna (${u.label}, ${v.label}) se contrae (se omite el bucle en grafo simple).`)
      continue
    }
    const key = canonicalEdgeKey(newSrc, newTgt, before.directed)
    if (seenKeys.has(key)) {
      notes.push(`Se unifican aristas paralelas repetidas hacia el mismo vecino en una sola arista simple.`)
      continue
    }
    seenKeys.add(key)
    redirectedEdges.push({
      id: e.id,
      source: newSrc,
      target: newTgt,
      weight: e.weight,
    })
  }

  const after: GraphData = {
    ...before,
    vertices: remainingVertices,
    edges: normalizeEdgeLabels(redirectedEdges),
  }

  const steps: GraphAlgorithmStep[] = [
    {
      title: `Paso 1: Seleccionar vértices ${u.label} y ${v.label} a fusionar`,
      description: `Identificamos todas las aristas incidentes a ${u.label} y a ${v.label}. Cualquier arista entre ${u.label} y ${v.label} se contraerá, y las demás se redirigirán al nuevo súper-vértice ${mergedLabel}.`,
      formula: `V' = (V \\ {${u.label}, ${v.label}}) ∪ {${mergedLabel}}`,
      overrideGraph: before,
      vertexStates: vStates1,
      edgeStates: eStates1,
    },
    {
      title: `Paso 2: Nuevo vértice fusionado ${mergedLabel}`,
      description: `${u.label} y ${v.label} se han fusionado en ${mergedLabel}, heredando la unión de sus vecindades en un grafo simple.`,
      formula: `N(${mergedLabel}) = (N(${u.label}) ∪ N(${v.label})) \\ {${u.label}, ${v.label}}`,
      detailList: notes.length > 0 ? notes : [`Todas las aristas incidentes se reconectaron limpiamente a ${mergedLabel}.`],
      overrideGraph: after,
      vertexStates: { [mergedId]: { status: "merged", badge: "Fusionado" } },
    },
  ]

  return { steps, nextGraph: after }
}

export function runComplementSteps(
  graph: GraphData
): { steps: GraphAlgorithmStep[]; nextGraph: GraphData } {
  const before = cloneGraph(graph)
  const vertices = before.vertices
  const n = vertices.length
  const directed = before.directed

  const complementEdges: GraphEdge[] = []
  let idx = 1

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      if (!directed && i > j) continue
      const u = vertices[i].id
      const v = vertices[j].id
      const exists = before.edges.some((e) => edgeConnects(e, u, v, directed))
      if (!exists) {
        complementEdges.push({
          id: `comp_e${idx++}`,
          source: u,
          target: v,
          weight: 1,
        })
      }
    }
  }

  // Grafo intermedio mostrando ambas: originales (rojo tenue) y faltantes de Kn (verde punteado)
  const combinedEdges = [
    ...before.edges.map((e) => ({ ...e, id: `orig_${e.id}` })),
    ...complementEdges,
  ]
  const midEdgeStates: Record<string, EdgeVisualState> = {}
  before.edges.forEach((e) => {
    midEdgeStates[`orig_${e.id}`] = { status: "rejected", dimmed: true } as any
  })
  complementEdges.forEach((e) => {
    midEdgeStates[e.id] = { status: "complement", dashed: true, thick: true }
  })

  const maxEdges = directed ? n * (n - 1) : (n * (n - 1)) / 2
  const after: GraphData = {
    directed,
    weighted: false,
    vertices: vertices.map((v) => ({ ...v })),
    edges: normalizeEdgeLabels(complementEdges),
  }

  const afterEdgeStates: Record<string, EdgeVisualState> = {}
  after.edges.forEach((e) => {
    afterEdgeStates[e.id] = { status: "accepted", thick: true }
  })

  const steps: GraphAlgorithmStep[] = [
    {
      title: `Paso 1: Grafo Original G (${before.edges.length} de ${maxEdges} aristas posibles en K_${n})`,
      description: `Un grafo simple de ${n} vértices puede tener hasta ${maxEdges} aristas (${
        directed ? "n(n-1)" : "n(n-1)/2"
      }). Actualmente G posee ${before.edges.length} aristas.`,
      formula: `|E(K_${n})| = ${maxEdges},   |E(G)| = ${before.edges.length}  ⇒  |E(G̅)| = ${maxEdges - before.edges.length}`,
      overrideGraph: before,
    },
    {
      title: "Paso 2: Contraste con el Grafo Completo Kₙ",
      description:
        "En verde punteado aparecen los pares de vértices NO adyacentes en G (que pasarán a formar el complemento G̅), mientras en rojo se marcan las aristas actuales que desaparecerán.",
      formula: "E(G̅) = E(Kₙ) \\ E(G) = { (u, v) : u ≠ v  ∧  (u, v) ∉ E(G) }",
      overrideGraph: { ...before, edges: combinedEdges },
      edgeStates: midEdgeStates,
    },
    {
      title: `Paso 3: Grafo Complemento G̅ (${after.edges.length} aristas)`,
      description: `Se obtiene el grafo complemento G̅ conservando exactamente los mismos vértices V(G) e invirtiendo todas las adyacencias.`,
      formula: `V(G̅) = V(G),   |E(G̅)| = ${after.edges.length}`,
      overrideGraph: after,
      edgeStates: afterEdgeStates,
    },
  ]

  return { steps, nextGraph: after }
}
