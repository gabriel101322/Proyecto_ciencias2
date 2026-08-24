import { TreeNode } from "../types"

// --- Utilidades Binarias ---
export function toBinaryString(val: string): string {
  if (!val) return ""
  // El profesor usa índice alfabético (A=1, B=2... Z=26) en 5 bits.
  // Para evitar que los números colisionen (todos daban "00000" y se sobreescribían),
  // los mapeamos a partir del 27 (27-36).
  return Array.from(val.toUpperCase())
    .map((c) => {
      const code = c.charCodeAt(0)
      if (code >= 65 && code <= 90) {
        // A-Z -> 1-26 (5 bits)
        return (code - 64).toString(2).padStart(5, "0")
      } else if (code >= 48 && code <= 57) {
        // 0-9 -> 27-36 (6 bits)
        return (code - 48 + 27).toString(2).padStart(6, "0")
      }
      // Otros caracteres especiales
      return "00000"
    })
    .join("")
}

// --- Árbol de Búsqueda Digital (Digital Search Tree) ---
// Los nodos internos contienen datos. Las ramificaciones se deciden bit a bit.
export type TreeFrame = { treeState: TreeNode; description: string }

export function insertDigitalTree(
  root: TreeNode | null,
  key: string
): { newRoot: TreeNode; steps: string[]; frames: TreeFrame[] } {
  const binary = toBinaryString(key)
  const steps: string[] = []
  const frames: TreeFrame[] = []

  if (!root) {
    const newLeaf: TreeNode = { id: crypto.randomUUID(), label: key, bitOrFreq: binary, activeState: "placed" }
    frames.push({ treeState: JSON.parse(JSON.stringify(newLeaf)), description: `Árbol vacío. Insertando "${key}" en la raíz.` })
    return { newRoot: newLeaf, steps, frames }
  }

  // Clonar árbol para evitar mutaciones directas en React
  const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode
  let curr = newRoot
  let i = 0

  while (true) {
    // Iluminamos el nodo actual en amarillo
    curr.activeState = "traverse"
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: `Visitando nodo "${curr.label}".` })
    
    if (curr.label === key) {
      const msg = `La clave "${key}" ya existe en el árbol.`
      steps.push(msg)
      curr.activeState = "collision"
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
      curr.activeState = null
      break
    }

    const bit = binary[i % binary.length] || "0"
    const evalMsg = `Evaluando bit ${i} del binario ${binary}: es ${bit}.`
    steps.push(evalMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: evalMsg })

    curr.activeState = null // Quitamos la luz del actual antes de avanzar

    if (bit === "0") {
      if (!curr.left) {
        const msg = `El hijo izquierdo está vacío. Insertando "${key}" aquí.`
        steps.push(msg)
        curr.left = { id: crypto.randomUUID(), label: key, bitOrFreq: binary, activeState: "placed" }
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        curr.left.activeState = null
        break
      }
      const msg = `El hijo izquierdo está ocupado por "${curr.left.label}". Avanzando a la izquierda.`
      steps.push(msg)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
      curr = curr.left
    } else {
      if (!curr.right) {
        const msg = `El hijo derecho está vacío. Insertando "${key}" aquí.`
        steps.push(msg)
        curr.right = { id: crypto.randomUUID(), label: key, bitOrFreq: binary, activeState: "placed" }
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        curr.right.activeState = null
        break
      }
      const msg = `El hijo derecho está ocupado por "${curr.right.label}". Avanzando a la derecha.`
      steps.push(msg)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
      curr = curr.right
    }
    i++
  }

  return { newRoot, steps, frames }
}

