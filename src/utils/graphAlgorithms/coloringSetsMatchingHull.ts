import {
  EdgeVisualState,
  GraphAlgorithmStep,
  GraphData,
  GraphVertex,
  MatrixDisplayData,
  RayLine,
  VertexVisualState,
} from "../../types/graphTypes"

function buildUndirectedAdj(graph: GraphData): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  graph.vertices.forEach((v) => adj.set(v.id, new Set()))
  graph.edges.forEach((e) => {
    if (e.source === e.target) return
    adj.get(e.source)?.add(e.target)
    adj.get(e.target)?.add(e.source)
  })
  return adj
}

// ── 1. COLOREADO (PRIMER COLOR LIBRE) Y PARTICIONAMIENTO ────────────────────
const COLOR_NAMES = [
  "C₁ (Terracota)",
  "C₂ (Esmeralda)",
  "C₃ (Azul Real)",
  "C₄ (Ámbar)",
  "C₅ (Violeta)",
  "C₆ (Coral)",
  "C₇ (Turquesa)",
  "C₈ (Oliva)",
]

export function runGreedyColoringSteps(
  graph: GraphData,
  orderMode: "natural" | "welsh_powell" = "natural"
): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  if (vertices.length === 0) return steps

  const adj = buildUndirectedAdj(graph)
  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))

  const ordered = [...vertices]
  if (orderMode === "welsh_powell") {
    ordered.sort((a, b) => {
      const diff = (adj.get(b.id)?.size ?? 0) - (adj.get(a.id)?.size ?? 0)
      return diff !== 0 ? diff : a.label.localeCompare(b.label)
    })
  }

  const assignedColor: Record<string, number> = {}

  steps.push({
    title: `Paso 0: Orden de Recorrido (${
      orderMode === "welsh_powell" ? "Welsh-Powell: Grado Descendente" : "Orden Natural de Vértices"
    })`,
    description: `Recorreremos los vértices en la secuencia [${ordered
      .map((v) => `${v.label}(d=${adj.get(v.id)?.size ?? 0})`)
      .join(", ")}]. A cada vértice le asignaremos el primer color libre C₁, C₂, … que no esté usado por ninguno de sus vecinos.`,
    formula: "color(v) = mín { k ≥ 1 : ∀ u ∈ N(v), color(u) ≠ k }",
  })

  ordered.forEach((v, stepIdx) => {
    const neighborIds = Array.from(adj.get(v.id) ?? [])
    const usedColors = new Set<number>()
    const usedNotes: string[] = []

    neighborIds.forEach((nbId) => {
      if (assignedColor[nbId] !== undefined) {
        usedColors.add(assignedColor[nbId])
        usedNotes.push(`${labelOf.get(nbId)} usa C${assignedColor[nbId]}`)
      }
    })

    let c = 1
    while (usedColors.has(c)) c++
    assignedColor[v.id] = c

    // Particiones actuales
    const partitions = new Map<number, string[]>()
    Object.entries(assignedColor).forEach(([id, col]) => {
      if (!partitions.has(col)) partitions.set(col, [])
      partitions.get(col)!.push(labelOf.get(id) ?? id)
    })

    const vStates: Record<string, VertexVisualState> = {}
    vertices.forEach((node) => {
      const col = assignedColor[node.id]
      vStates[node.id] = {
        status: node.id === v.id ? "active" : col ? "visited" : "default",
        colorIndex: col,
        badge: col ? `C${col}` : undefined,
        subBadge: `d=${adj.get(node.id)?.size ?? 0}`,
      }
    })

    const eStates: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      const touchesV = e.source === v.id || e.target === v.id
      eStates[e.id] = touchesV ? { status: "exploring", thick: true } : { status: "default" }
    })

    steps.push({
      title: `Paso ${stepIdx + 1}: Colorear vértice ${v.label} → Asignado C${c}`,
      description:
        usedNotes.length > 0
          ? `Sus vecinos ya coloreados ocupan [${usedNotes.join(", ")}]. Por lo tanto, el primer color libre disponible para ${v.label} es C${c}.`
          : `Ninguno de los vecinos de ${v.label} tiene color asignado todavía. Se le asigna el primer color C₁.`,
      formula: `Colores prohibidos en N(${v.label}) = { ${
        Array.from(usedColors)
          .sort((a, b) => a - b)
          .map((x) => `C${x}`)
          .join(", ") || "∅"
      } }  ⇒  Primer libre = C${c}`,
      vertexStates: vStates,
      edgeStates: eStates,
      badgeGroups: Array.from(partitions.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([colIdx, members]) => ({
          title: COLOR_NAMES[colIdx - 1] ?? `Color C${colIdx}`,
          items: members,
          tone: "primary",
        })),
    })
  })

  const maxColor = Math.max(...Object.values(assignedColor), 0)
  const finalPartitions = new Map<number, string[]>()
  Object.entries(assignedColor).forEach(([id, col]) => {
    if (!finalPartitions.has(col)) finalPartitions.set(col, [])
    finalPartitions.get(col)!.push(labelOf.get(id) ?? id)
  })

  const finalV: Record<string, VertexVisualState> = {}
  vertices.forEach((v) => {
    finalV[v.id] = {
      status: "visited",
      colorIndex: assignedColor[v.id],
      badge: `C${assignedColor[v.id]}`,
    }
  })

  steps.push({
    title: `Resultado: Coloración Propia y Particionamiento en ${maxColor} Clases`,
    description: `El grafo quedó particionado en ${maxColor} subconjuntos disjuntos V = ${Array.from(
      finalPartitions.keys()
    )
      .sort((a, b) => a - b)
      .map((k) => `V_${k}`)
      .join(" ⊔ ")}. Cada partición Vᵢ es un conjunto independiente (sin aristas internas).`,
    formula: `Partición cromática: ${Array.from(finalPartitions.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([k, list]) => `V_${k} = {${list.join(", ")}}`)
      .join("  |  ")}`,
    vertexStates: finalV,
    badgeGroups: Array.from(finalPartitions.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([colIdx, members]) => ({
        title: `Partición V_${colIdx} (C${colIdx})`,
        items: members,
        tone: "green",
      })),
    summaryCards: [
      { label: "Colores Usados", value: `${maxColor} colores`, accent: "ok" },
      { label: "Particiones Independientes", value: `${finalPartitions.size} clases`, accent: "info" },
    ],
  })

  return steps
}

