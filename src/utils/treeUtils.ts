import { TreeNode } from "../types"

// --- Utilidades Binarias ---
export function toBinaryString(val: string): string {
  if (!val) return ""
  // El profesor usa índice alfabético (A=1, B=2... Z=26) en 5 bits, no ASCII.
  return Array.from(val.toUpperCase())
    .map((c) => {
      const code = c.charCodeAt(0) - 64 // 'A' (65) -> 1
      if (code < 1 || code > 26) return "00000" // Evitar errores con caracteres especiales
      return code.toString(2).padStart(5, "0")
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

    if (bitIndex >= binary.length) {
      if ((node.label || "").toUpperCase() === key.toUpperCase()) {
        found = true
        const msg = `¡La clave "${key}" fue encontrada!`
        steps.push(msg)
        node.activeState = "match"
        frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: msg })
      } else {
        const msg = `Fin de la búsqueda, pero la clave "${key}" no está en este nodo.`
        steps.push(msg)
        node.activeState = "collision"
        frames.push({ treeState: JSON.parse(JSON.stringify(searchRoot)), description: msg })
      }
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

    if (bitIndex >= binary.length) {
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
        const msg = `Fin del recorrido, pero "${key}" no existe aquí.`
        steps.push(msg)
        node.activeState = "collision"
        frames.push({ treeState: JSON.parse(JSON.stringify(deleteRoot)), description: msg })
        node.activeState = null
        return false
      }
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


// Lee un texto completo y genera el árbol óptimo.
export function buildHuffmanTree(text: string): { newRoot: TreeNode | null; steps: string[] } {
  const steps: string[] = []
  if (!text) {
    return { newRoot: null, steps }
  }

  steps.push(`Generando árbol de Huffman para el texto: "${text}"`)

  // 1. Contar frecuencias
  const freqMap: Record<string, number> = {}
  for (const char of text) {
    freqMap[char] = (freqMap[char] || 0) + 1
  }

  // 2. Crear nodos iniciales
  const nodes: TreeNode[] = Object.entries(freqMap).map(([char, freq]) => ({
    id: crypto.randomUUID(),
    label: char,
    bitOrFreq: freq,
    isLeaf: true,
  }))

  steps.push(`Frecuencias calculadas: ${nodes.map(n => `'${n.label}': ${n.bitOrFreq}`).join(", ")}`)

  // 3. Algoritmo de Huffman (Cola de prioridad simulada con sort)
  while (nodes.length > 1) {
    // Ordenar de mayor a menor, para sacar los dos menores del final
    nodes.sort((a, b) => (b.bitOrFreq as number) - (a.bitOrFreq as number))
    
    const right = nodes.pop()!
    const left = nodes.pop()!

    const newFreq = (left.bitOrFreq as number) + (right.bitOrFreq as number)
    const newNode: TreeNode = {
      id: crypto.randomUUID(),
      label: "", // Nodo interno sin texto
      bitOrFreq: newFreq,
      left,
      right,
    }

    steps.push(`Combinando nodos [${left.label || left.bitOrFreq}] y [${right.label || right.bitOrFreq}] -> Nueva frecuencia combinada: ${newFreq}`)
    nodes.push(newNode)
  }

  steps.push(`Árbol de Huffman completado con frecuencia raíz de ${nodes[0].bitOrFreq}.`)
  return { newRoot: nodes[0], steps }
}