// --- Árbol de Búsqueda por Residuos (Binary Trie / Radix) ---
// Las ramas dictan el prefijo. Las claves sólo existen al final del recorrido.
export function insertRadixTree(
  root: TreeNode | null,
  key: string
): { newRoot: TreeNode; steps: string[]; frames: TreeFrame[] } {
  const binary = toBinaryString(key)
  const steps: string[] = []
  const frames: TreeFrame[] = []

  // Clonar árbol para evitar mutaciones directas en React y forzar re-renderizado
  const newRoot: TreeNode = root 
    ? JSON.parse(JSON.stringify(root)) 
    : { id: crypto.randomUUID(), label: "", isLeaf: false }

  // Función recursiva para la inserción con expansión perezosa (Lazy Expansion Trie)
  function insertNode(
    node: TreeNode,
    currentKey: string,
    currentBin: string,
    depth: number
  ): TreeNode {
    node.activeState = "traverse"
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: `Llegando a nodo en profundidad ${depth}.` })

    if (depth >= 5) {
      node.activeState = null
      return node 
    }

    const bit = currentBin[depth]
    const isLeft = bit === "0"

    const evalMsg = `Evaluando bit ${depth} del binario ${currentBin}: es ${bit}. Avanzando a la ${isLeft ? "izquierda" : "derecha"}.`
    steps.push(evalMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: evalMsg })

    const child = isLeft ? node.left : node.right

    if (!child) {
      const msg = `El espacio está vacío. Insertando hoja "${currentKey}" directamente.`
      steps.push(msg)
      const newLeaf: TreeNode = {
        id: crypto.randomUUID(),
        label: currentKey,
        isLeaf: true,
        bitOrFreq: parseInt(bit),
        activeState: "placed"
      }
      if (isLeft) node.left = newLeaf
      else node.right = newLeaf
      
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
      newLeaf.activeState = null
      node.activeState = null
      return node
    }

    if (child.isLeaf) {
      const existingKey = child.label!
      const existingBin = toBinaryString(existingKey)
      
      if (existingKey === currentKey) {
        const msg = `La clave "${currentKey}" ya existe en el árbol.`
        steps.push(msg)
        child.activeState = "collision"
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        child.activeState = null
        node.activeState = null
        return node
      }

      const msg = `¡Colisión! El nodo hoja ya está ocupado por "${existingKey}". Dividiendo nodo...`
      steps.push(msg)
      child.activeState = "collision"
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })

      // Reemplazamos la hoja vieja con un nuevo nodo interno
      const newInternal: TreeNode = {
        id: crypto.randomUUID(),
        label: "",
        isLeaf: false,
        bitOrFreq: parseInt(bit),
        activeState: "traverse"
      }
      
      if (isLeft) node.left = newInternal
      else node.right = newInternal

      // Empujar ambas claves hacia abajo hasta que sus bits difieran
      let currDepth = depth + 1
      let currInternal = newInternal

      while (currDepth < 5) {
        const bitOld = existingBin[currDepth]
        const bitNew = currentBin[currDepth]
        
        if (bitOld === bitNew) {
          const m = `Ambas claves coinciden en el bit ${currDepth} (${bitOld}). Creando nodo interno extra de extensión.`
          steps.push(m)
          const nextInternal: TreeNode = {
            id: crypto.randomUUID(),
            label: "",
            isLeaf: false,
            bitOrFreq: parseInt(bitOld),
            activeState: "traverse"
          }
          if (bitOld === "0") currInternal.left = nextInternal
          else currInternal.right = nextInternal
          
          frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: m })
          currInternal.activeState = null
          currInternal = nextInternal
          currDepth++
        } else {
          const m = `Las claves difieren en el bit ${currDepth}. "${existingKey}" toma la rama ${bitOld} y "${currentKey}" la rama ${bitNew}.`
          steps.push(m)
          const leafOld: TreeNode = { id: crypto.randomUUID(), label: existingKey, isLeaf: true, bitOrFreq: parseInt(bitOld), activeState: "placed" }
          const leafNew: TreeNode = { id: crypto.randomUUID(), label: currentKey, isLeaf: true, bitOrFreq: parseInt(bitNew), activeState: "placed" }
          
          if (bitOld === "0") currInternal.left = leafOld
          else currInternal.right = leafOld
          
          if (bitNew === "0") currInternal.left = leafNew
          else currInternal.right = leafNew
          
          frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: m })
          leafOld.activeState = null
          leafNew.activeState = null
          currInternal.activeState = null
          break
        }
      }
      node.activeState = null
      return node
    }

    // Si es un nodo interno, continuamos recursivamente
    node.activeState = null
    if (isLeft) node.left = insertNode(child, currentKey, currentBin, depth + 1)
    else node.right = insertNode(child, currentKey, currentBin, depth + 1)
    
    return node
  }

  insertNode(newRoot, key, binary, 0)
  return { newRoot, steps, frames }
}