// ── 2. POLINOMIO CROMÁTICO P(G, k) (ELIMINACIÓN - CONTRACCIÓN) ──────────────
// Polinomio representado como arreglo de coeficientes: poly[i] = coef de k^i
function polySub(a: number[], b: number[]): number[] {
  const len = Math.max(a.length, b.length)
  const out = Array(len).fill(0)
  for (let i = 0; i < len; i++) out[i] = (a[i] ?? 0) - (b[i] ?? 0)
  while (out.length > 1 && out[out.length - 1] === 0) out.pop()
  return out
}

function polyMul(a: number[], b: number[]): number[] {
  const out = Array(a.length + b.length - 1).fill(0)
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] += a[i] * b[j]
    }
  }
  while (out.length > 1 && out[out.length - 1] === 0) out.pop()
  return out
}

// Polinomio de grafo completo Kn: k(k-1)(k-2)...(k-n+1)
function polyComplete(n: number): number[] {
  let res = [1]
  for (let i = 0; i < n; i++) {
    res = polyMul(res, [-i, 1]) // *(k - i)
  }
  return res
}

// Polinomio de árbol con n vértices: k*(k-1)^(n-1)
function polyTree(n: number): number[] {
  if (n <= 0) return [1]
  let res = [0, 1] // k
  for (let i = 1; i < n; i++) {
    res = polyMul(res, [-1, 1]) // *(k - 1)
  }
  return res
}

function evalPoly(poly: number[], k: number): number {
  let sum = 0
  let p = 1
  for (let i = 0; i < poly.length; i++) {
    sum += poly[i] * p
    p *= k
  }
  return sum
}

function formatPoly(poly: number[]): string {
  const terms: string[] = []
  for (let deg = poly.length - 1; deg >= 0; deg--) {
    const c = poly[deg]
    if (c === 0) continue
    const absC = Math.abs(c)
    const sign = c < 0 ? " - " : terms.length > 0 ? " + " : ""
    const varPart = deg === 0 ? "" : deg === 1 ? "k" : `k^${deg}`
    const coefPart = absC === 1 && deg > 0 ? "" : String(absC)
    terms.push(`${sign}${coefPart}${varPart}`)
  }
  return terms.length > 0 ? terms.join("").trim() : "0"
}

interface SimpleEdgePair {
  u: number
  v: number
}

function computeChromaticPolyExact(
  numV: number,
  edges: SimpleEdgePair[],
  traceLog: string[],
  maxTrace = 14
): number[] {
  if (numV === 0) return [1]
  if (edges.length === 0) {
    const out = Array(numV + 1).fill(0)
    out[numV] = 1
    return out // k^n
  }

  // Caso base: Grafo completo Kn
  const maxPossible = (numV * (numV - 1)) / 2
  if (edges.length === maxPossible) {
    if (traceLog.length < maxTrace) {
      traceLog.push(`Subgrafo completo K_${numV} detectado ⇒ k${Array.from({ length: numV - 1 }, (_, i) => `(k-${i + 1})`).join("")}`)
    }
    return polyComplete(numV)
  }

  // Verificar componentes conexas para factorizar y árboles
  const adj: number[][] = Array.from({ length: numV }, () => [])
  edges.forEach(({ u, v }) => {
    adj[u].push(v)
    adj[v].push(u)
  })
  const visited = Array(numV).fill(false)
  const comps: number[][] = []
  for (let i = 0; i < numV; i++) {
    if (!visited[i]) {
      const q = [i]
      visited[i] = true
      const comp: number[] = []
      while (q.length > 0) {
        const curr = q.shift()!
        comp.push(curr)
        for (const nb of adj[curr]) {
          if (!visited[nb]) {
            visited[nb] = true
            q.push(nb)
          }
        }
      }
      comps.push(comp)
    }
  }

  if (comps.length > 1) {
    let prod = [1]
    for (const comp of comps) {
      if (comp.length === 1) {
        prod = polyMul(prod, [0, 1]) // vértice aislado multiplica por k
      } else {
        const mapIdx = new Map(comp.map((oldV, newIdx) => [oldV, newIdx]))
        const subEdges: SimpleEdgePair[] = []
        for (const e of edges) {
          if (mapIdx.has(e.u) && mapIdx.has(e.v)) {
            const nu = mapIdx.get(e.u)!
            const nv = mapIdx.get(e.v)!
            subEdges.push({ u: Math.min(nu, nv), v: Math.max(nu, nv) })
          }
        }
        prod = polyMul(prod, computeChromaticPolyExact(comp.length, subEdges, traceLog, maxTrace))
      }
    }
    return prod
  }

  // El grafo es conexo: si |E| == |V| - 1, es un Árbol!
  if (edges.length === numV - 1) {
    if (traceLog.length < maxTrace) {
      traceLog.push(`Subgrafo conexo acíclico (Árbol T_${numV}) ⇒ k(k - 1)^${numV - 1}`)
    }
    return polyTree(numV)
  }

  // Paso recursivo: Eliminación - Contracción en la última arista e = (u, v)
  const chosen = edges[edges.length - 1]
  const minusEdges = edges.slice(0, -1)

  // Contraer chosen.v dentro de chosen.u y reindexar
  const mapContract = (x: number) => {
    if (x === chosen.v) return chosen.u
    return x > chosen.v ? x - 1 : x
  }
  const seen = new Set<string>()
  const contractEdges: SimpleEdgePair[] = []
  for (const e of minusEdges) {
    const a = mapContract(e.u)
    const b = mapContract(e.v)
    if (a === b) continue
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const key = `${lo}-${hi}`
    if (!seen.has(key)) {
      seen.add(key)
      contractEdges.push({ u: lo, v: hi })
    }
  }

  if (traceLog.length < maxTrace) {
    traceLog.push(
      `Reducción en arista (n=${numV}, m=${edges.length}): P(G,k) = P(G - e, k) [m=${minusEdges.length}]  −  P(G / e, k) [n=${numV - 1}, m=${contractEdges.length}]`
    )
  }

  const pDelete = computeChromaticPolyExact(numV, minusEdges, traceLog, maxTrace)
  const pContract = computeChromaticPolyExact(numV - 1, contractEdges, traceLog, maxTrace)
  return polySub(pDelete, pContract)
}

