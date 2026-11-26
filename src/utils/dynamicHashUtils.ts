export interface DynamicConfig {
  initialBuckets: number
  recordsPerBucket: number
  expThreshold: number // percentage, e.g. 80 (must be < 100)
  redThreshold: number // percentage, e.g. 70 (must be < expThreshold)
  isPartial: boolean // true = Parciales (+1 cubeta), false = Totales (*2 cubetas)
}

export interface DynamicState {
  config: DynamicConfig
  currentBuckets: number
  keys: string[]
  history: OperationResult[]
}

export interface OperationResult {
  action: string // "Insertó 115", "Eliminó 48"
  doExp: number
  doRed: number
  didExpand: boolean
  didReduce: boolean
  oldBuckets: number
  newBuckets: number
  keysCount: number
  currentCapacity: number
  reducedCapacity: number
  recordsPerBucket: number
  expThreshold: number
  redThreshold: number
  explanation: string
}

// Retorna la matriz de cubetas y registros generada a partir de las llaves
export const generateDynamicTable = (keys: string[], buckets: number): string[][] => {
  const safeBuckets = Math.max(1, buckets)
  const table: string[][] = Array.from({ length: safeBuckets }, () => [])

  for (const key of keys) {
    const k = parseInt(key, 10)
    if (isNaN(k)) continue
    const b = ((k % safeBuckets) + safeBuckets) % safeBuckets
    table[b].push(key)
  }

  return table
}

export const insertDynamicKey = (state: DynamicState, key: string): DynamicState => {
  if (state.keys.includes(key)) {
    return state // Clave ya existente
  }

  const newKeys = [...state.keys, key]
  let currentBuckets = state.currentBuckets
  const oldBuckets = currentBuckets
  const R = Math.max(1, state.config.recordsPerBucket)
  let didExpand = false

  // 1. DO para Expansión con respecto a la capacidad de la tabla actual
  const currentCapacity = currentBuckets * R
  const candidateDoExp = (newKeys.length / currentCapacity) * 100

  // Regla estricta: Jamás debe llegar al 100% antes de expandir.
  // Expande si candidateDoExp >= expThreshold O si el número de claves alcanza o supera la capacidad.
  if (candidateDoExp >= state.config.expThreshold || newKeys.length >= currentCapacity) {
    didExpand = true
    if (state.config.isPartial) {
      currentBuckets += 1
    } else {
      currentBuckets *= 2
    }

    // Asegurar que tras la expansión tampoco quede al 100%
    while (newKeys.length >= currentBuckets * R) {
      if (state.config.isPartial) {
        currentBuckets += 1
      } else {
        currentBuckets *= 2
      }
    }
  }

  const finalCapacity = currentBuckets * R
  const finalDoExp = (newKeys.length / finalCapacity) * 100

  // 2. DO para Reducción proyectada de la tabla resultante
  const redBuckets = state.config.isPartial
    ? Math.max(state.config.initialBuckets, currentBuckets - 1)
    : Math.max(state.config.initialBuckets, Math.floor(currentBuckets / 2))
  const redCapacity = redBuckets * R
  const prospectiveDoRed = redCapacity > 0 ? (newKeys.length / redCapacity) * 100 : 0

  const explanation = didExpand
    ? `Expansión realizada: DO (${candidateDoExp.toFixed(1)}%) superó el umbral (${state.config.expThreshold}%) o se evitó alcanzar el 100% de capacidad. Cubetas: ${oldBuckets} → ${currentBuckets}. Nueva DO actual: ${finalDoExp.toFixed(1)}%.`
    : `Clave insertada sin expansión. DO actual: ${finalDoExp.toFixed(1)}% (Umbral: ${state.config.expThreshold}%).`

  return {
    ...state,
    keys: newKeys,
    currentBuckets,
    history: [
      ...state.history,
      {
        action: `Insertó ${key}`,
        doExp: finalDoExp,
        doRed: prospectiveDoRed,
        didExpand,
        didReduce: false,
        oldBuckets,
        newBuckets: currentBuckets,
        keysCount: newKeys.length,
        currentCapacity: finalCapacity,
        reducedCapacity: redCapacity,
        recordsPerBucket: R,
        expThreshold: state.config.expThreshold,
        redThreshold: state.config.redThreshold,
        explanation
      }
    ]
  }
}