// --- Árbol de Búsqueda por Residuos Múltiples (Trie N-ario) ---
export function insertMultiRadixTree(
  root: TreeNode | null,
  key: string
): { newRoot: TreeNode; steps: string[]; frames: TreeFrame[] } {
  const steps: string[] = []
  const frames: TreeFrame[] = []
  
  let binary = toBinaryString(key)
  if (binary.length % 2 !== 0) binary += "0"

  const newRoot: TreeNode = root 
    ? JSON.parse(JSON.stringify(root)) 
    : { id: crypto.randomUUID(), label: "", isLeaf: false, children: [] }

  if (!newRoot.children) newRoot.children = []

  function insertNode(node: TreeNode, bitIndex: number) {
    node.activeState = "traverse"
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: `Visitando nodo en nivel ${bitIndex / 2}.` })
    
    if (bitIndex >= binary.length) {
      if ((node.label || "").toUpperCase() === key.toUpperCase()) {
        const msg = `La clave "${key}" ya existe.`
        steps.push(msg)
        node.activeState = "collision"
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        node.activeState = null
      } else {
        const msg = `Insertando la clave "${key}" en esta posición.`
        steps.push(msg)
        node.label = key
        node.isLeaf = true
        node.activeState = "placed"
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        node.activeState = null
      }
      return
    }

    const chunk = binary.substring(bitIndex, bitIndex + 2)
    const evalMsg = `Evaluando bits '${chunk}'.`
    steps.push(evalMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: evalMsg })
    node.activeState = null

    if (!node.children) node.children = []
    
    let child = node.children.find(c => c.edgeLabel === chunk)
    
    if (!child) {
      const msg = `La rama para '${chunk}' está vacía. Creando nueva rama.`
      steps.push(msg)
      child = {
        id: crypto.randomUUID(),
        label: "",
        isLeaf: false,
        edgeLabel: chunk,
        children: []
      }
      node.children.push(child)
      node.children.sort((a, b) => (a.edgeLabel || "").localeCompare(b.edgeLabel || ""))
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
    } else {
      const msg = `La rama para '${chunk}' ya existe. Avanzando...`
      steps.push(msg)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
    }

    insertNode(child, bitIndex + 2)
  }

  insertNode(newRoot, 0)
  return { newRoot, steps, frames }
}

export function searchMultiRadixTree(
  root: TreeNode | null,
  key: string
): { found: boolean; steps: string[]; frames: TreeFrame[] } {
  const steps: string[] = []
  const frames: TreeFrame[] = []
  if (!root) {
    steps.push(`El árbol está vacío. No se puede buscar "${key}".`)
    return { found: false, steps, frames }
  }

  let binary = toBinaryString(key)
  if (binary.length % 2 !== 0) binary += "0"
  
  const searchRoot = JSON.parse(JSON.stringify(root)) as TreeNode

  let found = false
  function searchNode(node: TreeNode, bitIndex: number) {
    node.activeState = "traverse"
    frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: `Buscando en nivel ${bitIndex / 2}.` })

    if (node.isLeaf) {
      if ((node.label || "").toUpperCase() === key.toUpperCase()) {
        found = true
        const msg = `¡La clave "${key}" fue encontrada!`
        steps.push(msg)
        node.activeState = "match"
        frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: msg })
      } else {
        const msg = `Llegamos a la hoja "${node.label}", pero no es la clave "${key}".`
        steps.push(msg)
        node.activeState = "collision"
        frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: msg })
      }
      node.activeState = null
      return
    }

    if (bitIndex >= binary.length) {
      const msg = `Fin de la cadena binaria, pero no llegamos a una hoja. Clave "${key}" no encontrada.`
      steps.push(msg)
      node.activeState = "collision"
      frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: msg })
      node.activeState = null
      return
    }

    const chunk = binary.substring(bitIndex, bitIndex + 2)
    const msg = `Buscando rama para '${chunk}'.`
    steps.push(msg)
    frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: msg })
    node.activeState = null

    if (!node.children || node.children.length === 0) {
      const errMsg = `No existen más ramas. La clave "${key}" no se encuentra en el árbol.`
      steps.push(errMsg)
      frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: errMsg })
      return
    }

    const child = node.children.find(c => c.edgeLabel === chunk)
    if (!child) {
      const errMsg = `No se encontró la rama '${chunk}'. La clave "${key}" no se encuentra en el árbol.`
      steps.push(errMsg)
      frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: errMsg })
      return
    }

    searchNode(child, bitIndex + 2)
  }

  searchNode(searchRoot, 0)
  return { found, steps, frames }
}