export function runChromaticPolynomialSteps(graph: GraphData): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const n = vertices.length
  if (n === 0) return steps

  // Simplificar aristas no dirigidas sin bucles ni duplicadas
  const idxOf = new Map(vertices.map((v, i) => [v.id, i]))
  const seen = new Set<string>()
  const simpleEdges: SimpleEdgePair[] = []
  graph.edges.forEach((e) => {
    const u = idxOf.get(e.source)
    const v = idxOf.get(e.target)
    if (u === undefined || v === undefined || u === v) return
    const lo = Math.min(u, v)
    const hi = Math.max(u, v)
    const key = `${lo}-${hi}`
    if (!seen.has(key)) {
      seen.add(key)
      simpleEdges.push({ u: lo, v: hi })
    }
  })

  if (simpleEdges.length > 18 && simpleEdges.length < (n * (n - 1)) / 2) {
    steps.push({
      title: "Grafo denso (> 18 aristas): Recomendación pedagógica",
      description:
        "El método exacto de Eliminación-Contracción duplica subproblemas por arista. Reduce las aristas a ≤ 18 para ver el árbol de reducción algebraica paso a paso.",
      summaryCards: [{ label: "Aristas actuales", value: String(simpleEdges.length), accent: "warn" }],
    })
    return steps
  }

  const traceLog: string[] = []
  const poly = computeChromaticPolyExact(n, simpleEdges, traceLog)
  const polyStr = formatPoly(poly)

  // Paso 1: Explicar el Teorema de Eliminación-Contracción en la primera arista
  const firstEdge = graph.edges[0]
  const eStates1: Record<string, EdgeVisualState> = {}
  if (firstEdge) eStates1[firstEdge.id] = { status: "exploring", thick: true }

  steps.push({
    title: "Paso 1: Teorema de Eliminación–Contracción",
    description:
      "Para cualquier arista e = (u, v) del grafo G, el número de k-coloraciones propias satisface P(G, k) = P(G − e, k) − P(G / e, k), donde G − e elimina la arista y G / e fusiona sus extremos u y v.",
    formula: "P(G, k) = P(G − e, k) − P(G / e, k)   |   Casos base: P(K̅ₙ, k) = kⁿ,  P(Tₙ, k) = k(k−1)ⁿ⁻¹",
    edgeStates: eStates1,
    detailList: traceLog.length > 0 ? traceLog : ["El grafo ya corresponde directamente a un caso base."],
  })

  // Paso 2: Mostrar Polinomio Expandido y Tabla de Evaluación k = 1..6
  const kValues = [1, 2, 3, 4, 5, 6]
  const evaluations = kValues.map((k) => ({ k, val: evalPoly(poly, k) }))
  const chromaticNum = evaluations.find((ev) => ev.val > 0)?.k ?? n

  const evalMatrix: MatrixDisplayData = {
    id: "chrom-poly-eval",
    title: "Evaluación de P(G, k) para k colores disponibles",
    subtitle: "El menor entero k con P(G, k) > 0 determina exactamente el Número Cromático χ(G).",
    rowHeaders: ["Nº de colores (k)", "Formas válidas P(G, k)", "¿Es coloreable?"],
    colHeaders: kValues.map((k) => `k = ${k}`),
    cells: [
      kValues.map((k) => ({
        value: k,
        highlight: k === chromaticNum ? "pivot" : undefined,
      })),
      evaluations.map((ev) => ({
        value: ev.val,
        highlight: ev.k === chromaticNum ? "updated" : ev.val === 0 ? "negative" : "positive",
      })),
      evaluations.map((ev) => ({
        value: ev.val > 0 ? (ev.k === chromaticNum ? "✓ Mínimo χ(G)" : "✓ Sí") : "✗ Imposible",
        highlight: ev.k === chromaticNum ? "updated" : undefined,
      })),
    ],
  }

  steps.push({
    title: `Paso 2: Polinomio Cromático Exacto y Número Cromático χ(G) = ${chromaticNum}`,
    description: `Al reducir y agrupar términos semejantes obtenemos P(G, k) = ${polyStr}. Evaluando en k = 1, 2, …, vemos que con k = ${chromaticNum} colores existen exactamente ${
      evalPoly(poly, chromaticNum)
    } coloraciones válidas distintas.`,
    formula: `P(G, k) = ${polyStr}   ⇒   χ(G) = ${chromaticNum}`,
    matrices: [evalMatrix],
    summaryCards: [
      { label: "Polinomio P(G, k)", value: polyStr, accent: "info" },
      { label: "Número Cromático χ(G)", value: `${chromaticNum}`, accent: "ok" },
      { label: `Formas con k=${chromaticNum}`, value: `${evalPoly(poly, chromaticNum)}`, accent: "ok" },
    ],
  })

  return steps
}

