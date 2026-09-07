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
import DynamicTableView from "./components/DynamicTableView"
import DynamicLogicPanel from "./components/DynamicLogicPanel"
import { insertDigitalTree, searchDigitalTree, deleteDigitalTree, insertRadixTree, searchRadixTree, deleteRadixTree, insertMultiRadixTree, searchMultiRadixTree, deleteMultiRadixTree, buildHuffmanTree } from "./utils/treeUtils"
import { DynamicState, DynamicConfig, insertDynamicKey, deleteDynamicKey } from "./utils/dynamicHashUtils"

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("internas")
  const [activeOption, setActiveOption] = useState<string>("Secuencial")

  // ── Estado de la tabla ──────────────────────────────
  const [keySize, setKeySize] = useState(1)
  const [arraySizeInput, setArraySizeInput] = useState("")
  const [rows, setRows] = useState<Row[] | null>(null)

  // ── Estado Búsquedas Dinámicas ──────────────────────
  const [dynamicConfig, setDynamicConfig] = useState<DynamicConfig>({
    initialBuckets: 2,
    recordsPerBucket: 3,
    expThreshold: 85,
    redThreshold: 105,
    isPartial: false
  })
  const [dynamicState, setDynamicState] = useState<DynamicState | null>(null)
  const [animatingDynamic, setAnimatingDynamic] = useState<{
    isAnimating: boolean
    oldState: DynamicState
    newState: DynamicState
  } | null>(null)

  // ── Estado Hashing (Transformación de Claves) ───────
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

  const hasInsertedData = !!((rows && rows.some(r => r.key !== "")) || treeData || (dynamicState && dynamicState.keys.length > 0))

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
      return rehashInstantly(prev, algo, coll, double, isExternal)
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
        setDynamicState(null)
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
      const isDynamic = change.option.startsWith("Búsquedas Dinámicas")
      if (isDynamic) {
        setDynamicState(null)
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
    
    const lastFrame = result.frames && result.frames.length > 0 ? result.frames[result.frames.length - 1] : null;
    const isFound = result.found !== undefined ? result.found : (lastFrame && lastFrame.description.includes("encontrada"));

    if (isFound) {
      setMessage({ text: `¡La clave "${key}" fue encontrada!`, tone: "ok" })
    } else {
      setMessage({ text: `La clave "${key}" no se encuentra en el árbol.`, tone: "warn" })
    }
    
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
      const targetVal = parseInt(key, 10)
      
      for (let b = 0; b < numBlocks; b++) {
        let startIdx = b * blockSize;
        let endIdx = Math.min((b + 1) * blockSize, n) - 1;
        
        let lastIdx = endIdx;
        while (lastIdx >= startIdx && currentRows[lastIdx].key === "") {
          lastIdx--;
        }
        if (lastIdx < startIdx) {
          for (let i = startIdx; i <= endIdx; i++) currentRows[i].inactive = true;
          setRows([...currentRows]);
          continue;
        }

        let lastVal = parseInt(currentRows[lastIdx].key, 10);

        setMessage({ text: `Evaluando Bloque ${b + 1}...`, tone: "info" });
        setActive({ pos: currentRows[lastIdx].pos, state: "compare" });
        await sleep(1000);

        if (targetVal > lastVal) {
           setMessage({ text: `Clave mayor a ${lastVal} (último del bloque). Saltando al siguiente bloque...`, tone: "info" });
           for (let i = startIdx; i <= endIdx; i++) currentRows[i].inactive = true;
           setRows([...currentRows]);
           await sleep(500);
           continue;
        } else {
           setMessage({ text: `Clave <= ${lastVal}. Iniciando búsqueda secuencial en Bloque ${b + 1}...`, tone: "info" });
           await sleep(1000);
           
           for (let i = startIdx; i <= lastIdx; i++) {
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
           break;
        }
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

    const nTotal = rows.length
    const numBlocks = Math.ceil(Math.sqrt(nTotal))
    const blockSize = Math.ceil(nTotal / numBlocks) || 1
    const N = isExternal ? numBlocks : nTotal
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

    if (isExternal) {
      while (attempts < N) {
        let b = pos - 1
        if (b >= numBlocks) b = numBlocks - 1

        let startIdx = b * blockSize
        let endIdx = Math.min((b + 1) * blockSize, nTotal) - 1

        setMessage({ text: `Hash = ${pos}. Cargando Bloque ${b + 1} a memoria...`, tone: "info" })
        await sleep(1000)

        let currentRows = rows.map((r) => ({ ...r, inactive: true }))
        for (let i = startIdx; i <= endIdx; i++) {
          currentRows[i].inactive = false
        }
        setRows([...currentRows])

        let blockFull = true
        for (let i = startIdx; i <= endIdx; i++) {
          if (currentRows[i].key === "") {
            blockFull = false
            continue
          }

          setActive({ pos: currentRows[i].pos, state: "compare" })
          await sleep(320)

          const parts = currentRows[i].key.split(/, | -> /)
          if (parts.includes(key)) {
            setActive({ pos: currentRows[i].pos, state: "match" })
            setMessage({ text: `Clave "${key}" encontrada en el Bloque ${b + 1} (posición ${currentRows[i].pos}).`, tone: "ok" })
            found = true
            break
          }
        }

        if (found) break

        if (!blockFull) {
          break
        }

        attempts++
        if (collision === "Solución Lineal" || collision === "Lista Enlazada" || collision === "Arreglo Anidado") {
          pos = (pos % N) + 1
        } else if (collision === "Solución Cuadrática") {
          pos = ((pos - 1 + attempts * attempts) % N) + 1
        } else if (collision === "Doble Función Hash") {
          const step = computeSecondaryHash(k, doubleHash, N)
          pos = ((pos - 1 + step) % N) + 1
        }
      }

      if (!found) {
        setMessage({ text: `La clave "${key}" no se encuentra en la tabla externa.`, tone: "warn" })
        setActive(null)
      }
      setBusy(false)
      return
    }

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
      if (collision === "Solución Lineal") {
        pos = (pos % N) + 1
      } else if (collision === "Solución Cuadrática") {
        pos = ((pos - 1 + attempts * attempts) % N) + 1
      } else if (collision === "Doble Función Hash") {
        const step = computeSecondaryHash(k, doubleHash, N)
        pos = ((pos - 1 + step) % N) + 1
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

      const nTotal = rows.length
      const numBlocks = Math.ceil(Math.sqrt(nTotal))
      const blockSize = Math.ceil(nTotal / numBlocks) || 1
      const N = isExternal ? numBlocks : nTotal
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

      if (isExternal) {
        while (attempts < N) {
          let b = pos - 1
          if (b >= numBlocks) b = numBlocks - 1

          let startIdx = b * blockSize
          let endIdx = Math.min((b + 1) * blockSize, nTotal) - 1

          setMessage({ text: `Hash = ${pos}. Cargando Bloque ${b + 1} a memoria...`, tone: "info" })
          await sleep(1000)

          let currentRows = rows.map((r) => ({ ...r, inactive: true }))
          for (let i = startIdx; i <= endIdx; i++) {
            currentRows[i].inactive = false
          }
          setRows([...currentRows])

          let blockFull = true
          for (let i = startIdx; i <= endIdx; i++) {
            if (currentRows[i].key === "") {
              blockFull = false
              continue
            }

            setActive({ pos: currentRows[i].pos, state: "compare" })
            await sleep(400)

            const parts = currentRows[i].key.split(/, | -> /)
            const foundIdx = parts.indexOf(key)
            
            if (foundIdx !== -1) {
              setActive({ pos: currentRows[i].pos, state: "match", subIndex: foundIdx })
              await sleep(400)
              
              setRows((prev) => {
                if (!prev) return prev
                let newRows = [...prev]
                if (parts.length > 1) {
                  const newParts = [...parts]
                  newParts.splice(foundIdx, 1)
                  const separator = collision === "Lista Enlazada" ? " -> " : ", "
                  newRows[i] = { ...newRows[i], key: newParts.join(separator) }
                } else {
                  newRows[i] = { ...newRows[i], key: "" }
                }
                return newRows
              })

              setMessage({ text: `¡Clave "${key}" borrada del Bloque ${b + 1}!`, tone: "ok" })
              setKeyInput("")
              found = true
              break
            }
          }
          
          if (found) break

          if (!blockFull) {
            break
          }

          attempts++
          if (collision === "Solución Lineal" || collision === "Lista Enlazada" || collision === "Arreglo Anidado") {
            pos = (pos % N) + 1
          } else if (collision === "Solución Cuadrática") {
            pos = ((pos - 1 + attempts * attempts) % N) + 1
          } else if (collision === "Doble Función Hash") {
            const step = computeSecondaryHash(k, doubleHash, N)
            pos = ((pos - 1 + step) % N) + 1
          }
        }

        if (!found) {
          setMessage({ text: `La clave "${key}" no se encuentra en la tabla externa.`, tone: "warn" })
        }
        setActive(null)
        setBusy(false)
        return
      }

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
            
            newRows = rehashInstantly(newRows, hashAlgo, collision, doubleHash, isExternal)
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
    
    // @ts-ignore
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

    const nTotal = rows.length
    const numBlocks = Math.ceil(Math.sqrt(nTotal))
    const blockSize = Math.ceil(nTotal / numBlocks) || 1
    const N = isExternal ? numBlocks : nTotal
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

    if (isExternal) {
      while (attempts < N) {
        let b = pos - 1
        if (b >= numBlocks) b = numBlocks - 1

        let startIdx = b * blockSize
        let endIdx = Math.min((b + 1) * blockSize, nTotal) - 1

        setMessage({ text: `Hash = ${pos}. Cargando Bloque ${b + 1} a memoria...`, tone: "info" })
        await sleep(1000)

        currentRows = currentRows.map((r) => ({ ...r, inactive: true }))
        for (let i = startIdx; i <= endIdx; i++) {
          currentRows[i].inactive = false
        }
        setRows([...currentRows])

        let blockFull = true
        for (let i = startIdx; i <= endIdx; i++) {
          setActive({ pos: currentRows[i].pos, state: "compare" })
          await sleep(400)

          const parts = currentRows[i].key.split(/, | -> /)
          if (parts.includes(key)) {
            setActive({ pos: currentRows[i].pos, state: "match" })
            setMessage({ text: `La clave "${key}" ya existe.`, tone: "warn" })
            inserted = true
            break
          }

          if (currentRows[i].key === "") {
            blockFull = false
            setActive({ pos: currentRows[i].pos, state: "insert" })
            currentRows[i].key = key
            setRows([...currentRows])
            setMessage({ text: `Clave "${key}" insertada en el Bloque ${b + 1} (posición ${currentRows[i].pos}).`, tone: "ok" })
            setKeyInput("")
            await sleep(600)
            inserted = true
            break
          }
        }

        if (inserted) break

        if (blockFull) {
          setMessage({ text: `El Bloque ${b + 1} está lleno. Buscando siguiente...`, tone: "warn" })
          await sleep(600)
        }

        attempts++
        if (collision === "Solución Lineal" || collision === "Lista Enlazada" || collision === "Arreglo Anidado") {
          pos = (pos % N) + 1
        } else if (collision === "Solución Cuadrática") {
          pos = ((pos - 1 + attempts * attempts) % N) + 1
        } else if (collision === "Doble Función Hash") {
          const step = computeSecondaryHash(k, doubleHash, N)
          pos = ((pos - 1 + step) % N) + 1
        }
      }

      if (!inserted) {
        setMessage({ text: `La tabla está llena, no se pudo insertar "${key}".`, tone: "warn" })
      }
      setActive(null)
      setBusy(false)
      return
    }

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
        if (collision === "Solución Lineal") {
          pos = (pos % N) + 1
        } else if (collision === "Solución Cuadrática") {
          pos = ((pos - 1 + attempts * attempts) % N) + 1
        } else if (collision === "Doble Función Hash") {
          const step = computeSecondaryHash(k, doubleHash, N)
          pos = ((pos - 1 + step) % N) + 1
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
    if (busy || (!rows && !dynamicState && !treeData)) return
    const min = Math.pow(10, keySize - 1)
    const max = Math.pow(10, keySize) - 1

    const existingKeys = new Set<string>()
    if (rows) {
      rows.forEach((r) => {
        if (r.key) {
          r.key.split(/, | -> /).forEach((k) => existingKeys.add(k.trim()))
        }
        if (r.collidingKey) {
          existingKeys.add(r.collidingKey.trim())
        }
      })
    } else if (dynamicState) {
      dynamicState.keys.forEach((k) => existingKeys.add(k.toString()))
    }

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
    } else if (isDynamic) {
      handleDynamicAction("insert", randStr)
    } else {
      insertSequential(randStr)
    }
  }

  const isDynamic = activeOption.startsWith("Búsquedas Dinámicas")

  // Modificadores de Configuración Dinámica
  const handleDynamicConfigChange = (field: keyof DynamicConfig, value: any) => {
    const newConfig = { ...dynamicConfig, [field]: value }
    setDynamicConfig(newConfig)
    
    if (dynamicState && dynamicState.keys.length === 0) {
      setDynamicState({
        ...dynamicState,
        config: newConfig,
        currentBuckets: newConfig.initialBuckets
      })
    }
  }

  const handleDynamicAction = async (action: "insert" | "delete", autoKey?: string) => {
    const keyToProcess = autoKey || keyInput.trim()
    if (!keyToProcess) {
      setMessage({ text: "Escribe una clave válida.", tone: "warn" })
      return
    }
    
    // Validar numérico
    if (!/^-?\d+$/.test(keyToProcess)) {
      setMessage({ text: "Solo se permiten claves numéricas para Búsquedas Dinámicas.", tone: "warn" })
      return
    }

    if (busy) return
    setBusy(true)

    let prevState = dynamicState
    if (!prevState) {
       prevState = {
         config: dynamicConfig,
         currentBuckets: dynamicConfig.initialBuckets,
         keys: [],
         history: []
       }
    }

    let newState: DynamicState | null = null
    if (action === "insert") {
      newState = insertDynamicKey(prevState, keyToProcess)
    } else {
      newState = deleteDynamicKey(prevState, keyToProcess)
    }

    if (newState && newState.currentBuckets !== prevState.currentBuckets) {
      setAnimatingDynamic({
        isAnimating: true,
        oldState: prevState,
        newState: newState
      })
      
      await sleep(2500) // tiempo de visualización de la animación
      
      setAnimatingDynamic(null)
    }

    setDynamicState(newState)
    setMessage({ text: `Clave ${keyToProcess} procesada${action === 'delete' ? ' (borrado)' : ''}.`, tone: "ok" })
    
    if (!autoKey) {
      setKeyInput("")
    }
    setBusy(false)
  }

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
          {!(isTableView || isTree || isDynamic) ? (
            <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center rounded-2xl border border-dashed border-[#52241A]/15 text-center">
              <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-[#52241A]/40">
                {current.label}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#52241A]">
                {activeOption}
              </h2>
              <p className="mt-3 max-w-md text-sm text-[#52241A]/55">
                El contenido de esta sección se mostrará aquí.
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
              ) : !isDynamic && (
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

              {isDynamic && (
                <div className="flex items-end gap-1.5 flex-wrap">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
                      Tamaño de la clave
                    </span>
                    <select
                      value={keySize}
                      onChange={(e) => setKeySize(Number(e.target.value))}
                      disabled={!!dynamicState || busy}
                      className="h-10 w-16 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[13px] text-[#2b1610] shadow-sm outline-none transition focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
                      Número de cubetas
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={dynamicConfig.initialBuckets}
                      onChange={(e) => handleDynamicConfigChange("initialBuckets", parseInt(e.target.value) || 2)}
                      disabled={!!dynamicState}
                      className="h-10 w-24 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
                      Nº de registros por cubeta
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={dynamicConfig.recordsPerBucket}
                      onChange={(e) => handleDynamicConfigChange("recordsPerBucket", parseInt(e.target.value) || 3)}
                      disabled={!!dynamicState}
                      className="h-10 w-24 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
                      Tipo de Expansión
                    </span>
                    <select
                      value={dynamicConfig.isPartial ? "Parciales" : "Totales"}
                      onChange={(e) => handleDynamicConfigChange("isPartial", e.target.value === "Parciales")}
                      disabled={!!dynamicState}
                      className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[13px] font-medium text-[#2b1610] shadow-sm outline-none transition focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Totales">Totales</option>
                      <option value="Parciales">Parciales</option>
                    </select>
                  </label>

                  {!dynamicState ? (
                    <button onClick={() => {
                      const capacity = dynamicConfig.initialBuckets * dynamicConfig.recordsPerBucket;
                      const optimalExp = Math.max(70, Math.floor(((capacity - 1) / capacity) * 100));
                      const optimalRed = Math.min(150, Math.floor(((dynamicConfig.initialBuckets + 1) / dynamicConfig.initialBuckets) * 100));
                      const newConfig = { ...dynamicConfig, expThreshold: optimalExp, redThreshold: optimalRed };
                      setDynamicConfig(newConfig);
                      setDynamicState({
                        config: newConfig,
                        currentBuckets: newConfig.initialBuckets,
                        keys: [],
                        history: []
                      })
                    }} className="h-10 shrink-0 rounded-lg bg-[#52241A] px-2 text-[12px] xl:px-3 xl:text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#6B2E24] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:bg-[#52241A] ml-2">
                      Generar Tabla Dinámica
                    </button>
                  ) : (
                    <button onClick={() => {
                      setDynamicState(null)
                    }} className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-3 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50 ml-2">
                      Borrar Tabla
                    </button>
                  )}

                  <div className="ml-auto flex items-end gap-1.5">
                    <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-2.5 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                      <input type="file" accept=".json" className="hidden" onChange={handleOpen} />
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                      </svg>
                      Abrir
                    </label>
                    <button onClick={handleSave} className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-2.5 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                        <path d="M17 21v-8H7v8M7 3v5h8" />
                      </svg>
                      Guardar
                    </button>
                    <button onClick={() => window.print()} className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-2.5 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" />
                      </svg>
                      Imprimir
                    </button>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 flex gap-4">
                {isTree ? (
                  <TreeView treeData={treeData} />
                ) : isDynamic ? (
                  <DynamicTableView state={dynamicState} animatingState={animatingDynamic} />
                ) : (
                  <TableView rows={rows} active={active} isHash={isHash} collision={collision} splitRange={splitRange} isExternal={isExternal} />
                )}

                {isDynamic ? (
                  <DynamicLogicPanel isDynamic={isDynamic} dynamicState={animatingDynamic ? animatingDynamic.newState : dynamicState} />
                ) : (
                  <HashExplanation
                    isHash={isHash || isTree}
                    hashExplanation={hashExplanation}
                  />
                )}
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
              ) : !isDynamic && (
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

              {isDynamic && dynamicState && (
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-sm font-semibold text-[#52241A]">
                    Clave:
                  </span>
                  <input
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDynamicAction("insert")}
                    disabled={busy}
                    placeholder="Espacio de texto"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleDynamicAction("insert")}
                    disabled={busy || !keyInput}
                    className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-2 text-[12px] xl:px-3 xl:text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Insertar clave
                  </button>
                  <button
                    onClick={insertAuto}
                    disabled={busy || !dynamicState}
                    className="h-10 shrink-0 rounded-lg bg-[#E6B793] text-[#52241A] px-2 text-[12px] xl:px-3 xl:text-[13px] font-bold shadow-sm transition hover:bg-[#D5A37F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Insertar Auto
                  </button>
                  <button
                    onClick={() => handleDynamicAction("delete")}
                    disabled={busy || !keyInput}
                    className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-3 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Borrar clave
                  </button>
                </div>
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