export function deleteMultiRadixTree(
  root: TreeNode | null,
  key: string
): { newRoot: TreeNode | null; found: boolean; steps: string[]; frames: TreeFrame[] } {
  const steps: string[] = []
  const frames: TreeFrame[] = []
  if (!root) {
    steps.push(`El árbol está vacío. No se puede borrar "${key}".`)
    return { newRoot: null, found: false, steps, frames }
  }

  let binary = toBinaryString(key)
  if (binary.length % 2 !== 0) binary += "0"

  const deleteRoot = JSON.parse(JSON.stringify(root)) as TreeNode
  let found = false

  function deleteNode(node: TreeNode, bitIndex: number): boolean {
    node.activeState = "traverse"
    frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: `Buscando "${key}" en nivel ${bitIndex / 2}.` })

    if (node.isLeaf) {
      if ((node.label || "").toUpperCase() === key.toUpperCase()) {
        found = true
        const msg = `¡La clave "${key}" fue encontrada! Procediendo a borrarla.`
        steps.push(msg)
        node.activeState = "match"
        frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: msg })
        
        node.label = ""
        node.isLeaf = false
        node.activeState = "collision"
        frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: `La clave "${key}" ha sido eliminada.` })
        node.activeState = null
        
        // Return true if this node can be deleted (no children and not a leaf)
        return (!node.children || node.children.length === 0) && !node.isLeaf && !node.label
      } else {
        const msg = `Llegamos a la hoja "${node.label}", pero no es la clave "${key}".`
        steps.push(msg)
        node.activeState = "collision"
        frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: msg })
        node.activeState = null
        return false
      }
    }

    if (bitIndex >= binary.length) {
      const msg = `Fin del recorrido binario, pero la clave "${key}" no existe aquí.`
      steps.push(msg)
      node.activeState = "collision"
      frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: msg })
      node.activeState = null
      return false
    }

    const chunk = binary.substring(bitIndex, bitIndex + 2)
    node.activeState = null

    if (!node.children) return false

    const childIndex = node.children.findIndex(c => c.edgeLabel === chunk)
    if (childIndex === -1) {
      const msg = `La rama '${chunk}' no existe. Clave no encontrada.`
      steps.push(msg)
      frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: msg })
      return false
    }

    const child = node.children[childIndex]
    const shouldDeleteChild = deleteNode(child, bitIndex + 2)

    if (shouldDeleteChild) {
      const msg = `La rama '${chunk}' quedó vacía. Podando el árbol.`
      steps.push(msg)
      node.children.splice(childIndex, 1)
      frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: msg })
    }

    // Check if current node is now empty and can be pruned by its parent
    return (!node.children || node.children.length === 0) && !node.isLeaf && !node.label
  }

  const shouldDeleteRoot = deleteNode(deleteRoot, 0)
  
  // If the root itself is completely empty after deletion, return a fresh empty root or null
  if (shouldDeleteRoot) {
    frames.push({ treeState: JSON.parse(JSON.stringify({ id: deleteRoot.id, label: "", isLeaf: false, children: [] })), description: "El árbol ha quedado completamente vacío." })
    return { newRoot: null, found, steps, frames }
  }

  return { newRoot: deleteRoot, found, steps, frames }
}


import { HuffmanLogicData, HuffmanReductionStep } from "../types"