// ── 3. CONJUNTOS INDEPENDIENTES MÁXIMOS Y DOMINANTES MÍNIMOS ────────────────
export function runMaxIndependentSetSteps(graph: GraphData): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const n = vertices.length
  if (n === 0) return steps

  const adj = buildUndirectedAdj(graph)
  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))

  // Encontrar todos los conjuntos independientes maximales (Bron-Kerbosch sobre el complemento / backtracking)
  const maximalSets: string[][] = []
  const isIndependent = (subset: string[]) => {
    for (let i = 0; i < subset.length; i++) {
      for (let j = i + 1; j < subset.length; j++) {
        if (adj.get(subset[i])?.has(subset[j])) return false
      }
    }
    return true
  }

  if (n <= 18) {
    const backtrack = (idx: number, current: string[], blocked: Set<string>) => {
      if (idx === n) {
        // Verificar si es maximal (ningún vértice fuera puede agregarse)
        const canExtend = vertices.some(
          (v) =>
            !current.includes(v.id) &&
            current.every((u) => !adj.get(u)?.has(v.id))
        )
        if (!canExtend && current.length > 0) {
          maximalSets.push([...current])
        }
        return
      }
      const v = vertices[idx]
      if (!blocked.has(v.id)) {
        const nextBlocked = new Set(blocked)
        nextBlocked.add(v.id)
        adj.get(v.id)?.forEach((nb) => nextBlocked.add(nb))
        current.push(v.id)
        backtrack(idx + 1, current, nextBlocked)
        current.pop()
      }
      backtrack(idx + 1, current, blocked)
    }
    backtrack(0, [], new Set())
  } else {
    // Heurística voraz para grafos muy grandes
    const cur: string[] = []
    const blk = new Set<string>()
    ;[...vertices]
      .sort((a, b) => (adj.get(a.id)?.size ?? 0) - (adj.get(b.id)?.size ?? 0))
      .forEach((v) => {
        if (!blk.has(v.id)) {
          cur.push(v.id)
          blk.add(v.id)
          adj.get(v.id)?.forEach((nb) => blk.add(nb))
        }
      })
    if (isIndependent(cur)) maximalSets.push(cur)
  }

  maximalSets.sort((a, b) => b.length - a.length)
  const bestSet = maximalSets[0] ?? []
  const alpha = bestSet.length

  steps.push({
    title: "Paso 1: Concepto de Conjunto Independiente (Estabilidad Interna)",
    description:
      "Un subconjunto S ⊆ V es independiente si ningún par de vértices en S está unido por una arista. Cada vez que incluimos un vértice v en S, todos sus vecinos directos N(v) quedan bloqueados.",
    formula: "S ⊆ V es independiente  ⇔  ∀ u, v ∈ S,  (u, v) ∉ E",
  })

  // Animar cómo se construye el Conjunto Independiente Máximo vértice a vértice
  const built: string[] = []
  const blockedSoFar = new Set<string>()

  bestSet.forEach((vId, idx) => {
    built.push(vId)
    const newlyBlocked: string[] = []
    adj.get(vId)?.forEach((nb) => {
      if (!blockedSoFar.has(nb) && !built.includes(nb)) {
        blockedSoFar.add(nb)
        newlyBlocked.push(labelOf.get(nb) ?? nb)
      }
    })

    const vStates: Record<string, VertexVisualState> = {}
    vertices.forEach((node) => {
      if (node.id === vId) {
        vStates[node.id] = { status: "selected", badge: `En S (#${idx + 1})` }
      } else if (built.includes(node.id)) {
        vStates[node.id] = { status: "selected", badge: "En S" }
      } else if (blockedSoFar.has(node.id)) {
        vStates[node.id] = { status: "blocked", badge: "Vecino bloq.", dimmed: true }
      } else {
        vStates[node.id] = { status: "default" }
      }
    })

    const eStates: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      if (e.source === vId || e.target === vId) {
        eStates[e.id] = { status: "rejected", dashed: true }
      } else {
        eStates[e.id] = { status: "default" }
      }
    })

    steps.push({
      title: `Paso ${idx + 2}: Incluir ${labelOf.get(vId)} en S → Bloquea vecinos [${newlyBlocked.join(", ") || "ninguno nuevo"}]`,
      description: `Al elegir ${labelOf.get(vId)} ∈ S, prohibimos sus vecinos adyacentes para garantizar que ninguna arista tenga ambos extremos en S.`,
      formula: `S parcial = { ${built.map((id) => labelOf.get(id)).join(", ")} }   |   Bloqueados = { ${
        Array.from(blockedSoFar)
          .map((id) => labelOf.get(id))
          .join(", ") || "∅"
      } }`,
      vertexStates: vStates,
      edgeStates: eStates,
    })
  })

  const finalV: Record<string, VertexVisualState> = {}
  vertices.forEach((node) => {
    finalV[node.id] = bestSet.includes(node.id)
      ? { status: "selected", badge: "∈ S máx" }
      : { status: "blocked", badge: "∉ S", dimmed: true }
  })

  steps.push({
    title: `Resultado Final: Conjunto Independiente Máximo con α(G) = ${alpha}`,
    description: `Se encontraron ${maximalSets.length} conjunto(s) independiente(s) maximal(es). El mayor tamaño posible es el número de independencia α(G) = ${alpha}, alcanzado por S = {${bestSet
      .map((id) => labelOf.get(id))
      .join(", ")}}.`,
    formula: `α(G) = máx |S| = ${alpha}   |   S* = { ${bestSet.map((id) => labelOf.get(id)).join(", ")} }`,
    detailList: maximalSets
      .slice(0, 10)
      .map(
        (s, i) =>
          `Maximal #${i + 1}: { ${s.map((id) => labelOf.get(id)).join(", ")} }  (tamaño ${s.length}${
            s.length === alpha ? " ★ MÁXIMO" : ""
          })`
      ),
    vertexStates: finalV,
    summaryCards: [
      { label: "Nº Independencia α(G)", value: String(alpha), accent: "ok" },
      { label: "Conjunto S*", value: `{ ${bestSet.map((id) => labelOf.get(id)).join(", ")} }`, accent: "ok" },
      { label: "Maximales hallados", value: String(maximalSets.length), accent: "info" },
    ],
  })

  return steps
}

