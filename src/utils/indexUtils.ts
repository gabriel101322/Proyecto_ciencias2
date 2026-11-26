export interface IndexCalcParams {
  r: number // Número de registros de datos
  B: number // Bytes por bloque
  R: number // Bytes por registro de datos
  Ri: number // Bytes por registro de índice (V + P)
  indexType: "primario" | "secundario" // "primario" (no denso) | "secundario" (denso)
  mode: "un_nivel" | "multinivel"
}

export interface MultilevelLevel {
  level: number
  entries: number
  blocks: number
  formula: string
  substitution: string
}

export interface IndexCalcResults {
  params: IndexCalcParams
  bfr: number // floor(B / R)
  b: number // ceil(r / bfr)
  bfri: number // floor(B / Ri)
  ri: number // ri = b (primario) | ri = r (secundario)
  bi: number // ceil(ri / bfri)
  levels: MultilevelLevel[] // para multinivel
  accessesWithoutIndex: number // ceil(log2(b))
  accessesWithoutIndexExact: number
  accessesWithIndex: number
  accessesWithIndexExact: number
  summaryText: string
}

export function calculateIndexStructure(params: IndexCalcParams): IndexCalcResults | null {
  const { r, B, R, Ri, indexType, mode } = params

  if (r <= 0 || B <= 0 || R <= 0 || Ri <= 0) {
    return null
  }

  // 1. Factor de bloqueo de datos
  const bfr = Math.floor(B / R)
  if (bfr <= 0) return null

  // 2. Número de bloques del archivo de datos
  const b = Math.ceil(r / bfr)

  // 3. Factor de bloqueo de índice
  const bfri = Math.floor(B / Ri)
  if (bfri <= 0) return null

  // 4. Número de entradas de índice
  const ri = indexType === "primario" ? b : r

  // 5. Número de bloques de índice (primer nivel)
  const bi = Math.ceil(ri / bfri)

  // 6. Accesos sin índice: ceil(log2(b))
  const log2b = Math.log2(b)
  const accessesWithoutIndexExact = log2b
  const accessesWithoutIndex = Math.ceil(log2b)

  // 7. Niveles para multinivel
  const levels: MultilevelLevel[] = []
  let currentBlocks = bi
  let currentEntries = ri
  let levelNum = 1

  levels.push({
    level: 1,
    entries: currentEntries,
    blocks: currentBlocks,
    formula: `bi₁ = ⌈ri / bfri⌉`,
    substitution: `⌈${currentEntries} / ${bfri}⌉ = ${currentBlocks}`,
  })

  if (mode === "multinivel") {
    while (currentBlocks > 1 && levelNum < 15) {
      levelNum++
      currentEntries = currentBlocks
      currentBlocks = Math.ceil(currentEntries / bfri)
      levels.push({
        level: levelNum,
        entries: currentEntries,
        blocks: currentBlocks,
        formula: `bi${levelNum} = ⌈bi${levelNum - 1} / bfri⌉`,
        substitution: `⌈${currentEntries} / ${bfri}⌉ = ${currentBlocks}`,
      })
    }
  }

  // 8. Accesos con índice
  let accessesWithIndex = 0
  let accessesWithIndexExact = 0

  if (mode === "un_nivel") {
    const log2bi = Math.log2(bi)
    accessesWithIndexExact = log2bi
    accessesWithIndex = Math.ceil(log2bi) + 1
  } else {
    // En multinivel: t accesos a niveles de índice + 1 acceso a datos
    accessesWithIndex = levels.length + 1
    accessesWithIndexExact = levels.length
  }

  // 9. Texto resumen (banner)
  let summaryText = ""
  if (indexType === "primario") {
    summaryText = `Índice Primario (no denso): ri = b = ${b} (una entrada por bloque de datos). bfri = ⌊${B}/${Ri}⌋ = ${bfri} registros índice/bloque → bi = ⌈${ri}/${bfri}⌉ = ${bi} bloques de índice.`
  } else {
    summaryText = `Índice Secundario (denso): ri = r = ${r} (una entrada por registro de datos). bfri = ⌊${B}/${Ri}⌋ = ${bfri} registros índice/bloque → bi = ⌈${ri}/${bfri}⌉ = ${bi} bloques de índice.`
  }

  return {
    params,
    bfr,
    b,
    bfri,
    ri,
    bi,
    levels,
    accessesWithoutIndex,
    accessesWithoutIndexExact,
    accessesWithIndex,
    accessesWithIndexExact,
    summaryText,
  }
}
