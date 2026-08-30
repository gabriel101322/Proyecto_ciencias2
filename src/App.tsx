import { useState, ReactNode } from "react"
import { Section, SectionId, Row, PendingChange, TreeNode } from "./types"
import { SECTIONS } from "./constants"
import {
  computeInitialHash,
  computeSecondaryHash,
  rehashInstantly,
  renderLongDivision,
} from "./utils/hashUtils"

import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import TableView from "./components/TableView"
import TreeView from "./components/TreeView"
import { TopControls, BottomControls } from "./components/Controls"
import { TopTreeControls, BottomTreeControls } from "./components/TreeControls"
import HashExplanation from "./components/HashExplanation"
import ConfirmModal from "./components/ConfirmModal"
import HuffmanExplanation from "./components/HuffmanExplanation"
import { insertDigitalTree, searchDigitalTree, deleteDigitalTree, insertRadixTree, searchRadixTree, deleteRadixTree, insertMultiRadixTree, searchMultiRadixTree, deleteMultiRadixTree, buildHuffmanTree } from "./utils/treeUtils"

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("internas")
  const [activeOption, setActiveOption] = useState<string>("Secuencial")

  // ── Estado de la tabla ──────────────────────────────
  const [keySize, setKeySize] = useState(1)
  const [arraySizeInput, setArraySizeInput] = useState("")
  const [rows, setRows] = useState<Row[] | null>(null)
  const [keyInput, setKeyInput] = useState("")
  const [huffmanText, setHuffmanText] = useState("")
  const [hashAlgo, setHashAlgo] = useState("")
  const [collision, setCollision] = useState("")
  const [doubleHash, setDoubleHash] = useState("")
  const [collisionOpen, setCollisionOpen] = useState(false)
  const [hashExplanation, setHashExplanation] = useState<{
    title: string
    steps: ReactNode[]
  } | null>(null)

  // ── Estado de la animación ──────────────────────────
  const [active, setActive] = useState<{
    pos: number
    state: "compare" | "match" | "insert" | "collide" | "resolve"
    subIndex?: number
  } | null>(null)
  
  const [splitRange, setSplitRange] = useState<{ left: number; mid: number; right: number; activeHalf: "left" | "right" } | null>(null)
  const [message, setMessage] = useState<{
    text: string
    tone: "info" | "ok" | "warn"
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null)

  const [treeData, setTreeData] = useState<TreeNode | null>(null)
  const [treeAlgo, setTreeAlgo] = useState<string>("Búsqueda Digital")

  const current = SECTIONS.find((s) => s.id === activeSection)!
  const isTableView =
    (activeSection === "internas" || activeSection === "externas") &&
    activeOption !== "Árboles de Búsqueda" &&
    activeOption !== "Búsquedas Dinámicas"
  const isHash = activeOption === "Transformaciones de Claves"
  const isTree = activeOption === "Árboles de Búsqueda"
  const isExternal = activeSection === "externas"

  const hasInsertedData = !!rows && rows.some((r) => r.key !== "")

  const triggerRehash = (algo: string, coll: string, double: string) => {
    if (!algo || !coll || (coll === "Doble Función Hash" && !double)) return
    
    const summarySteps = [
      <div key="rehash_summary" className="mb-4">
        <p className="mb-1 font-semibold text-[#52241A]">Resumen de Rehasheo</p>
        <p className="text-sm text-[#52241A]/80 ml-2">
          La tabla ha sido reubicada instantáneamente usando <strong>{algo}</strong>.
          <br/>Resolución de colisiones: <strong>{coll}</strong>
          {coll === "Doble Función Hash" && double ? ` (${double})` : ""}.
        </p>
      </div>
    ]
    
    setHashExplanation({
      title: `Algoritmo: ${algo}`,
      steps: summarySteps,
    })

    setRows((prev) => {
      if (!prev || prev.length === 0) return prev
      return rehashInstantly(prev, algo, coll, double)
    })
  }

  const handleAlgorithmChange = (
    newOption: string,
    newSectionId?: SectionId
  ) => {
    if (
      newOption === activeOption &&
      (!newSectionId || newSectionId === activeSection)
    )
      return

    requestChange({ type: "section", option: newOption, sectionId: newSectionId })
  }

  const requestChange = (change: PendingChange) => {
    let showModal = false

    if (change.type === "section") {
      const isCurrentTree = activeOption === "Árboles de Búsqueda"
      const isNewTree = change.option === "Árboles de Búsqueda"
      
      if (isCurrentTree && !isNewTree && !!treeData) {
        showModal = true
      } else if (!isCurrentTree && isNewTree && hasInsertedData) {
        showModal = true
      } else if (!isCurrentTree && !isNewTree && hasInsertedData) {
        showModal = true
      }
    } else {
      if (hasInsertedData) showModal = true
    }

    if (showModal) {
      setPendingChange(change)
    } else {
      applyChange(change, false)
    }
  }

  const applyChange = (
    change: PendingChange,
    keepArray: boolean
  ) => {
    if (change.type === "section") {
      if (!keepArray) {
        setRows(null)
        setArraySizeInput("")
      } else if (rows) {
        const allKeys: string[] = []
        rows.forEach((r) => {
          if (r.key) {
            r.key.split(/, | -> /).forEach((kStr) => {
              const k = kStr.trim()
              if (k) {
                allKeys.push(k)
              }
            })
          }
        })

        allKeys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

        const newRows = rows.map((r) => ({ ...r, inactive: false, key: "" }))
        for (let i = 0; i < Math.min(allKeys.length, newRows.length); i++) {
          newRows[i].key = allKeys[i]
        }
        setRows(newRows)
      }

      if (change.option === "Transformaciones de Claves") {
        setHashAlgo("")
        setCollision("")
        setDoubleHash("")
        setHashExplanation(null)
      } else if (change.option === "Árboles de Búsqueda") {
        setTreeData(null)
        setTreeAlgo("Búsqueda Digital")
        setHashExplanation(null)
      } else {
        setHashExplanation(null)
      }

      if (change.sectionId) {
        setActiveSection(change.sectionId)
      }
      setActiveOption(change.option)
      setPendingChange(null)
      setMessage(null)
      setActive(null)
      setCollisionOpen(false)
    } else if (change.type === "hashAlgo") {
      setHashAlgo(change.algo)
      if (keepArray) triggerRehash(change.algo, collision, doubleHash)
      setPendingChange(null)
    } else if (change.type === "collision") {
      setCollision(change.coll)
      if (change.double) setDoubleHash(change.double)
      if (keepArray) triggerRehash(hashAlgo, change.coll, change.double || doubleHash)
      setPendingChange(null)
    }
  }

  const cancelChange = () => setPendingChange(null)

  const selectSection = (section: Section) => {
    handleAlgorithmChange(section.options[0], section.id)
  }

  const generateTable = () => {
    const size = parseInt(arraySizeInput, 10)
    if (!Number.isFinite(size) || size <= 0) {
      setRows(null)
      return
    }
    
    let finalSize = size
    if (isExternal) {
      const numBlocks = Math.ceil(Math.sqrt(size))
      const blockSize = Math.ceil(size / numBlocks) || 1
      finalSize = numBlocks * blockSize
    }

    setRows(Array.from({ length: finalSize }, (_, i) => ({ pos: i + 1, key: "" })))
    setActive(null)
    setMessage(null)
    setHashExplanation(null)
  }

  const handleSave = () => {
    let dataToSave: any = {}
    if (isTree) {
      if (!treeData) {
        setMessage({ text: "No hay un árbol para guardar.", tone: "warn" })
        return
      }
      dataToSave = { type: "tree", data: treeData, huffmanText: huffmanText }
    } else {
      if (!rows || rows.length === 0) {
        setMessage({ text: "No hay un arreglo para guardar.", tone: "warn" })
        return
      }
      dataToSave = { type: "array", data: rows, size: arraySizeInput }
    }
    
    let fileName = window.prompt("Ingrese el nombre del archivo para guardar:", `datos_${isTree ? "arbol" : "arreglo"}`)
    if (!fileName) return // El usuario canceló o dejó en blanco
    
    if (!fileName.endsWith('.json')) {
      fileName += '.json'
    }

    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage({ text: `Datos guardados exitosamente como ${fileName}.`, tone: "ok" })
  }

  const handleOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string
        const parsed = JSON.parse(result)
        
        if (isTree) {
          if (parsed.type !== "tree") {
            setMessage({ text: "No se puede abrir un arreglo de tabla en la sección de árboles.", tone: "warn" })
            return
          }
          setTreeData(parsed.data)
          if (parsed.huffmanText) setHuffmanText(parsed.huffmanText)
          setMessage({ text: "Árbol cargado exitosamente.", tone: "ok" })
        } else {
          if (parsed.type !== "array") {
            setMessage({ text: "No se puede abrir un árbol en la sección de arreglos.", tone: "warn" })
            return
          }
          setRows(parsed.data)
          if (parsed.size) setArraySizeInput(parsed.size)
          setMessage({ text: "Arreglo cargado exitosamente.", tone: "ok" })
        }
      } catch (err) {
        setMessage({ text: "Error al leer el archivo. Formato inválido.", tone: "warn" })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const validateKey = (value: string): string | null => {
    const key = value.trim()
    if (!key) return "Escribe una clave."
    if (!/^\d+$/.test(key)) return "La clave solo puede contener dígitos."
    if (key.length !== keySize)
      return `La clave debe tener ${keySize} dígito${keySize > 1 ? "s" : ""}.`
    return null
  }

  const insertSequential = async (customKey?: string) => {
    if (busy || !rows) return
    const key = (customKey ?? keyInput).trim()
    const error = validateKey(key)
    if (error) {
      setMessage({ text: error, tone: "warn" })
      return
    }

    const firstEmpty = rows.findIndex(r => r.key === "")
    if (firstEmpty === -1) {
      setMessage({ text: "El arreglo está lleno, no hay espacio disponible.", tone: "warn" })
      return
    }

    setBusy(true)
    setMessage({ text: `Insertando "${key}"…`, tone: "info" })

    let targetIndex = firstEmpty
    for (let i = 0; i < firstEmpty; i++) {
      setActive({ pos: rows[i].pos, state: "compare" })
      await sleep(320)

      if (rows[i].key === key) {
        setActive({ pos: rows[i].pos, state: "match" })
        setMessage({ text: `La clave "${key}" ya existe en la posición ${rows[i].pos}.`, tone: "warn" })
        setBusy(false)
        return
      }

      if (parseInt(key, 10) < parseInt(rows[i].key, 10)) {
        targetIndex = i
        break
      }
    }

    for (let i = targetIndex; i < firstEmpty; i++) {
      if (rows[i].key === key) {
        setActive({ pos: rows[i].pos, state: "match" })
        setMessage({ text: `La clave "${key}" ya existe en la posición ${rows[i].pos}.`, tone: "warn" })
        setBusy(false)
        return
      }
    }

    setActive({ pos: rows[targetIndex].pos, state: "insert" })
    
    setRows((prev) => {
      if (!prev) return prev
      const newRows = [...prev]
      for (let i = firstEmpty; i > targetIndex; i--) {
        newRows[i] = { ...newRows[i], key: newRows[i - 1].key }
      }
      newRows[targetIndex] = { ...newRows[targetIndex], key }
      return newRows
    })

    setMessage({
      text: `Clave "${key}" insertada en la posición ${rows[targetIndex].pos}.`,
      tone: "ok",
    })
    setKeyInput("")
    await sleep(600)
    setActive(null)
    setBusy(false)
  }

  const deleteKeyFromTree = async () => {
    if (!treeData || busy) return
    const key = keyInput.trim().toUpperCase()
    if (!key) {
      setMessage({ text: "Escribe la clave que deseas borrar.", tone: "warn" })
      return
    }
    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(key)) {
      setMessage({ text: "Solo se permiten valores alfabéticos en los árboles.", tone: "warn" })
      return
    }

    setBusy(true)
    setMessage({ text: `Eliminando "${key}" de ${treeAlgo}…`, tone: "info" })
    
    if (treeAlgo === "Árbol de Huffman") {
      setMessage({ text: `No se puede borrar claves individuales de un Árbol de Huffman.`, tone: "warn" })
      setBusy(false)
      return
    }

    let result: { newRoot: TreeNode | null; steps: string[]; frames?: any[]; found?: boolean } = { newRoot: null, steps: [] }

    if (treeAlgo === "Búsqueda Digital") {
      result = deleteDigitalTree(treeData, key)
    } else if (treeAlgo === "Búsqueda por Residuos") {
      result = deleteRadixTree(treeData, key)
    } else if (treeAlgo === "Búsqueda por Residuos Múltiples") {
      result = deleteMultiRadixTree(treeData, key)
    }

    if (result.frames && result.frames.length > 0) {
      setHashExplanation({ title: treeAlgo, steps: [] })
      for (let i = 0; i < result.frames.length; i++) {
        const frame = result.frames[i]
        setTreeData(frame.treeState)
        setHashExplanation((prev) => {
          if (!prev) return null
          return {
            title: prev.title,
            steps: [
              ...prev.steps,
              <div key={`tree_step_${i}`} className="mb-2 ml-2 border-l-2 border-[#E6B793] pl-3">
                <p className="text-sm text-[#52241A]/80">{frame.description}</p>
              </div>
            ]
          }
        })
        await sleep(400)
      }
    }
    
    setTreeData(result.newRoot)
    // Digital and Radix Tree don't explicitly return `found` in their current types in some signatures, but they delete if they reach the leaf. We just check if tree changed, or just say OK.
    // For Multi Radix, it returns found.
    if (result.found !== false) {
      setMessage({ text: `Intentando borrar "${key}" completado.`, tone: "ok" })
      setKeyInput("")
    } else {
      setMessage({ text: `La clave "${key}" no se encontró en el árbol.`, tone: "warn" })
    }
    
    setBusy(false)
  }

  const handleTreeSearch = async () => {
    if (busy || !treeData) return
    const key = keyInput.trim()
    if (!key) {
      setMessage({ text: "Escribe una clave para buscar.", tone: "warn" })
      return
    }
    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(key)) {
      setMessage({ text: "Solo se permiten valores alfabéticos en los árboles.", tone: "warn" })
      return
    }

    setBusy(true)
    setMessage({ text: `Buscando "${key}" en ${treeAlgo}…`, tone: "info" })
    
    if (treeAlgo === "Árbol de Huffman") {
      setMessage({ text: `No se puede buscar claves individuales en un Árbol de Huffman.`, tone: "warn" })
      setBusy(false)
      return
    }

    let result: { steps: string[]; frames?: any[]; found?: boolean } = { steps: [] }

    if (treeAlgo === "Búsqueda Digital") {
      result = searchDigitalTree(treeData, key)
    } else if (treeAlgo === "Búsqueda por Residuos") {
      result = searchRadixTree(treeData, key)
    } else if (treeAlgo === "Búsqueda por Residuos Múltiples") {
      result = searchMultiRadixTree(treeData, key)
    }

    if (result.frames && result.frames.length > 0) {
      setHashExplanation({ title: treeAlgo, steps: [] })
      for (let i = 0; i < result.frames.length; i++) {
        const frame = result.frames[i]
        setTreeData(frame.treeState)
        setHashExplanation((prev) => {
          if (!prev) return null
          return {
            title: prev.title,
            steps: [
              ...prev.steps,
              <div key={`tree_step_${i}`} className="mb-2 ml-2 border-l-2 border-[#E6B793] pl-3">
                <p className="text-sm text-[#52241A]/80">{frame.description}</p>
              </div>
            ]
          }
        })
        await sleep(400)
      }
    }
    
    // Fallback detection logic if `found` wasn't explicitly returned
    const lastFrame = result.frames && result.frames.length > 0 ? result.frames[result.frames.length - 1] : null;
    const isFound = result.found !== undefined ? result.found : (lastFrame && lastFrame.description.includes("encontrada"));

    if (isFound) {
      setMessage({ text: `¡La clave "${key}" fue encontrada!`, tone: "ok" })
    } else {
      setMessage({ text: `La clave "${key}" no se encuentra en el árbol.`, tone: "warn" })
    }
    
    // Clear visual search state after a delay
    await sleep(2000)
    setTreeData(treeData)
    
    setBusy(false)
  }

  const handleSearch = () => {
    if (rows) setRows(rows.map((r) => ({ ...r, inactive: false })))

    if (isHash) {
      searchHash()
    } else if (activeOption === "Binaria") {
      searchBinary()
    } else {
      searchSequential()
    }
  }

  const searchSequential = async () => {
    if (busy || !rows) return
    const key = keyInput.trim()
    if (!key) {
      setMessage({ text: "Escribe una clave para buscar.", tone: "warn" })
      return
    }
    setBusy(true)
    setMessage({ text: `Buscando "${key}"…`, tone: "info" })

    const n = rows.length
    const numBlocks = Math.ceil(Math.sqrt(n))
    const blockSize = Math.ceil(n / numBlocks) || 1

    if (isExternal) {
      let currentRows = rows.map((r) => ({ ...r, inactive: false }))
      
      for (let b = 0; b < numBlocks; b++) {
        let startIdx = b * blockSize;
        let endIdx = Math.min((b + 1) * blockSize, n) - 1;
        
        let hasData = false;
        for (let i = startIdx; i <= endIdx; i++) {
           if (currentRows[i].key !== "") { hasData = true; break; }
        }
        if (!hasData) continue;

        setMessage({ text: `Cargando Bloque ${b + 1} a memoria...`, tone: "info" });
        setActive({ pos: currentRows[startIdx].pos, state: "compare" });
        await sleep(1000);

        for (let i = startIdx; i <= endIdx; i++) {
           if (!isHash && currentRows[i].key === "") break;
           
           setActive({ pos: currentRows[i].pos, state: "compare" })
           await sleep(320)

           if (currentRows[i].key === key) {
             setActive({ pos: currentRows[i].pos, state: "match" })
             setMessage({ text: `Clave "${key}" encontrada en Bloque ${b + 1} (posición ${currentRows[i].pos}).`, tone: "ok" })
             setBusy(false)
             return
           }
        }
        
        for (let i = startIdx; i <= endIdx; i++) currentRows[i].inactive = true;
        setRows([...currentRows]);
      }
      
      setMessage({ text: `La clave "${key}" no se encuentra en el arreglo.`, tone: "warn" })
      setActive(null)
      setBusy(false)
      return
    }

    for (let i = 0; i < rows.length; i++) {
      if (!isHash && rows[i].key === "") {
        break
      }

      setActive({ pos: rows[i].pos, state: "compare" })
      await sleep(320)

      if (rows[i].key === key) {
        setActive({ pos: rows[i].pos, state: "match" })
        setMessage({
          text: `Clave "${key}" encontrada en la posición ${rows[i].pos}.`,
          tone: "ok",
        })
        setBusy(false)
        return
      }
    }

    setMessage({
      text: `La clave "${key}" no se encuentra en el arreglo.`,
      tone: "warn",
    })
    setActive(null)
    setBusy(false)
  }

  const searchHash = async () => {
    if (busy || !rows) return
    const key = keyInput.trim()
    if (!key) {
      setMessage({ text: "Escribe una clave para buscar.", tone: "warn" })
      return
    }
    
    if (!hashAlgo || !collision || (collision === "Doble Función Hash" && !doubleHash)) {
      setMessage({ text: "Falta seleccionar algoritmo o método de colisión.", tone: "warn" })
      return
    }

    setBusy(true)
    setMessage({ text: `Calculando Hash para buscar "${key}"…`, tone: "info" })

    const N = rows.length
    const k = parseInt(key, 10)

    let initialExplanation: ReactNode = null
    let pos = computeInitialHash(k, hashAlgo, N)

    if (hashAlgo === "Hash Mod") {
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Mod</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-2">
            <li><strong>Fórmula:</strong> h(k) = (k mod N) + 1</li>
            <li>{renderLongDivision(k, N)}</li>
            <li className="pt-1 text-[#2b1610]">
              <strong>Posición asignada:</strong>{" "}
              <span className="font-bold text-[#a23b2a]">{pos}</span>{" "}
              <span className="text-xs opacity-75">(Residuo + 1)</span>
            </li>
          </ul>
        </div>
      )
    } else if (hashAlgo === "Hash Cuadrado") {
      const sq = (k * k).toString()
      const numDigits = Math.max(1, N.toString().length - 1)
      let startIdx = Math.floor((sq.length - numDigits) / 2)
      if (startIdx < 0) startIdx = 0
      const digits = sq.substring(startIdx, startIdx + numDigits)
      const extractedVal = parseInt(digits || "0", 10)
      const needsMod = extractedVal >= N
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Cuadrado</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li><strong>Clave al cuadrado:</strong> {k}² = {sq}</li>
            <li><strong>Dígitos centrales:</strong> "{digits}"</li>
            <li><strong>Fórmula:</strong> h(k) = {needsMod ? `(${digits} mod N) + 1` : `${digits} + 1`}</li>
            <li><strong>Posición inicial:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
          </ul>
        </div>
      )
    } else if (hashAlgo === "Truncamiento") {
      const str = k.toString()
      let trunc = ""
      for (let i = 0; i < str.length; i += 2) trunc += str[i]
      const extractedVal = parseInt(trunc || "0", 10)
      const needsMod = extractedVal >= N
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Truncamiento</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li><strong>Extracción (pos pares):</strong> "{trunc}"</li>
            <li><strong>Fórmula:</strong> h(k) = {needsMod ? `(${trunc} mod N) + 1` : `${trunc} + 1`}</li>
            <li><strong>Posición inicial:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
          </ul>
        </div>
      )
    } else if (hashAlgo === "Hash Plegamiento") {
      const str = k.toString()
      let sum = 0
      let parts = []
      for (let i = 0; i < str.length; i += 2) {
        let part = str.substring(i, i + 2)
        sum += parseInt(part, 10)
        parts.push(part)
      }
      const needsMod = sum >= N
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Plegamiento</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li><strong>División (2 en 2):</strong> {parts.join(" + ")} = {sum}</li>
            <li><strong>Fórmula:</strong> h(k) = {needsMod ? `(${sum} mod N) + 1` : `${sum} + 1`}</li>
            <li><strong>Posición inicial:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
          </ul>
        </div>
      )
    }

    const currentSteps: ReactNode[] = [initialExplanation]
    setHashExplanation({
      title: `Búsqueda Hash: ${hashAlgo}`,
      steps: [...currentSteps],
    })

    let attempts = 0
    let found = false

    while (attempts < N) {
      setActive({ pos, state: "compare" })
      await sleep(400)

      const rowIdx = pos - 1
      const currentRow = rows[rowIdx]

      const parts = currentRow.key.split(/, | -> /)
      const foundIdx = parts.indexOf(key)
      if (foundIdx !== -1) {
        setActive({ pos, state: "match", subIndex: foundIdx })
        if (parts.length > 1) {
          setMessage({ text: `¡Clave "${key}" encontrada en la posición ${pos} (columna ${foundIdx + 1})!`, tone: "ok" })
          currentSteps.push(
            <div key="match_nested" className="mb-4 mt-2">
              <p className="mb-1 font-semibold text-[#2f7d4f]">¡Clave encontrada!</p>
              <p className="text-sm text-[#2f7d4f]/90 ml-2">Ubicada en la posición {pos}, alojada en la columna {foundIdx + 1}.</p>
            </div>
          )
        } else {
          setMessage({ text: `¡Clave "${key}" encontrada en la posición ${pos}!`, tone: "ok" })
          currentSteps.push(
            <div key="match" className="mb-4 mt-2">
              <p className="mb-1 font-semibold text-[#2f7d4f]">¡Clave encontrada!</p>
              <p className="text-sm text-[#2f7d4f]/90 ml-2">Ubicada directamente en la posición {pos}.</p>
            </div>
          )
        }
        setHashExplanation({ title: `Búsqueda Hash: ${hashAlgo}`, steps: [...currentSteps] })
        found = true
        break
      }

      if (currentRow.key === "") {
        break
      }

      if (collision === "Lista Enlazada" || collision === "Arreglo Anidado") {
         break
      }

      setActive({ pos, state: "collide" })
      setMessage({ text: `Posición ${pos} ocupada por otra clave. Resolviendo colisión...`, tone: "warn" })
      
      await sleep(600)

      let oldPos = pos
      attempts++
      let formula = ""
      if (collision === "Solución Lineal") {
        pos = (pos % N) + 1
        formula = `(${oldPos} mod ${N}) + 1`
      } else if (collision === "Solución Cuadrática") {
        pos = ((pos - 1 + attempts * attempts) % N) + 1
        formula = `((${oldPos} - 1 + ${attempts}²) mod ${N}) + 1`
      } else if (collision === "Doble Función Hash") {
        const step = computeSecondaryHash(k, doubleHash, N)
        pos = ((pos - 1 + step) % N) + 1
        formula = `((${oldPos} - 1 + ${step}) mod ${N}) + 1`
      }
    }

    if (!found) {
      setMessage({ text: `La clave "${key}" no se encuentra en el arreglo.`, tone: "warn" })
      setActive(null)
    }

    setBusy(false)
  }

  const searchBinary = async () => {
    if (busy || !rows) return
    const key = keyInput.trim()
    if (!key) {
      setMessage({ text: "Escribe una clave para buscar.", tone: "warn" })
      return
    }

    const targetVal = parseInt(key, 10)
    if (isNaN(targetVal)) return

    let isSorted = true
    let previousValue = -Infinity
    const filledRows = rows.filter((r) => r.key !== "")

    for (const row of filledRows) {
      const val = parseInt(row.key, 10)
      if (val < previousValue) {
        isSorted = false
        break
      }
      previousValue = val
    }

    if (!isSorted) {
      setMessage({
        text: "Error: El arreglo DEBE estar ordenado para usar Búsqueda Binaria.",
        tone: "warn",
      })
      return
    }

    setBusy(true)
    let currentRows = rows.map((r) => ({ ...r, inactive: false }))

    let left = 0
    let right = currentRows.length - 1

    while (right >= 0 && currentRows[right].key === "") {
      currentRows[right].inactive = true
      right--
    }

    if (right < 0) {
      setMessage({ text: "El arreglo está vacío.", tone: "warn" })
      setBusy(false)
      return
    }

    setRows([...currentRows])
    await sleep(400)

    let found = false
    const n = currentRows.length
    const numBlocks = Math.ceil(Math.sqrt(n))
    const blockSize = Math.ceil(n / numBlocks) || 1

    if (isExternal) {
      let blockLeft = 0;
      let blockRight = numBlocks - 1;
      let targetBlock = -1;

      while (blockLeft <= blockRight) {
        let blockMid = Math.floor((blockLeft + blockRight) / 2);
        let startIdx = blockMid * blockSize;
        let endIdx = Math.min((blockMid + 1) * blockSize, n) - 1;

        while (endIdx >= startIdx && currentRows[endIdx].key === "") endIdx--;
        if (endIdx < startIdx) {
          blockRight = blockMid - 1;
          continue;
        }

        let minVal = parseInt(currentRows[startIdx].key, 10);
        let maxVal = parseInt(currentRows[endIdx].key, 10);
        
        setMessage({ text: `Evaluando Bloque ${blockMid + 1} (Rango: ${minVal} - ${maxVal})`, tone: "info" });
        setSplitRange({ left: currentRows[startIdx].pos, mid: currentRows[endIdx].pos, right: currentRows[endIdx].pos, activeHalf: "left" });
        await sleep(1000);
        setSplitRange(null);

        if (targetVal >= minVal && targetVal <= maxVal) {
          targetBlock = blockMid;
          break;
        } else if (targetVal < minVal) {
          blockRight = blockMid - 1;
          for(let b = blockMid; b <= numBlocks - 1; b++) {
            let s = b * blockSize;
            let e = Math.min((b + 1) * blockSize, n) - 1;
            for(let i=s; i<=e; i++) currentRows[i].inactive = true;
          }
          setRows([...currentRows]);
        } else {
          blockLeft = blockMid + 1;
          for(let b = 0; b <= blockMid; b++) {
            let s = b * blockSize;
            let e = Math.min((b + 1) * blockSize, n) - 1;
            for(let i=s; i<=e; i++) currentRows[i].inactive = true;
          }
          setRows([...currentRows]);
        }
      }

      if (targetBlock === -1) {
        setMessage({ text: `La clave "${key}" no se encuentra en ningún bloque válido.`, tone: "warn" });
        setActive(null);
        setBusy(false);
        return;
      }

      setMessage({ text: `Clave en rango del Bloque ${targetBlock + 1}. Iniciando búsqueda binaria interna...`, tone: "info" });
      await sleep(1000);
      left = targetBlock * blockSize;
      right = Math.min((targetBlock + 1) * blockSize, n) - 1;
      while (right >= left && currentRows[right].key === "") right--;
    }

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const midVal = parseInt(currentRows[mid].key, 10)

      setMessage({
        text: `Buscando: [Pos ${currentRows[left].pos} a ${currentRows[right].pos}] - Mitad: Pos ${currentRows[mid].pos}`,
        tone: "info",
      })

      for (let flash = 0; flash < 2; flash++) {
        setSplitRange({ left: currentRows[left].pos, mid: currentRows[mid].pos, right: currentRows[right].pos, activeHalf: "left" })
        await sleep(550)
        setSplitRange({ left: currentRows[left].pos, mid: currentRows[mid].pos, right: currentRows[right].pos, activeHalf: "right" })
        await sleep(550)
      }
      setSplitRange(null)
      await sleep(300)

      setActive({ pos: currentRows[mid].pos, state: "compare" })
      await sleep(600)

      if (midVal === targetVal) {
        setActive({ pos: currentRows[mid].pos, state: "match" })
        setMessage({
          text: `Clave "${key}" encontrada en la posición ${currentRows[mid].pos}.`,
          tone: "ok",
        })
        found = true
        break
      }

      if (midVal < targetVal) {
        for (let i = left; i <= mid; i++) {
          currentRows[i].inactive = true
        }
        left = mid + 1
      } else {
        for (let i = mid; i <= right; i++) {
          currentRows[i].inactive = true
        }
        right = mid - 1
      }

      setRows([...currentRows])
      await sleep(500)
    }

    if (!found) {
      setMessage({
        text: `La clave "${key}" no se encuentra en el arreglo.`,
        tone: "warn",
      })
      setActive(null)
    }

    setBusy(false)
  }

  const deleteSequential = async () => {
    if (busy || !rows) return
    const key = keyInput.trim()
    if (!key) {
      setMessage({ text: "Escribe la clave que deseas borrar.", tone: "warn" })
      return
    }
    
    if (isHash) {
      if (!hashAlgo || !collision || (collision === "Doble Función Hash" && !doubleHash)) {
        setMessage({ text: "Falta seleccionar algoritmo o método de colisión.", tone: "warn" })
        return
      }

      setBusy(true)
      setMessage({ text: `Calculando Hash para borrar "${key}"…`, tone: "info" })

      const N = rows.length
      const k = parseInt(key, 10)

      let initialExplanation: ReactNode = null
      let pos = computeInitialHash(k, hashAlgo, N)

      if (hashAlgo === "Hash Mod") {
        initialExplanation = (
          <div key="init" className="mb-4">
            <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Mod</p>
            <ul className="text-sm text-[#52241A]/80 ml-2 space-y-2">
              <li><strong>Fórmula:</strong> h(k) = (k mod N) + 1</li>
              <li>{renderLongDivision(k, N)}</li>
              <li className="pt-1 text-[#2b1610]">
                <strong>Posición asignada:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span>
              </li>
            </ul>
          </div>
        )
      } else if (hashAlgo === "Hash Cuadrado") {
        const sq = (k * k).toString()
        const numDigits = Math.max(1, N.toString().length - 1)
        let startIdx = Math.floor((sq.length - numDigits) / 2)
        if (startIdx < 0) startIdx = 0
        const digits = sq.substring(startIdx, startIdx + numDigits)
        const extractedVal = parseInt(digits || "0", 10)
        const needsMod = extractedVal >= N
        initialExplanation = (
          <div key="init" className="mb-4">
            <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Cuadrado</p>
            <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
              <li><strong>Clave al cuadrado:</strong> {k}² = {sq}</li>
              <li><strong>Dígitos centrales:</strong> "{digits}"</li>
              <li><strong>Fórmula:</strong> h(k) = {needsMod ? `(${digits} mod N) + 1` : `${digits} + 1`}</li>
              <li><strong>Posición inicial:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
            </ul>
          </div>
        )
      } else if (hashAlgo === "Truncamiento") {
        const str = k.toString()
        let trunc = ""
        for (let i = 0; i < str.length; i += 2) trunc += str[i]
        const extractedVal = parseInt(trunc || "0", 10)
        const needsMod = extractedVal >= N
        initialExplanation = (
          <div key="init" className="mb-4">
            <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Truncamiento</p>
            <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
              <li><strong>Extracción (pos pares):</strong> "{trunc}"</li>
              <li><strong>Fórmula:</strong> h(k) = {needsMod ? `(${trunc} mod N) + 1` : `${trunc} + 1`}</li>
              <li><strong>Posición inicial:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
            </ul>
          </div>
        )
      } else if (hashAlgo === "Hash Plegamiento") {
        const str = k.toString()
        let sum = 0
        let parts = []
        for (let i = 0; i < str.length; i += 2) {
          let part = str.substring(i, i + 2)
          sum += parseInt(part, 10)
          parts.push(part)
        }
        const needsMod = sum >= N
        initialExplanation = (
          <div key="init" className="mb-4">
            <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Plegamiento</p>
            <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
              <li><strong>División (2 en 2):</strong> {parts.join(" + ")} = {sum}</li>
              <li><strong>Fórmula:</strong> h(k) = {needsMod ? `(${sum} mod N) + 1` : `${sum} + 1`}</li>
              <li><strong>Posición inicial:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
            </ul>
          </div>
        )
      }

      const currentSteps: ReactNode[] = [initialExplanation]
      setHashExplanation({
        title: `Borrado Hash: ${hashAlgo}`,
        steps: [...currentSteps],
      })

      let attempts = 0
      let found = false

      while (attempts < N) {
        setActive({ pos, state: "compare" })
        await sleep(400)

        const rowIdx = pos - 1
        const currentRow = rows[rowIdx]

        const parts = currentRow.key.split(/, | -> /)
        const foundIdx = parts.indexOf(key)
        if (foundIdx !== -1) {
          setActive({ pos, state: "match", subIndex: foundIdx })
          await sleep(400)
          
          setRows((prev) => {
            if (!prev) return prev
            let newRows = [...prev]
            if (parts.length > 1) {
              const newParts = [...parts]
              newParts.splice(foundIdx, 1)
              const separator = collision === "Lista Enlazada" ? " -> " : ", "
              newRows[rowIdx] = { ...newRows[rowIdx], key: newParts.join(separator) }
            } else {
              newRows[rowIdx] = { ...newRows[rowIdx], key: "" }
            }
            
            newRows = rehashInstantly(newRows, hashAlgo, collision, doubleHash)
            return newRows
          })
          
          if (parts.length > 1) {
            setMessage({ text: `¡Clave "${key}" borrada de la posición ${pos} (columna ${foundIdx + 1})!`, tone: "ok" })
            currentSteps.push(
              <div key="match_nested" className="mb-4 mt-2">
                <p className="mb-1 font-semibold text-[#2f7d4f]">¡Clave borrada!</p>
                <p className="text-sm text-[#2f7d4f]/90 ml-2">Eliminada en la posición {pos}, alojada en la columna {foundIdx + 1}.</p>
              </div>
            )
          } else {
            setMessage({ text: `¡Clave "${key}" borrada de la posición ${pos}!`, tone: "ok" })
            currentSteps.push(
              <div key="match" className="mb-4 mt-2">
                <p className="mb-1 font-semibold text-[#2f7d4f]">¡Clave borrada!</p>
                <p className="text-sm text-[#2f7d4f]/90 ml-2">Eliminada directamente de la posición {pos}.</p>
              </div>
            )
          }
          setHashExplanation({ title: `Borrado Hash: ${hashAlgo}`, steps: [...currentSteps] })
          setKeyInput("")
          found = true
          break
        }

        if (currentRow.key === "") {
          break
        }

        if (collision === "Lista Enlazada" || collision === "Arreglo Anidado") {
           break
        }

        setActive({ pos, state: "collide" })
        setMessage({ text: `Posición ${pos} ocupada por otra clave. Buscando en siguiente...`, tone: "warn" })
        
        currentSteps.push(
          <div key={`col_detect_${attempts}`} className="mb-2">
            <p className="mb-1 font-semibold text-[#a23b2a]">Intento {attempts + 2}: Clave distinta en posición {pos}</p>
            <p className="text-sm text-[#52241A]/80 ml-2">Resolviendo mediante <strong>{collision}</strong>...</p>
          </div>
        )
        setHashExplanation({ title: `Borrado Hash: ${hashAlgo}`, steps: [...currentSteps] })

        attempts++
        if (collision === "Solución Lineal") {
          pos = (pos % N) + 1
        } else if (collision === "Solución Cuadrática") {
          pos = ((pos - 1 + attempts * attempts) % N) + 1
        } else if (collision === "Doble Función Hash") {
          const step = computeSecondaryHash(k, doubleHash, N)
          pos = ((pos - 1 + step) % N) + 1
        }

        currentSteps.push(
          <div key={`col_resolve_${attempts}`} className="mb-4 ml-2 border-l-2 border-[#E6B793] pl-3">
            <p className="text-sm text-[#52241A]/80">
              Nueva posición a revisar: <span className="font-bold text-[#a23b2a]">{pos}</span>
            </p>
          </div>
        )
        setHashExplanation({ title: `Borrado Hash: ${hashAlgo}`, steps: [...currentSteps] })
      }

      if (!found) {
        setMessage({ text: `La clave "${key}" no se encuentra en la tabla Hash.`, tone: "warn" })
      }
      
      setActive(null)
      setBusy(false)
      return
    }

    setBusy(true)
    setMessage({ text: `Borrando "${key}"…`, tone: "info" })

    if (activeOption === "Binaria") {
      let isSorted = true
      let previousValue = -Infinity
      const filledRows = rows.filter((r) => r.key !== "")
      for (const row of filledRows) {
        const val = parseInt(row.key, 10)
        if (val < previousValue) {
          isSorted = false
          break
        }
        previousValue = val
      }

      if (!isSorted) {
        setMessage({
          text: "Error: El arreglo DEBE estar ordenado para usar Búsqueda Binaria.",
          tone: "warn",
        })
        setBusy(false)
        return
      }

      let currentRows = rows.map((r) => ({ ...r, inactive: false }))
      let left = 0
      let right = currentRows.length - 1

      while (right >= 0 && currentRows[right].key === "") {
        currentRows[right].inactive = true
        right--
      }

      if (right < 0) {
        setMessage({ text: "El arreglo está vacío.", tone: "warn" })
        setBusy(false)
        return
      }

      setRows([...currentRows])
      await sleep(400)

      let foundIndex = -1
      const targetVal = parseInt(key, 10)

      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const midVal = parseInt(currentRows[mid].key, 10)

        setMessage({
          text: `Buscando para borrar: [Pos ${currentRows[left].pos} a ${currentRows[right].pos}] - Mitad: Pos ${currentRows[mid].pos}`,
          tone: "info",
        })

        for (let flash = 0; flash < 2; flash++) {
          setSplitRange({ left: currentRows[left].pos, mid: currentRows[mid].pos, right: currentRows[right].pos, activeHalf: "left" })
          await sleep(550)
          setSplitRange({ left: currentRows[left].pos, mid: currentRows[mid].pos, right: currentRows[right].pos, activeHalf: "right" })
          await sleep(550)
        }
        setSplitRange(null)
        await sleep(300)

        setActive({ pos: currentRows[mid].pos, state: "compare" })
        await sleep(600)

        if (midVal === targetVal) {
          foundIndex = mid
          break
        }

        if (midVal < targetVal) {
          for (let i = left; i <= mid; i++) {
            currentRows[i].inactive = true
          }
          left = mid + 1
        } else {
          for (let i = mid; i <= right; i++) {
            currentRows[i].inactive = true
          }
          right = mid - 1
        }

        setRows([...currentRows])
        await sleep(500)
      }

      if (foundIndex !== -1) {
        setActive({ pos: currentRows[foundIndex].pos, state: "match" })
        await sleep(400)
        setRows((prev) => {
          if (!prev) return prev
          const newRows = [...prev].map(r => ({ ...r, inactive: false }))
          newRows[foundIndex] = { ...newRows[foundIndex], key: "" }
          const allKeys = newRows.filter((r) => r.key !== "").map((r) => r.key)
          for (let j = 0; j < newRows.length; j++) {
            newRows[j] = { ...newRows[j], key: j < allKeys.length ? allKeys[j] : "" }
          }
          return newRows
        })
        setMessage({
          text: `Clave "${key}" borrada de la posición ${currentRows[foundIndex].pos}.`,
          tone: "ok",
        })
        setKeyInput("")
      } else {
        setMessage({
          text: `La clave "${key}" no existe en el arreglo.`,
          tone: "warn",
        })
      }
      setActive(null)
      setBusy(false)
      return
    }

    for (let i = 0; i < rows.length; i++) {
      setActive({ pos: rows[i].pos, state: "compare" })
      await sleep(320)

      if (rows[i].key === key) {
        setActive({ pos: rows[i].pos, state: "match" })
        await sleep(400)
        setRows((prev) => {
          if (!prev) return prev
          const newRows = [...prev]
          newRows[i] = { ...newRows[i], key: "" }
          const allKeys = newRows.filter((r) => r.key !== "").map((r) => r.key)
          for (let j = 0; j < newRows.length; j++) {
            newRows[j] = { ...newRows[j], key: j < allKeys.length ? allKeys[j] : "" }
          }
          return newRows
        })
        setMessage({
          text: `Clave "${key}" borrada de la posición ${rows[i].pos}.`,
          tone: "ok",
        })
        setKeyInput("")
        setActive(null)
        setBusy(false)
        return
      }
    }

    setMessage({
      text: `La clave "${key}" no existe en el arreglo.`,
      tone: "warn",
    })
    setActive(null)
    setBusy(false)
  }

  const insertKeyToTree = async () => {
    if (busy) return
    const key = keyInput.trim()
    if (!key) {
      setMessage({ text: "Escribe la clave que deseas insertar.", tone: "warn" })
      return
    }
    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(key)) {
      setMessage({ text: "Solo se permiten valores alfabéticos en los árboles.", tone: "warn" })
      return
    }

    setBusy(true)
    setMessage({ text: `Insertando "${key}" en ${treeAlgo}…`, tone: "info" })
    
    // @ts-ignore - frames will be checked dynamically
    let result: { newRoot: TreeNode | null; steps: string[]; frames?: any[]; logicData?: any } = { newRoot: null, steps: [] }

    if (treeAlgo === "Búsqueda Digital") {
      result = insertDigitalTree(treeData, key)
    } else if (treeAlgo === "Búsqueda por Residuos") {
      result = insertRadixTree(treeData, key)
    } else if (treeAlgo === "Búsqueda por Residuos Múltiples") {
      result = insertMultiRadixTree(treeData, key)
    } else if (treeAlgo === "Árbol de Huffman") {
      const newText = huffmanText + key
      setHuffmanText(newText)
      result = buildHuffmanTree(newText)
    }

    if (result.logicData) {
      setTreeData(result.newRoot)
      setHashExplanation({
        title: treeAlgo,
        steps: [<HuffmanExplanation key="huffman" data={result.logicData} />]
      })
    } else if (result.frames && result.frames.length > 0) {
      setHashExplanation({ title: treeAlgo, steps: [] })
      for (let i = 0; i < result.frames.length; i++) {
        const frame = result.frames[i]
        setTreeData(frame.treeState)
        setHashExplanation((prev) => {
          if (!prev) return null
          return {
            title: prev.title,
            steps: [
              ...prev.steps,
              <div key={`tree_step_${i}`} className="mb-2 ml-2 border-l-2 border-[#E6B793] pl-3">
                <p className="text-sm text-[#52241A]/80">{frame.description}</p>
              </div>
            ]
          }
        })
        await sleep(400)
      }
      setTreeData(result.newRoot)
    } else {
      setTreeData(result.newRoot)
      setHashExplanation({ 
        title: treeAlgo, 
        steps: result.steps.map((s,i) => (
          <div key={`tree_step_${i}`} className="mb-2 ml-2 border-l-2 border-[#E6B793] pl-3">
            <p className="text-sm text-[#52241A]/80">{s}</p>
          </div>
        )) 
      })
    }
    
    setMessage({ text: `Operación completada en ${treeAlgo}.`, tone: "ok" })
    if (treeAlgo !== "Árbol de Huffman") setKeyInput("")
    setBusy(false)
  }

  const insertHash = async (customKey?: string) => {
    if (busy || !rows) return
    const key = (customKey ?? keyInput).trim()
    const error = validateKey(key)
    if (error) {
      setMessage({ text: error, tone: "warn" })
      return
    }
    
    if (!hashAlgo || !collision || (collision === "Doble Función Hash" && !doubleHash)) {
      setMessage({ text: "Falta seleccionar algoritmo o método de colisión.", tone: "warn" })
      return
    }

    setBusy(true)
    setMessage({ text: `Calculando Hash para "${key}"…`, tone: "info" })

    const N = rows.length
    const k = parseInt(key, 10)

    let initialExplanation: ReactNode = null
    let pos = computeInitialHash(k, hashAlgo, N)

    if (hashAlgo === "Hash Mod") {
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Mod</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-2">
            <li>
              <strong>Fórmula:</strong> h(k) = (k mod N) + 1
            </li>

            <li>{renderLongDivision(k, N)}</li>

            <li className="pt-1 text-[#2b1610]">
              <strong>Posición asignada:</strong>{" "}
              <span className="font-bold text-[#a23b2a]">{pos}</span>{" "}
              <span className="text-xs opacity-75">(Residuo + 1)</span>
            </li>
          </ul>
        </div>
      )
    } else if (hashAlgo === "Hash Cuadrado") {
      const sq = (k * k).toString()
      const numDigits = Math.max(1, N.toString().length - 1)
      let startIdx = Math.floor((sq.length - numDigits) / 2)
      if (startIdx < 0) startIdx = 0
      const digits = sq.substring(startIdx, startIdx + numDigits)
      const extractedVal = parseInt(digits || "0", 10)
      const needsMod = extractedVal >= N
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">
            1. Cálculo Hash Cuadrado
          </p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li>
              <strong>Clave al cuadrado:</strong> {k}² = {sq}
            </li>
            <li>
              <strong>Dígitos centrales:</strong> "{digits}"
            </li>
            <li>
              <strong>Fórmula:</strong> h(k) = {needsMod ? `(${digits} mod N) + 1` : `${digits} + 1`}
            </li>
            <li>
              <strong>Posición inicial asignada:</strong>{" "}
              <span className="font-bold text-[#a23b2a]">{pos}</span>
            </li>
          </ul>
        </div>
      )
    } else if (hashAlgo === "Truncamiento") {
      const str = k.toString()
      let trunc = ""
      for (let i = 0; i < str.length; i += 2) trunc += str[i]
      const extractedVal = parseInt(trunc || "0", 10)
      const needsMod = extractedVal >= N
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">
            1. Cálculo Truncamiento
          </p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li>
              <strong>Extracción (pos pares):</strong> "{trunc}"
            </li>
            <li>
              <strong>Fórmula:</strong> h(k) = {needsMod ? `(${trunc} mod N) + 1` : `${trunc} + 1`}
            </li>
            <li>
              <strong>Posición inicial asignada:</strong>{" "}
              <span className="font-bold text-[#a23b2a]">{pos}</span>
            </li>
          </ul>
        </div>
      )
    } else if (hashAlgo === "Hash Plegamiento") {
      const str = k.toString()
      let sum = 0
      let parts = []
      for (let i = 0; i < str.length; i += 2) {
        let part = str.substring(i, i + 2)
        sum += parseInt(part, 10)
        parts.push(part)
      }
      const needsMod = sum >= N
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">
            1. Cálculo Hash Plegamiento
          </p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li>
              <strong>División (2 en 2):</strong> {parts.join(" + ")} = {sum}
            </li>
            <li>
              <strong>Fórmula:</strong> h(k) = {needsMod ? `(${sum} mod N) + 1` : `${sum} + 1`}
            </li>
            <li>
              <strong>Posición inicial asignada:</strong>{" "}
              <span className="font-bold text-[#a23b2a]">{pos}</span>
            </li>
          </ul>
        </div>
      )
    }

    const currentSteps: ReactNode[] = [initialExplanation]
    setHashExplanation({
      title: `Algoritmo: ${hashAlgo}`,
      steps: [...currentSteps],
    })

    let currentRows = [...rows]
    let attempts = 0
    let inserted = false

    while (attempts < N) {
      setActive({ pos, state: "compare" })
      await sleep(400)

      const rowIdx = pos - 1
      const currentRow = currentRows[rowIdx]

      const parts = currentRow.key.split(/, | -> /)
      if (parts.includes(key)) {
        setActive({ pos, state: "match" })
        setMessage({ text: `La clave "${key}" ya existe.`, tone: "warn" })
        break
      }

      if (currentRow.key === "") {
        setActive({ pos, state: "insert" })
        currentRow.key = key
        setRows([...currentRows])
        setMessage({
          text: `Clave "${key}" insertada en la posición ${pos}.`,
          tone: "ok",
        })
        setKeyInput("")
        await sleep(600)
        inserted = true
        break
      } else {
        if (collision === "Lista Enlazada" || collision === "Arreglo Anidado") {
          setActive({ pos, state: "collide" })
          currentRow.collidingKey = key
          setRows([...currentRows])
          setMessage({
            text: `Colisión en pos ${pos}. Anidando valor...`,
            tone: "warn",
          })

          setHashExplanation({
            title: `Algoritmo: ${hashAlgo}`,
            steps: [...currentSteps],
          })

          await sleep(600)

          currentRow.key =
            currentRow.key +
            (collision === "Lista Enlazada" ? " -> " : ", ") +
            key
          currentRow.collidingKey = undefined
          setActive({ pos, state: "resolve" })
          setRows([...currentRows])
          setMessage({
            text: `Clave anidada en posición ${pos}.`,
            tone: "ok",
          })
          setKeyInput("")
          await sleep(600)
          inserted = true
          break
        }

        setActive({ pos, state: "collide" })
        currentRow.collidingKey = key
        setRows([...currentRows])
        setMessage({
          text: `Colisión en posición ${pos}. Resolviendo...`,
          tone: "warn",
        })

        await sleep(600)

        currentRow.collidingKey = undefined
        setRows([...currentRows])

        let oldPos = pos
        attempts++
        let formula = ""
        if (collision === "Solución Lineal") {
          pos = (pos % N) + 1
          formula = `(${oldPos} mod ${N}) + 1`
        } else if (collision === "Solución Cuadrática") {
          pos = ((pos - 1 + attempts * attempts) % N) + 1
          formula = `((${oldPos} - 1 + ${attempts}²) mod ${N}) + 1`
        } else if (collision === "Doble Función Hash") {
          const step = computeSecondaryHash(k, doubleHash, N)
          pos = ((pos - 1 + step) % N) + 1
          formula = `((${oldPos} - 1 + ${step}) mod ${N}) + 1`
        }
      }
    }

    if (!inserted && attempts >= N) {
      setMessage({
        text: "La tabla Hash está llena o no se encontró espacio.",
        tone: "warn",
      })
    }

    setActive(null)
    setBusy(false)
  }

  const insertAuto = () => {
    if (busy || !rows) return
    const min = Math.pow(10, keySize - 1)
    const max = Math.pow(10, keySize) - 1

    const existingKeys = new Set<string>()
    rows.forEach((r) => {
      if (r.key) {
        r.key.split(/, | -> /).forEach((k) => existingKeys.add(k.trim()))
      }
      if (r.collidingKey) {
        existingKeys.add(r.collidingKey.trim())
      }
    })

    let randStr = ""
    let attempts = 0
    const maxAttempts = 500

    do {
      if (keySize === 1) {
        randStr = Math.floor(Math.random() * 10).toString()
      } else {
        randStr = Math.floor(Math.random() * (max - min + 1) + min).toString()
      }
      attempts++
    } while (existingKeys.has(randStr) && attempts < maxAttempts)

    if (existingKeys.has(randStr)) {
      setMessage({
        text: "No se pudo generar una clave única. Intenta aumentar el tamaño de la clave.",
        tone: "warn",
      })
      return
    }

    setKeyInput(randStr)
    if (isHash) {
      insertHash(randStr)
    } else {
      insertSequential(randStr)
    }
  }



  const hasData = rows ? rows.some((r) => r.key !== "") : false

  return (
    <div className="grid h-screen w-full grid-rows-[auto_1fr] bg-[#faf6f2] text-[#2b1610]">
      <Header
        current={current}
        activeOption={activeOption}
        collapsed={collapsed}
        onAlgorithmChange={handleAlgorithmChange}
      />

      <div
        className="grid min-h-0"
        style={{ gridTemplateColumns: `${collapsed ? 64 : 196}px 1fr` }}
      >
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sections={SECTIONS}
          activeSection={activeSection}
          selectSection={selectSection}
        />

        <main className="min-w-0 overflow-auto bg-[#faf6f2] p-8">
          {!(isTableView || isTree) ? (
            <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center rounded-2xl border border-dashed border-[#52241A]/15 text-center">
              <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-[#52241A]/40">
                {current.label}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#52241A]">
                {activeOption}
              </h2>
              <p className="mt-3 max-w-md text-sm text-[#52241A]/55">
                {activeOption === "Búsquedas Dinámicas" 
                  ? "Esta sección se encuentra en desarrollo y no está funcional por el momento." 
                  : "El contenido de esta sección se mostrará aquí."}
              </p>
            </div>
          ) : (
            <div className="mx-auto flex h-full max-w-6xl flex-col gap-5">
              {isTree ? (
                <TopTreeControls
                  hasData={!!treeData}
                  busy={busy}
                  treeAlgo={treeAlgo}
                  setTreeAlgo={setTreeAlgo}
                  clearTree={() => {
                    setTreeData(null)
                    setHuffmanText("")
                    setMessage(null)
                    setHashExplanation(null)
                  }}
                  onSave={handleSave}
                  onOpen={handleOpen}
                />
              ) : (
                <TopControls
                  isHash={isHash}
                  hasData={!!rows && rows.length > 0}
                  hasInsertedData={hasInsertedData}
                  busy={busy}
                  keySize={keySize}
                  setKeySize={setKeySize}
                  arraySizeInput={arraySizeInput}
                  setArraySizeInput={setArraySizeInput}
                  hashAlgo={hashAlgo}
                  requestChange={requestChange}
                  collision={collision}
                  doubleHash={doubleHash}
                  triggerRehash={triggerRehash}
                  generateTable={generateTable}
                  clearTable={() => {
                    setRows(null)
                    setActive(null)
                    setMessage(null)
                    setHashExplanation(null)
                  }}
                  onSave={handleSave}
                  onOpen={handleOpen}
                />
              )}

              <div className="min-h-0 flex-1 flex gap-4">
                {isTree ? (
                  <TreeView treeData={treeData} />
                ) : (
                  <TableView rows={rows} active={active} isHash={isHash} collision={collision} splitRange={splitRange} isExternal={isExternal} />
                )}

                <HashExplanation
                  isHash={isHash || isTree}
                  hashExplanation={hashExplanation}
                />
              </div>

              {isTree ? (
                <BottomTreeControls
                  busy={busy}
                  hasData={!!treeData}
                  treeAlgo={treeAlgo}
                  keyInput={keyInput}
                  setKeyInput={setKeyInput}
                  insertKey={insertKeyToTree}
                  deleteKey={deleteKeyFromTree}
                  searchKey={handleTreeSearch}
                />
              ) : (
                <BottomControls
                  isHash={isHash}
                  busy={busy}
                  hasRows={!!rows && rows.length > 0}
                  keyInput={keyInput}
                  setKeyInput={setKeyInput}
                  insertHash={() => insertHash()}
                  insertSequential={() => insertSequential()}
                  insertAuto={insertAuto}
                  deleteSequential={deleteSequential}
                  handleSearch={isHash ? searchHash : handleSearch}
                  hashAlgo={hashAlgo}
                  collision={collision}
                  requestChange={requestChange}
                  doubleHash={doubleHash}
                  collisionOpen={collisionOpen}
                  setCollisionOpen={setCollisionOpen}
                  triggerRehash={triggerRehash}
                />
              )}

              {message && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium ${
                    message.tone === "ok"
                      ? "bg-[#2f7d4f]/12 text-[#256b42]"
                      : message.tone === "warn"
                      ? "bg-[#a23b2a]/12 text-[#a23b2a]"
                      : "bg-[#52241A]/8 text-[#52241A]"
                  }`}
                >
                  <span
                    className={`inline-block size-2 shrink-0 rounded-full ${
                      message.tone === "ok"
                        ? "bg-[#2f7d4f]"
                        : message.tone === "warn"
                        ? "bg-[#a23b2a]"
                        : "bg-[#52241A] motion-safe:animate-pulse"
                    }`}
                  />
                  {message.text}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <ConfirmModal 
        pendingChange={pendingChange} 
        applyChange={applyChange} 
        cancelChange={cancelChange} 
        activeOption={activeOption}
        hasInsertedData={hasInsertedData}
        hasTreeData={!!treeData}
      />
    </div>
  )
}