export function runMinDominatingSetSteps(graph: GraphData): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const n = vertices.length
  if (n === 0) return steps

  const adj = buildUndirectedAdj(graph)
  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))

  const dominatesAll = (subset: string[]): boolean => {
    const covered = new Set<string>(subset)
    subset.forEach((u) => adj.get(u)?.forEach((nb) => covered.add(nb)))
    return covered.size === n
  }

  const minimalSets: string[][] = []
  if (n <= 16) {
    // Búsqueda por tamaño creciente k = 1..n para hallar todos los dominantes minimales
    const totalMasks = 1 << n
    const validMasks: number[] = []
    for (let mask = 1; mask < totalMasks; mask++) {
      const sub: string[] = []
      for (let b = 0; b < n; b++) {
        if ((mask & (1 << b)) !== 0) sub.push(vertices[b].id)
      }
      if (dominatesAll(sub)) {
        // Es minimal si ninguna submáscara propia ya era dominante
        const hasProperSub = validMasks.some((prevMask) => (prevMask & mask) === prevMask)
        if (!hasProperSub) {
          validMasks.push(mask)
          minimalSets.push(sub)
        }
      }
    }
  } else {
    // Voraz para grafos mayores
    const uncovered = new Set(vertices.map((v) => v.id))
    const chosen: string[] = []
    while (uncovered.size > 0) {
      let bestId = vertices[0].id
      let bestGain = -1
      for (const v of vertices) {
        let gain = uncovered.has(v.id) ? 1 : 0
        adj.get(v.id)?.forEach((nb) => {
          if (uncovered.has(nb)) gain++
        })
        if (gain > bestGain) {
          bestGain = gain
          bestId = v.id
        }
      }
      chosen.push(bestId)
      uncovered.delete(bestId)
      adj.get(bestId)?.forEach((nb) => uncovered.delete(nb))
    }
    minimalSets.push(chosen)
  }

  minimalSets.sort((a, b) => a.length - b.length)
  const bestDom = minimalSets[0] ?? []
  const gamma = bestDom.length

  steps.push({
    title: "Paso 1: Concepto de Conjunto Dominante (Estabilidad Externa)",
    description:
      "Un subconjunto D ⊆ V es dominante si todo vértice del grafo pertenece a D o es vecino directo de al menos un vértice de D (es decir, N[D] = V). Buscamos el de menor tamaño posible γ(G).",
    formula: "D ⊆ V es dominante  ⇔  N[D] = D ∪ (⋃_{u∈D} N(u)) = V",
  })

  const currentD: string[] = []
  const coveredSet = new Set<string>()

  bestDom.forEach((uId, idx) => {
    currentD.push(uId)
    coveredSet.add(uId)
    const newlyCovered: string[] = []
    adj.get(uId)?.forEach((nb) => {
      if (!coveredSet.has(nb)) newlyCovered.push(labelOf.get(nb) ?? nb)
      coveredSet.add(nb)
    })

    const vStates: Record<string, VertexVisualState> = {}
    vertices.forEach((v) => {
      if (currentD.includes(v.id)) {
        vStates[v.id] = { status: "source", badge: "Dominante ∈ D" }
      } else if (coveredSet.has(v.id)) {
        vStates[v.id] = { status: "dominated", badge: "Cubierto" }
      } else {
        vStates[v.id] = { status: "default", badge: "Sin cubrir" }
      }
    })

    const eStates: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      const covers =
        (currentD.includes(e.source) && !currentD.includes(e.target)) ||
        (currentD.includes(e.target) && !currentD.includes(e.source))
      eStates[e.id] = covers ? { status: "accepted", thick: true } : { status: "default" }
    })

    steps.push({
      title: `Paso ${idx + 2}: Seleccionar ${labelOf.get(uId)} en D → Cobertura ${coveredSet.size}/${n} vértices`,
      description: `El vértice ${labelOf.get(uId)} se domina a sí mismo y cubre a sus vecinos [${Array.from(
        adj.get(uId) ?? []
      )
        .map((id) => labelOf.get(id))
        .join(", ") || "ninguno"}].`,
      formula: `D = { ${currentD.map((id) => labelOf.get(id)).join(", ")} }   ⇒   N[D] cubre { ${Array.from(
        coveredSet
      )
        .map((id) => labelOf.get(id))
        .join(", ")} }`,
      vertexStates: vStates,
      edgeStates: eStates,
    })
  })

  const finalV: Record<string, VertexVisualState> = {}
  vertices.forEach((v) => {
    finalV[v.id] = bestDom.includes(v.id)
      ? { status: "source", badge: "∈ D mín" }
      : { status: "dominated", badge: "Dominado" }
  })
  const finalE: Record<string, EdgeVisualState> = {}
  graph.edges.forEach((e) => {
    const covers = bestDom.includes(e.source) || bestDom.includes(e.target)
    finalE[e.id] = covers ? { status: "accepted", thick: true } : { status: "dimmed" }
  })

  steps.push({
    title: `Resultado Final: Conjunto Dominante Mínimo con γ(G) = ${gamma}`,
    description: `Con solo ${gamma} vértice(s) en D* = {${bestDom
      .map((id) => labelOf.get(id))
      .join(", ")}} quedan cubiertos la totalidad de los ${n} vértices del grafo.`,
    formula: `γ(G) = mín |D| = ${gamma}   |   D* = { ${bestDom.map((id) => labelOf.get(id)).join(", ")} }`,
    detailList: minimalSets
      .slice(0, 10)
      .map(
        (d, i) =>
          `Minimal #${i + 1}: { ${d.map((id) => labelOf.get(id)).join(", ")} }  (tamaño ${d.length}${
            d.length === gamma ? " ★ MÍNIMO" : ""
          })`
      ),
    vertexStates: finalV,
    edgeStates: finalE,
    summaryCards: [
      { label: "Nº Dominación γ(G)", value: String(gamma), accent: "ok" },
      { label: "Conjunto D*", value: `{ ${bestDom.map((id) => labelOf.get(id)).join(", ")} }`, accent: "ok" },
      { label: "Minimales hallados", value: String(minimalSets.length), accent: "info" },
    ],
  })

  return steps
}