// Lee un texto completo y genera el árbol óptimo.
export function buildHuffmanTree(text: string): { newRoot: TreeNode | null; steps: string[]; logicData?: HuffmanLogicData } {
  const steps: string[] = []
  if (!text) {
    return { newRoot: null, steps }
  }

  steps.push(`Generando árbol de Huffman para el texto: "${text}"`)

  // 1. Contar frecuencias y registrar el primer índice de aparición
  const freqMap: Record<string, number> = {}
  const firstAppearance: Record<string, number> = {}
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (firstAppearance[char] === undefined) {
      firstAppearance[char] = i
    }
    freqMap[char] = (freqMap[char] || 0) + 1
  }

  // 2. Crear nodos iniciales extendidos con un índice para desempatar
  type ExtendedTreeNode = TreeNode & { appearanceIndex?: number }

  const nodes: ExtendedTreeNode[] = Object.entries(freqMap).map(([char, freq]) => ({
    id: crypto.randomUUID(),
    label: char,
    bitOrFreq: freq,
    isLeaf: true,
    appearanceIndex: firstAppearance[char]
  }))

  steps.push(`Frecuencias calculadas: ${nodes.map(n => `'${n.label}': ${n.bitOrFreq}`).join(", ")}`)

  const totalLength = text.length
  const reductionSteps: HuffmanReductionStep[] = []

  // Guardar estado inicial
  const initialNodesState = nodes.map(n => ({ id: n.id, label: n.label || "", freq: n.bitOrFreq as number }))
  reductionSteps.push({ remainingNodes: initialNodesState })

  // 3. Algoritmo de Huffman
  while (nodes.length > 1) {
    // Usar sort estable: ordenar por frecuencia descendente. 
    // Si empatan, ordenar por índice de aparición descendente. 
    nodes.sort((a, b) => {
      const diff = (b.bitOrFreq as number) - (a.bitOrFreq as number)
      if (diff !== 0) return diff
      return (b.appearanceIndex || 0) - (a.appearanceIndex || 0)
    })
    
    const left = nodes.pop()!  // lowest frequency
    const right = nodes.pop()! // second lowest (higher) frequency

    // Añadir etiquetas para el visualizador
    left.edgeLabel = "0"
    right.edgeLabel = "1"

    const newFreq = (left.bitOrFreq as number) + (right.bitOrFreq as number)
    
    // El label combinado será la unión de los labels de los hijos, o algo representativo
    const combinedLabel = `${left.label || left.bitOrFreq}+${right.label || right.bitOrFreq}`

    const newNode: ExtendedTreeNode = {
      id: crypto.randomUUID(),
      label: combinedLabel,
      bitOrFreq: newFreq,
      left,
      right,
      appearanceIndex: Math.min(left.appearanceIndex || 0, right.appearanceIndex || 0)
    }

    steps.push(`Combinando nodos [${left.label || left.bitOrFreq}] y [${right.label || right.bitOrFreq}] -> Nueva frecuencia combinada: ${newFreq}`)
    nodes.push(newNode)

    // Guardar el paso
    reductionSteps.push({
      remainingNodes: nodes.map(n => ({ id: n.id, label: n.label || "", freq: n.bitOrFreq as number })),
      combined: {
        leftLabel: left.label || String(left.bitOrFreq),
        rightLabel: right.label || String(right.bitOrFreq),
        newLabel: combinedLabel,
        newFreq
      }
    })
  }

  // Limpiar los labels internos del árbol para la visualización final
  function clearInternalLabels(node: TreeNode) {
    if (!node.isLeaf) node.label = ""
    if (node.left) clearInternalLabels(node.left)
    if (node.right) clearInternalLabels(node.right)
  }
  clearInternalLabels(nodes[0])

  steps.push(`Árbol de Huffman completado con frecuencia raíz de ${nodes[0].bitOrFreq}.`)
  
  // 4. Extraer códigos
  const codes: Record<string, string> = {}
  function extractCodes(node: TreeNode, prefix: string) {
    if (node.isLeaf && node.label) {
      codes[node.label] = prefix
    }
    if (node.left) extractCodes(node.left, prefix + "0")
    if (node.right) extractCodes(node.right, prefix + "1")
  }
  extractCodes(nodes[0], "")

  // 5. Calcular tabla y longitud media
  const codesTable = Object.keys(freqMap).map(char => ({
    char,
    code: codes[char],
    length: codes[char].length,
    prob: freqMap[char]
  }))

  let averageLength = 0
  for (const entry of codesTable) {
    averageLength += (entry.prob / totalLength) * entry.length
  }

  // 6. Cadena binaria
  const encodedString = text.split("").map(c => codes[c]).join("|")

  const logicData: HuffmanLogicData = {
    text,
    totalLength,
    initialFrequencies: freqMap,
    reductionSteps,
    codes: codesTable,
    averageLength,
    encodedString
  }

  return { newRoot: nodes[0], steps, logicData }
}

