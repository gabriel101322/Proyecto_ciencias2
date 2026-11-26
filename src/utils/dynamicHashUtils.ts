export interface DynamicConfig {
  initialBuckets: number
  recordsPerBucket: number
  expThreshold: number // percentage, e.g. 85
  redThreshold: number // percentage, e.g. 125
  isPartial: boolean // true = Parciales, false = Totales
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
}

// Retorna la tabla generada a partir de las llaves
export const generateDynamicTable = (keys: string[], buckets: number): string[][] => {
  const table: string[][] = Array.from({ length: buckets }, () => [])
  
  for (const key of keys) {
    const k = parseInt(key, 10)
    const b = (k % buckets)
    table[b].push(key)
  }
  
  return table
}

export const insertDynamicKey = (state: DynamicState, key: string): DynamicState => {
  if (state.keys.includes(key)) {
    return state // ya existe
  }

  const newKeys = [...state.keys, key]
  let currentBuckets = state.currentBuckets
  let didExpand = false
  let oldBuckets = currentBuckets

  // Calcula DO
  // DO expansión = (N claves / (N cubetas * Registros)) * 100
  let doExp = (newKeys.length / (currentBuckets * state.config.recordsPerBucket)) * 100
  let doRed = (newKeys.length / currentBuckets) * 100

  if (doExp >= state.config.expThreshold) {
    // Expandir
    didExpand = true
    if (state.config.isPartial) {
      currentBuckets += 1
    } else {
      currentBuckets *= 2
    }
  }

  return {
    ...state,
    keys: newKeys,
    currentBuckets,
    history: [
      ...state.history,
      {
        action: `Insertó ${key}`,
        doExp,
        doRed,
        didExpand,
        didReduce: false,
        oldBuckets,
        newBuckets: currentBuckets
      }
    ]
  }
}

export const deleteDynamicKey = (state: DynamicState, key: string): DynamicState => {
  if (!state.keys.includes(key)) {
    return state // no existe
  }

  const newKeys = state.keys.filter(k => k !== key)
  let currentBuckets = state.currentBuckets
  let didReduce = false
  let oldBuckets = currentBuckets

  // Calcula DO para reducción
  // DO red = (N claves / N cubetas) * 100
  let doExp = (newKeys.length / (currentBuckets * state.config.recordsPerBucket)) * 100
  let doRed = (newKeys.length / currentBuckets) * 100

  if (doRed <= state.config.redThreshold && currentBuckets > state.config.initialBuckets) {
    // Reducir
    didReduce = true
    if (state.config.isPartial) {
      currentBuckets -= 1
    } else {
      currentBuckets = Math.max(state.config.initialBuckets, Math.ceil(currentBuckets / 2))
    }
  }

  return {
    ...state,
    keys: newKeys,
    currentBuckets,
    history: [
      ...state.history,
      {
        action: `Eliminó ${key}`,
        doExp,
        doRed,
        didExpand: false,
        didReduce,
        oldBuckets,
        newBuckets: currentBuckets
      }
    ]
  }
}