export function validateCustomVertexSet(
  graph: GraphData,
  selectedIds: string[],
  mode: "independent" | "dominating"
): { valid: boolean; summary: string; detail: string } {
  const adj = buildUndirectedAdj(graph)
  const labelOf = new Map(graph.vertices.map((v) => [v.id, v.label]))
  const names = selectedIds.map((id) => labelOf.get(id) ?? id)

  if (selectedIds.length === 0) {
    return {
      valid: false,
      summary: "Conjunto vacío",
      detail: "Haz clic sobre los vértices del lienzo para añadirlos o quitarlos de tu conjunto de prueba.",
    }
  }

  if (mode === "independent") {
    for (let i = 0; i < selectedIds.length; i++) {
      for (let j = i + 1; j < selectedIds.length; j++) {
        if (adj.get(selectedIds[i])?.has(selectedIds[j])) {
          return {
            valid: false,
            summary: `✗ No es independiente`,
            detail: `Los vértices ${labelOf.get(selectedIds[i])} y ${labelOf.get(selectedIds[j])} son adyacentes (comparten arista).`,
          }
        }
      }
    }
    const extendable = graph.vertices.filter(
      (v) => !selectedIds.includes(v.id) && selectedIds.every((u) => !adj.get(u)?.has(v.id))
    )
    return {
      valid: true,
      summary: `✓ Conjunto Independiente válido (|S| = ${selectedIds.length})`,
      detail:
        extendable.length === 0
          ? `¡Además es MAXIMAL! Ningún otro vértice puede añadirse sin crear adyacencia.`
          : `Es independiente, pero aún no es maximal: podrías agregar ${extendable.map((v) => v.label).join(" o ")}.`,
    }
  } else {
    const covered = new Set<string>(selectedIds)
    selectedIds.forEach((u) => adj.get(u)?.forEach((nb) => covered.add(nb)))
    const missing = graph.vertices.filter((v) => !covered.has(v.id))
    if (missing.length > 0) {
      return {
        valid: false,
        summary: `✗ No es dominante (${covered.size}/${graph.vertices.length} cubiertos)`,
        detail: `Faltan por dominar: { ${missing.map((v) => v.label).join(", ")} }.`,
      }
    }
    return {
      valid: true,
      summary: `✓ Conjunto Dominante válido (|D| = ${names.length})`,
      detail: `N[{${names.join(", ")}}] cubre el 100% de los vértices del grafo.`,
    }
  }
}

// ── 4. PAREAMIENTO MÁXIMO (MAXIMUM MATCHING) ────────────────────────────────
export function runMaxMatchingSteps(graph: GraphData): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const vertices = graph.vertices
  const edges = graph.edges.filter((e) => e.source !== e.target)
  const n = vertices.length
  if (n === 0) return steps

  const labelOf = new Map(vertices.map((v) => [v.id, v.label]))

  steps.push({
    title: "Paso 1: Definición de Pareamiento (Matching)",
    description:
      "Un pareamiento M ⊆ E es un conjunto de aristas sin vértices en común (cada vértice incide a lo sumo en una arista de M). Buscamos maximizar el número de aristas emparejadas ν(G) = |M|.",
    formula: "M ⊆ E es pareamiento  ⇔  ∀ e₁ ≠ e₂ ∈ M,  e₁ ∩ e₂ = ∅",
  })

  // Paso A: Emparejamiento inicial voraz
  const greedyEdgeIds = new Set<string>()
  const usedV = new Set<string>()
  for (const e of edges) {
    if (!usedV.has(e.source) && !usedV.has(e.target)) {
      greedyEdgeIds.add(e.id)
      usedV.add(e.source)
      usedV.add(e.target)
    }
  }

  const buildMatchVisuals = (matchSet: Set<string>, highlightEdges?: Set<string>) => {
    const sat = new Set<string>()
    edges.forEach((e) => {
      if (matchSet.has(e.id)) {
        sat.add(e.source)
        sat.add(e.target)
      }
    })
    const vStates: Record<string, VertexVisualState> = {}
    vertices.forEach((v) => {
      vStates[v.id] = sat.has(v.id)
        ? { status: "selected", badge: "Saturado" }
        : { status: "active", badge: "Libre" }
    })
    const eStates: Record<string, EdgeVisualState> = {}
    graph.edges.forEach((e) => {
      if (highlightEdges?.has(e.id)) {
        eStates[e.id] = { status: "exploring", thick: true, dashed: !matchSet.has(e.id) }
      } else if (matchSet.has(e.id)) {
        eStates[e.id] = { status: "accepted", thick: true }
      } else {
        eStates[e.id] = { status: "dimmed" }
      }
    })
    return { vStates, eStates, sat }
  }

  const greedyVis = buildMatchVisuals(greedyEdgeIds)
  steps.push({
    title: `Paso 2: Pareamiento Voraz Inicial (|M| = ${greedyEdgeIds.size})`,
    description: `Seleccionamos inicialmente aristas disjuntas obteniendo ${greedyEdgeIds.size} pareja(s). Quedan ${
      n - greedyVis.sat.size
    } vértice(s) libre(s). Ahora verificamos si existe algún camino de aumento (augmenting path) para incrementar |M|.`,
    formula: `M₀ = { ${edges
      .filter((e) => greedyEdgeIds.has(e.id))
      .map((e) => `(${labelOf.get(e.source)},${labelOf.get(e.target)})`)
      .join(", ") || "∅"} }`,
    vertexStates: greedyVis.vStates,
    edgeStates: greedyVis.eStates,
  })

  // Paso B: Búsqueda exacta del pareamiento máximo en grafo general (branch & bound con poda rápida)
  let bestMatch: string[] = Array.from(greedyEdgeIds)
  const maxPossible = Math.floor(n / 2)

  const searchBest = (eIdx: number, curUsed: Set<string>, curEdges: string[]) => {
    if (curEdges.length > bestMatch.length) {
      bestMatch = [...curEdges]
    }
    if (bestMatch.length === maxPossible || eIdx >= edges.length) return
    const remVertices = n - curUsed.size
    if (curEdges.length + Math.floor(remVertices / 2) <= bestMatch.length) return
    if (curEdges.length + (edges.length - eIdx) <= bestMatch.length) return

    const e = edges[eIdx]
    if (!curUsed.has(e.source) && !curUsed.has(e.target)) {
      curUsed.add(e.source)
      curUsed.add(e.target)
      curEdges.push(e.id)
      searchBest(eIdx + 1, curUsed, curEdges)
      curEdges.pop()
      curUsed.delete(e.source)
      curUsed.delete(e.target)
    }
    searchBest(eIdx + 1, curUsed, curEdges)
  }
  searchBest(0, new Set(), [])

  const bestSet = new Set(bestMatch)

  // Si bestSet mejoró al greedy, mostrar la diferencia simétrica M0 ⊕ M* (camino de aumento!)
  if (bestSet.size > greedyEdgeIds.size) {
    const symDiff = new Set<string>()
    edges.forEach((e) => {
      if (greedyEdgeIds.has(e.id) !== bestSet.has(e.id)) symDiff.add(e.id)
    })
    const augVis = buildMatchVisuals(greedyEdgeIds, symDiff)
    steps.push({
      title: `Paso 3: Camino Alternante de Aumento Detectado (+${bestSet.size - greedyEdgeIds.size} pareja)`,
      description:
        "Al alternar aristas fuera de M₀ (punteadas) y dentro de M₀ (continuas) entre dos vértices libres, invertimos sus estados (M* = M₀ ⊕ P) y logramos emparejar más vértices sin conflictos.",
      formula: "M_nuevo = M_actual ⊕ P   ⇒   |M_nuevo| = |M_actual| + 1",
      vertexStates: augVis.vStates,
      edgeStates: augVis.eStates,
    })
  }

  const finalVis = buildMatchVisuals(bestSet)
  const isPerfect = bestSet.size * 2 === n && n > 0
  const hasIsolated = vertices.some(
    (v) => !edges.some((e) => e.source === v.id || e.target === v.id)
  )
  const edgeCoverNum = !hasIsolated && n > 0 ? n - bestSet.size : null

  steps.push({
    title: `Resultado Final: Pareamiento Máximo ν(G) = ${bestSet.size}${
      isPerfect ? " (¡Pareamiento Perfecto!)" : ""
    }`,
    description: `El mayor conjunto de aristas independientes tiene tamaño ν(G) = ${bestSet.size}, emparejando ${
      bestSet.size * 2
    } de los ${n} vértices.${
      isPerfect
        ? " Como todos los vértices quedaron saturados (2|M| = |V|), constituye un Pareamiento Perfecto."
        : ""
    }${
      edgeCoverNum !== null
        ? ` Por identidad de Gallai (ν(G) + ρ(G) = |V|), el recubrimiento mínimo por aristas es ρ(G) = ${edgeCoverNum}.`
        : ""
    }`,
    formula: `ν(G) = ${bestSet.size}  |  M* = { ${edges
      .filter((e) => bestSet.has(e.id))
      .map((e) => `(${labelOf.get(e.source)}, ${labelOf.get(e.target)})`)
      .join(", ") || "∅"} }`,
    vertexStates: finalVis.vStates,
    edgeStates: finalVis.eStates,
    summaryCards: [
      { label: "Pareamiento Máx ν(G)", value: `${bestSet.size} aristas`, accent: "ok" },
      { label: "¿Es Perfecto?", value: isPerfect ? "Sí (100% saturado)" : `No (${n - bestSet.size * 2} libres)`, accent: isPerfect ? "ok" : "info" },
      ...(edgeCoverNum !== null
        ? [{ label: "Cubierta Aristas ρ(G)", value: `${edgeCoverNum}`, accent: "info" as const }]
        : []),
    ],
  })

  return steps
}