export const deleteDynamicKey = (state: DynamicState, key: string): DynamicState => {
  if (!state.keys.includes(key)) {
    return state // Clave no existe
  }

  const newKeys = state.keys.filter((k) => k !== key)
  let currentBuckets = state.currentBuckets
  const oldBuckets = currentBuckets
  const R = Math.max(1, state.config.recordsPerBucket)
  let didReduce = false

  // 1. Cubetas y capacidad reducida proyectada
  const targetReducedBuckets = state.config.isPartial
    ? currentBuckets - 1
    : Math.max(state.config.initialBuckets, Math.floor(currentBuckets / 2))
  const targetReducedCapacity = targetReducedBuckets * R

  // 2. DO para Reducción:
  // Se evalúa sobre la capacidad proyectada en caso de reducir
  const doRed = targetReducedCapacity > 0 ? (newKeys.length / targetReducedCapacity) * 100 : 0

  // Condiciones de reducción con prevención anti-bucle:
  // a) Tabla expandida previamente (currentBuckets > initialBuckets).
  // b) targetReducedBuckets < currentBuckets.
  // c) newKeys.length < targetReducedCapacity (no debe estar al 100% en la reducida tampoco).
  // d) doRed <= redThreshold (con redThreshold < expThreshold).
  //    Al garantizar doRed <= U_red < U_exp, la nueva tabla reducida tendrá DO < U_exp,
  //    evitando que vuelva a expandirse inmediatamente y eliminando el bucle infinito.
  const canReduce =
    currentBuckets > state.config.initialBuckets &&
    targetReducedBuckets < currentBuckets &&
    newKeys.length < targetReducedCapacity &&
    doRed <= state.config.redThreshold

  if (canReduce) {
    didReduce = true
    currentBuckets = targetReducedBuckets
  }

  // Capacidad y DO de la tabla resultante (si redujo, usa targetReduced; si no, la actual)
  const finalCapacity = currentBuckets * R
  const finalDoExp = finalCapacity > 0 ? (newKeys.length / finalCapacity) * 100 : 0

  // Siguiente DO de reducción proyectada a partir del nuevo estado
  const nextRedBuckets = state.config.isPartial
    ? Math.max(state.config.initialBuckets, currentBuckets - 1)
    : Math.max(state.config.initialBuckets, Math.floor(currentBuckets / 2))
  const nextRedCapacity = nextRedBuckets * R
  const nextDoRed = nextRedCapacity > 0 ? (newKeys.length / nextRedCapacity) * 100 : 0

  const explanation = didReduce
    ? `Reducción realizada: DO proyectada (${doRed.toFixed(1)}%) cumplió el umbral ≤ ${state.config.redThreshold}%. Cubetas: ${oldBuckets} → ${currentBuckets}. Nueva DO actual actualizada: ${finalDoExp.toFixed(1)}%.`
    : `Clave eliminada sin reducción. DO actual: ${finalDoExp.toFixed(1)}% (DO proyectada si se redujera: ${doRed.toFixed(1)}%, Umbral: ${state.config.redThreshold}%).`

  return {
    ...state,
    keys: newKeys,
    currentBuckets,
    history: [
      ...state.history,
      {
        action: `Eliminó ${key}`,
        doExp: finalDoExp, // DO REAL y actualizada de la tabla resultante
        doRed: didReduce ? nextDoRed : doRed,
        didExpand: false,
        didReduce,
        oldBuckets,
        newBuckets: currentBuckets,
        keysCount: newKeys.length,
        currentCapacity: finalCapacity,
        reducedCapacity: nextRedCapacity,
        recordsPerBucket: R,
        expThreshold: state.config.expThreshold,
        redThreshold: state.config.redThreshold,
        explanation
      }
    ]
  }
}