// --- FUNCIONES DE BÚSQUEDA Y ELIMINACIÓN ---

export function searchDigitalTree(
  root: TreeNode | null,
  key: string
): { steps: string[]; frames: TreeFrame[] } {
  const binary = toBinaryString(key)
  const steps: string[] = []
  const frames: TreeFrame[] = []

  if (!root) {
    steps.push(`El árbol está vacío. No se encontró "${key}".`)
    return { steps, frames }
  }

  const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode
  let curr: TreeNode | undefined = newRoot
  let i = 0

  while (curr) {
    curr.activeState = "traverse"
    const visitMsg = `Visitando nodo con etiqueta "${curr.label || 'Vacio'}".`
    steps.push(visitMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: visitMsg })

    if ((curr.label || "").toUpperCase() === key.toUpperCase()) {
      curr.activeState = "placed"
      const matchMsg = `¡Clave "${key}" encontrada en el árbol!`
      steps.push(matchMsg)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: matchMsg })
      curr.activeState = null
      return { steps, frames }
    }

    const bit = binary[i % binary.length] || "0"
    const evalMsg = `La clave no coincide. Evaluando bit ${i} del binario ${binary}: es ${bit}.`
    steps.push(evalMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: evalMsg })
    curr.activeState = null

    if (bit === "0") {
      curr = curr.left
    } else {
      curr = curr.right
    }
    i++
  }

  const notFoundMsg = `No hay más caminos posibles. La clave "${key}" no se encontró.`
  steps.push(notFoundMsg)
  frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: notFoundMsg })
  return { steps, frames }
}

export function deleteDigitalTree(
  root: TreeNode | null,
  key: string
): { newRoot: TreeNode | null; steps: string[]; frames: TreeFrame[] } {
  const binary = toBinaryString(key)
  const steps: string[] = []
  const frames: TreeFrame[] = []

  if (!root) {
    steps.push(`El árbol está vacío.`)
    return { newRoot: null, steps, frames }
  }

  const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode
  let found = false

  function remove(node: TreeNode | undefined, depth: number): TreeNode | undefined {
    if (!node) {
      const notFoundMsg = `Se alcanzó un camino vacío. La clave "${key}" no existe.`
      if (!found) {
        steps.push(notFoundMsg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: notFoundMsg })
      }
      return undefined
    }

    node.activeState = "traverse"
    const visitMsg = `Visitando nodo con etiqueta "${node.label || 'Vacio'}".`
    steps.push(visitMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: visitMsg })

    if ((node.label || "").toUpperCase() === key.toUpperCase()) {
      found = true
      node.activeState = "collision"
      const matchMsg = `¡Clave "${key}" encontrada! Procediendo a borrar.`
      steps.push(matchMsg)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: matchMsg })
      
      // Borrado lógico
      node.label = ""
      node.activeState = "placed"
      const delMsg = `Clave borrada lógicamente (etiqueta vacía).`
      steps.push(delMsg)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: delMsg })
      node.activeState = null

      if (!node.left && !node.right) {
        const pruneMsg = `El nodo quedó vacío y no tiene hijos. Eliminándolo completamente.`
        steps.push(pruneMsg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: pruneMsg })
        return undefined
      }

      return node
    }

    const bit = binary[depth % binary.length] || "0"
    const evalMsg = `La clave no coincide. Evaluando bit ${depth}: es ${bit}.`
    steps.push(evalMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: evalMsg })
    node.activeState = null

    if (bit === "0") {
      node.left = remove(node.left, depth + 1)
    } else {
      node.right = remove(node.right, depth + 1)
    }

    // Poda post-orden: Si al regresar, este nodo no tiene etiqueta ni hijos, lo podamos
    if (!node.label && !node.left && !node.right) {
      const pruneMsg = `El nodo interno quedó vacío y sin hijos. Eliminándolo (poda).`
      steps.push(pruneMsg)
      node.activeState = "collision" // Resaltar antes de podar
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: pruneMsg })
      return undefined
    }

    return node
  }

  const finalRoot = remove(newRoot, 0)
  return { newRoot: finalRoot || null, steps, frames }
}