// ── 5. ENVOLVENTE CONVEXA (CONVEX HULL — GRAHAM SCAN) ───────────────────────
const CANVAS_H = 400
// Coordenadas cartesianas matemáticas estándar (X derecha, Y arriba)
const mathX = (v: GraphVertex) => Math.round(v.x)
const mathY = (v: GraphVertex) => Math.round(CANVAS_H - v.y)

function crossProduct(o: GraphVertex, a: GraphVertex, b: GraphVertex): number {
  return (
    (mathX(a) - mathX(o)) * (mathY(b) - mathY(o)) -
    (mathY(a) - mathY(o)) * (mathX(b) - mathX(o))
  )
}

function distSq(a: GraphVertex, b: GraphVertex): number {
  const dx = mathX(a) - mathX(b)
  const dy = mathY(a) - mathY(b)
  return dx * dx + dy * dy
}

export function runConvexHullSteps(graph: GraphData): GraphAlgorithmStep[] {
  const steps: GraphAlgorithmStep[] = []
  const pts = graph.vertices
  if (pts.length < 3) {
    steps.push({
      title: "Se requieren al menos 3 vértices no colineales",
      description:
        "Agrega al menos 3 vértices en el lienzo para construir el polígono de la envolvente convexa.",
      summaryCards: [{ label: "Vértices actuales", value: String(pts.length), accent: "warn" }],
    })
    return steps
  }

  // 1. Elegir pivote P0: menor Y matemática (más abajo en el lienzo), desempate menor X
  let pivot = pts[0]
  for (const p of pts) {
    if (mathY(p) < mathY(pivot) || (mathY(p) === mathY(pivot) && mathX(p) < mathX(pivot))) {
      pivot = p
    }
  }

  // 2. Ordenar por ángulo polar antihorario respecto a P0
  const others = pts
    .filter((p) => p.id !== pivot.id)
    .sort((a, b) => {
      const cp = crossProduct(pivot, a, b)
      if (cp !== 0) return cp > 0 ? -1 : 1
      return distSq(pivot, a) - distSq(pivot, b)
    })

  const vStatesStep1: Record<string, VertexVisualState> = {}
  pts.forEach((p) => {
    vStatesStep1[p.id] = {
      status: p.id === pivot.id ? "source" : "default",
      badge: p.id === pivot.id ? "Pivote P₀" : `(${mathX(p)},${mathY(p)})`,
      subBadge: p.id === pivot.id ? `(${mathX(p)},${mathY(p)})` : undefined,
    }
  })

  const polarRays: RayLine[] = others.map((p, idx) => ({
    x1: pivot.x,
    y1: pivot.y,
    x2: p.x,
    y2: p.y,
    label: `#${idx + 1}`,
    tone: "info",
    dashed: true,
  }))

  steps.push({
    title: `Paso 1: Pivote P₀ = ${pivot.label} y Ordenamiento por Ángulo Polar`,
    description: `Elegimos el punto más bajo P₀ = ${pivot.label}(${mathX(pivot)}, ${mathY(pivot)}) y ordenamos los demás vértices en sentido antihorario según el ángulo polar desde P₀: [${others
      .map((p, i) => `${i + 1}:${p.label}`)
      .join(", ")}].`,
    formula: "cross(O, A, B) = (Ax − Ox)(By − Oy) − (Ay − Oy)(Bx − Ox)",
    vertexStates: vStatesStep1,
    rayLines: polarRays,
  })

  // 3. Escaneo de Graham (Graham Scan)
  const stack: GraphVertex[] = [pivot, others[0]]

  for (let i = 1; i < others.length; i++) {
    const candidate = others[i]

    while (stack.length >= 2) {
      const top = stack[stack.length - 1]
      const second = stack[stack.length - 2]
      const cp = crossProduct(second, top, candidate)

      if (cp <= 0) {
        // Giro horario (derecha) o colineal -> descartamos top porque queda en el interior cóncavo
        const vStatesTurn: Record<string, VertexVisualState> = {}
        pts.forEach((p) => {
          vStatesTurn[p.id] = {
            status:
              p.id === top.id
                ? "removed"
                : p.id === candidate.id
                ? "active"
                : stack.some((s) => s.id === p.id)
                ? "selected"
                : "default",
            badge:
              p.id === top.id
                ? "Giro der. ✗"
                : p.id === candidate.id
                ? "Evaluando"
                : undefined,
          }
        })

        steps.push({
          title: `Giro Horario detectado en ${second.label} → ${top.label} → ${candidate.label} (Descartar ${top.label})`,
          description: `El producto cruz cross(${second.label}, ${top.label}, ${candidate.label}) = ${cp} ≤ 0 indica un giro hacia la derecha (ángulo cóncavo). Por tanto, ${top.label} queda dentro del polígono y se retira de la frontera.`,
          formula: `cross(${second.label}, ${top.label}, ${candidate.label}) = ${cp} ≤ 0  ⇒  Pop(${top.label})`,
          vertexStates: vStatesTurn,
          rayLines: [
            ...stack.slice(0, -1).map((s, idx) => ({
              x1: s.x,
              y1: s.y,
              x2: stack[idx + 1].x,
              y2: stack[idx + 1].y,
              tone: "ok" as const,
            })),
            {
              x1: top.x,
              y1: top.y,
              x2: candidate.x,
              y2: candidate.y,
              label: "Cóncavo ✗",
              tone: "warn",
              dashed: true,
            },
          ],
        })

        stack.pop()
      } else {
        break
      }
    }

    const prevTop = stack[stack.length - 1]
    const prevSecond = stack.length >= 2 ? stack[stack.length - 2] : null
    const cpOk = prevSecond ? crossProduct(prevSecond, prevTop, candidate) : 1
    stack.push(candidate)

    const vStatesPush: Record<string, VertexVisualState> = {}
    pts.forEach((p) => {
      vStatesPush[p.id] = {
        status:
          p.id === candidate.id
            ? "active"
            : stack.some((s) => s.id === p.id)
            ? "selected"
            : "default",
        badge: stack.some((s) => s.id === p.id)
          ? `Frontera #${stack.findIndex((s) => s.id === p.id) + 1}`
          : undefined,
      }
    })

    steps.push({
      title: `Avance Convexo: Aceptar ${candidate.label} en la cadena envolvente`,
      description: prevSecond
        ? `El giro ${prevSecond.label} → ${prevTop.label} → ${candidate.label} tiene producto cruz +${cpOk} > 0 (giro antihorario hacia la izquierda). Mantenemos la convexidad y apilamos ${candidate.label}.`
        : `Agregamos ${candidate.label} a la frontera inicial desde el pivote.`,
      formula: prevSecond
        ? `cross(${prevSecond.label}, ${prevTop.label}, ${candidate.label}) = +${cpOk} > 0  ⇒  Push(${candidate.label})`
        : `Pila = [ ${stack.map((s) => s.label).join(", ")} ]`,
      vertexStates: vStatesPush,
      rayLines: stack.slice(0, -1).map((s, idx) => ({
        x1: s.x,
        y1: s.y,
        x2: stack[idx + 1].x,
        y2: stack[idx + 1].y,
        tone: "ok",
      })),
    })
  }

  const hullIds = new Set(stack.map((s) => s.id))
  const interior = pts.filter((p) => !hullIds.has(p.id))

  const finalV: Record<string, VertexVisualState> = {}
  pts.forEach((p) => {
    const idx = stack.findIndex((s) => s.id === p.id)
    finalV[p.id] =
      idx >= 0
        ? {
            status: "selected",
            badge: `Vértice #${idx + 1}`,
            subBadge: `(${mathX(p)},${mathY(p)})`,
          }
        : {
            status: "dominated",
            badge: "Interior",
            subBadge: `(${mathX(p)},${mathY(p)})`,
          }
  })

  steps.push({
    title: `Resultado Final: Envolvente Convexa Cerrada (${stack.length} vértices en frontera)`,
    description: `Cerramos el polígono uniendo ${stack[stack.length - 1].label} con ${pivot.label}. La envolvente convexa mínima encierra todos los puntos con frontera [${stack
      .map((s) => s.label)
      .join(" → ")} → ${pivot.label}] y deja ${interior.length} vértice(s) en su interior.`,
    formula: `CH(V) = Polígono( ${stack.map((s) => s.label).join(", ")} )   |   Interiores = { ${
      interior.map((p) => p.label).join(", ") || "∅"
    } }`,
    vertexStates: finalV,
    hullPolygon: stack.map((s) => ({ x: s.x, y: s.y, label: s.label, id: s.id })),
    summaryCards: [
      { label: "Frontera Convexa", value: `${stack.length} vértices`, accent: "ok" },
      { label: "Puntos Interiores", value: `${interior.length} vértices`, accent: "info" },
      { label: "Secuencia", value: `${stack.map((s) => s.label).join(" → ")} → ${pivot.label}`, accent: "ok" },
    ],
  })

  return steps
}