export function searchRadixTree(
  root: TreeNode | null,
  key: string
): { steps: string[]; frames: TreeFrame[] } {
  const binary = toBinaryString(key)
  const steps: string[] = []
  const frames: TreeFrame[] = []

  if (!root) {
    steps.push(`Árbol vacío.`)
    return { steps, frames }
  }

  const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode
  
  function traverse(node: TreeNode, depth: number) {
    node.activeState = "traverse"
    if (node.isLeaf) {
      if ((node.label || "").toUpperCase() === key.toUpperCase()) {
        node.activeState = "placed"
        const msg = `¡Hoja alcanzada! La clave "${key}" fue encontrada.`
        steps.push(msg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        node.activeState = null
      } else {
        node.activeState = "collision"
        const msg = `Llegamos a una hoja, pero contiene "${node.label}" en lugar de "${key}". No encontrada.`
        steps.push(msg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        node.activeState = null
      }
      return
    }

    const m = `Nodo interno en profundidad ${depth}.`
    steps.push(m)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: m })

    if (depth >= 5) {
      node.activeState = null
      return
    }

    const bit = binary[depth]
    const evalMsg = `Evaluando bit ${depth} (${bit}). Avanzando por la rama ${bit}.`
    steps.push(evalMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: evalMsg })
    node.activeState = null

    const child = bit === "0" ? node.left : node.right
    if (!child) {
      const emptyMsg = `La rama ${bit} está vacía. La clave "${key}" no existe en el árbol.`
      steps.push(emptyMsg)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: emptyMsg })
      return
    }

    traverse(child, depth + 1)
  }

  traverse(newRoot, 0)
  return { steps, frames }
}

export function deleteRadixTree(
  root: TreeNode | null,
  key: string
): { newRoot: TreeNode | null; steps: string[]; frames: TreeFrame[] } {
  const binary = toBinaryString(key)
  const steps: string[] = []
  const frames: TreeFrame[] = []

  if (!root) {
    steps.push(`Árbol vacío.`)
    return { newRoot: null, steps, frames }
  }

  const newRoot = JSON.parse(JSON.stringify(root)) as TreeNode

  function remove(node: TreeNode, depth: number): TreeNode | undefined {
    node.activeState = "traverse"
    
    if (node.isLeaf) {
      if ((node.label || "").toUpperCase() === key.toUpperCase()) {
        node.activeState = "collision"
        const msg = `¡Clave "${key}" encontrada! Procediendo a eliminar la hoja.`
        steps.push(msg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        node.activeState = null
        return undefined
      } else {
        node.activeState = null
        const msg = `Hoja equivocada ("${node.label}"). La clave "${key}" no existe.`
        steps.push(msg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })
        return node
      }
    }

    const msg = `Buscando para eliminar: en nodo interno (profundidad ${depth}).`
    steps.push(msg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: msg })

    if (depth >= 5) {
      node.activeState = null
      return node
    }

    const bit = binary[depth]
    const isLeft = bit === "0"

    const childMsg = `El bit es ${bit}, bajando por la rama ${bit}.`
    steps.push(childMsg)
    frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: childMsg })
    node.activeState = null

    if (isLeft && node.left) {
      node.left = remove(node.left, depth + 1)
    } else if (!isLeft && node.right) {
      node.right = remove(node.right, depth + 1)
    } else {
      const err = `La rama ${bit} está vacía. La clave no existe.`
      steps.push(err)
      frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: err })
      return node
    }

    // Compresión del Trie Perezoso
    if (depth > 0) {
      if (node.left && !node.right && node.left.isLeaf) {
        const cMsg = `Compresión: el nodo interno se quedó solo con la hoja "${node.left.label}". Comprimiendo camino.`
        steps.push(cMsg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: cMsg })
        return node.left
      }
      if (node.right && !node.left && node.right.isLeaf) {
        const cMsg = `Compresión: el nodo interno se quedó solo con la hoja "${node.right.label}". Comprimiendo camino.`
        steps.push(cMsg)
        frames.push({ treeState: JSON.parse(JSON.stringify(newRoot)), description: cMsg })
        return node.right
      }
    }

    return node
  }

  const finalRoot = remove(newRoot, 0)
  return { newRoot: finalRoot || null, steps, frames }
}
