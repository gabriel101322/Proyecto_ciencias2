import { useState, ReactNode } from "react"
import { Section, SectionId, Row } from "./types"
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
import { TopControls, BottomControls } from "./components/Controls"
import HashExplanation from "./components/HashExplanation"
import ConfirmModal from "./components/ConfirmModal"

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("internas")
  const [activeOption, setActiveOption] = useState<string>("Secuencial")

  // ── Estado de la tabla ──────────────────────────────
  const [keySize, setKeySize] = useState(1)
  const [arraySizeInput, setArraySizeInput] = useState("")
  const [rows, setRows] = useState<Row[] | null>(null)
  const [keyInput, setKeyInput] = useState("")
  const [searchInput, setSearchInput] = useState("")
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
  const [message, setMessage] = useState<{
    text: string
    tone: "info" | "ok" | "warn"
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingChange, setPendingChange] = useState<{
    option: string
    sectionId?: SectionId
  } | null>(null)

  const current = SECTIONS.find((s) => s.id === activeSection)!
  const isTableView =
    (activeSection === "internas" || activeSection === "externas") &&
    activeOption !== "Árboles Binarios"
  const isHash = activeOption === "Transformaciones de Claves"

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

    if (rows && rows.length > 0) {
      setPendingChange({ option: newOption, sectionId: newSectionId })
    } else {
      applyChange(newOption, newSectionId, false)
    }
  }

  const applyChange = (
    option: string,
    sectionId: SectionId | undefined,
    keepArray: boolean
  ) => {
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

      if (option === "Binaria") {
        allKeys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      }

      const newRows = rows.map((r) => ({ ...r, inactive: false, key: "" }))
      for (let i = 0; i < Math.min(allKeys.length, newRows.length); i++) {
        newRows[i].key = allKeys[i]
      }
      setRows(newRows)
    }

    if (option === "Transformaciones de Claves") {
      setHashAlgo("")
      setCollision("")
      setDoubleHash("")
      setHashExplanation(null)
    } else {
      setHashExplanation(null)
    }

    setActive(null)
    setMessage(null)
    setPendingChange(null)

    if (sectionId) setActiveSection(sectionId)
    setActiveOption(option)
  }

  const selectSection = (section: Section) => {
    handleAlgorithmChange(section.options[0], section.id)
  }

  const generateTable = () => {
    const size = parseInt(arraySizeInput, 10)
    if (!Number.isFinite(size) || size <= 0) {
      setRows(null)
      return
    }
    const capped = Math.min(size, 2000)
    setRows(Array.from({ length: capped }, (_, i) => ({ pos: i + 1, key: "" })))
    setActive(null)
    setMessage(null)
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
    setBusy(true)
    setMessage({ text: `Insertando "${key}"…`, tone: "info" })

    for (let i = 0; i < rows.length; i++) {
      setActive({ pos: rows[i].pos, state: "compare" })
      await sleep(320)

      if (rows[i].key === key) {
        setActive({ pos: rows[i].pos, state: "match" })
        setMessage({
          text: `La clave "${key}" ya existe en la posición ${rows[i].pos}.`,
          tone: "warn",
        })
        setBusy(false)
        return
      }

      if (rows[i].key === "") {
        setActive({ pos: rows[i].pos, state: "insert" })
        setRows((prev) =>
          prev
            ? prev.map((r) => (r.pos === rows[i].pos ? { ...r, key } : r))
            : prev
        )
        setMessage({
          text: `Clave "${key}" insertada en la posición ${rows[i].pos}.`,
          tone: "ok",
        })
        setKeyInput("")
        await sleep(600)
        setActive(null)
        setBusy(false)
        return
      }
    }

    setMessage({
      text: "El arreglo está lleno, no hay espacio disponible.",
      tone: "warn",
    })
    setActive(null)
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
    const key = searchInput.trim()
    if (!key) {
      setMessage({ text: "Escribe una clave para buscar.", tone: "warn" })
      return
    }
    setBusy(true)
    setMessage({ text: `Buscando "${key}"…`, tone: "info" })

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
    const key = searchInput.trim()
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
      const mid = Math.floor(sq.length / 2)
      const digits = sq.substring(Math.max(0, mid - 1), mid + 1)
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
        // Encontramos un hueco, así que la clave definitivamente no está
        break
      }

      // Si no es un método de colisión secuencial (como Lista Enlazada o Anidado), 
      // y no la encontramos en sus parts, entonces la clave no está.
      if (collision === "Lista Enlazada" || collision === "Arreglo Anidado") {
         break
      }

      setActive({ pos, state: "collide" })
      setMessage({ text: `Posición ${pos} ocupada por otra clave. Resolviendo colisión...`, tone: "warn" })
      
      currentSteps.push(
        <div key={`col_detect_${attempts}`} className="mb-2">
          <p className="mb-1 font-semibold text-[#a23b2a]">Intento {attempts + 2}: Colisión en posición {pos}</p>
          <p className="text-sm text-[#52241A]/80 ml-2">Resolviendo mediante <strong>{collision}</strong>...</p>
        </div>
      )
      setHashExplanation({ title: `Búsqueda Hash: ${hashAlgo}`, steps: [...currentSteps] })

      await sleep(600)

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
      setHashExplanation({ title: `Búsqueda Hash: ${hashAlgo}`, steps: [...currentSteps] })
    }

    if (!found) {
      setMessage({ text: `La clave "${key}" no se encuentra en el arreglo.`, tone: "warn" })
      setActive(null)
    }

    setBusy(false)
  }

  const searchBinary = async () => {
    if (busy || !rows) return
    const key = searchInput.trim()
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

    let found = false

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const midVal = parseInt(currentRows[mid].key, 10)

      setMessage({
        text: `Partición actual: [Pos ${currentRows[left].pos} a ${currentRows[right].pos}] - Evaluando mitad: Pos ${currentRows[mid].pos}`,
        tone: "info",
      })

      setActive({ pos: currentRows[mid].pos, state: "compare" })
      await sleep(600)

      if (midVal === targetVal) {
        setActive({ pos: currentRows[mid].pos, state: "match" })
        setMessage({
          text: `¡Clave "${key}" encontrada en la posición ${currentRows[mid].pos}!`,
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
    setBusy(true)
    setMessage({ text: `Borrando "${key}"…`, tone: "info" })

    for (let i = 0; i < rows.length; i++) {
      setActive({ pos: rows[i].pos, state: "compare" })
      await sleep(320)

      if (rows[i].key === key) {
        setActive({ pos: rows[i].pos, state: "match" })
        await sleep(400)
        setRows((prev) => {
          if (!prev) return prev
          const newRows = [...prev]
          if (isHash) {
            newRows[i] = { ...newRows[i], key: "" }
          } else {
            newRows[i] = { ...newRows[i], key: "" }
            const allKeys = newRows.filter((r) => r.key !== "").map((r) => r.key)
            for (let j = 0; j < newRows.length; j++) {
              newRows[j] = { ...newRows[j], key: j < allKeys.length ? allKeys[j] : "" }
            }
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

  const insertHash = async (customKey?: string) => {
    if (busy || !rows) return
    const key = (customKey ?? keyInput).trim()
    const error = validateKey(key)
    if (error) {
      setMessage({ text: error, tone: "warn" })
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
      const mid = Math.floor(sq.length / 2)
      const digits = sq.substring(Math.max(0, mid - 1), mid + 1)
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

          currentSteps.push(
            <div key="col_resolve" className="mb-4">
              <p className="mb-1 font-semibold text-[#a23b2a]">
                2. Colisión detectada en {pos}
              </p>
              <p className="text-sm text-[#52241A]/80 ml-2">
                Resolviendo mediante <strong>{collision}</strong>. La clave se
                anida en la misma posición.
              </p>
            </div>
          )
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

        currentSteps.push(
          <div key={`col_detect_${attempts}`} className="mb-2">
            <p className="mb-1 font-semibold text-[#a23b2a]">
              {attempts + 2}. Colisión en posición {pos}
            </p>
            <p className="text-sm text-[#52241A]/80 ml-2">
              Resolviendo mediante <strong>{collision}</strong>...
            </p>
          </div>
        )
        setHashExplanation({
          title: `Algoritmo: ${hashAlgo}`,
          steps: [...currentSteps],
        })

        await sleep(600)

        currentRow.collidingKey = undefined
        setRows([...currentRows])

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
          <div
            key={`col_resolve_${attempts}`}
            className="mb-4 ml-2 border-l-2 border-[#E6B793] pl-3"
          >
            <p className="text-sm text-[#52241A]/80">
              Intento #{attempts}. Nueva posición:{" "}
              <span className="font-bold text-[#a23b2a]">{pos}</span>
            </p>
          </div>
        )
        setHashExplanation({
          title: `Algoritmo: ${hashAlgo}`,
          steps: [...currentSteps],
        })
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
    let randStr = ""
    if (keySize === 1) {
      randStr = Math.floor(Math.random() * 10).toString()
    } else {
      randStr = Math.floor(Math.random() * (max - min + 1) + min).toString()
    }
    setKeyInput(randStr)
    if (isHash) {
      insertHash(randStr)
    } else {
      insertSequential(randStr)
    }
  }

  const sortArray = async () => {
    if (busy || !rows) return
    setBusy(true)
    setMessage({ text: "Ordenando el arreglo…", tone: "info" })

    const currentRows = [...rows]

    const getValue = (key: string) =>
      key === "" ? Infinity : parseInt(key, 10)

    let lastDataIndex = -1
    for (let i = currentRows.length - 1; i >= 0; i--) {
      if (currentRows[i].key !== "") {
        lastDataIndex = i
        break
      }
    }

    if (lastDataIndex === -1) {
      setMessage({ text: "No hay datos para ordenar.", tone: "warn" })
      setBusy(false)
      return
    }

    const sortBoundary = lastDataIndex + 1
    let swapped
    for (let i = 0; i < sortBoundary - 1; i++) {
      swapped = false
      for (let j = 0; j < sortBoundary - i - 1; j++) {
        setActive({ pos: currentRows[j].pos, state: "compare" })
        await sleep(200)

        const val1 = getValue(currentRows[j].key)
        const val2 = getValue(currentRows[j + 1].key)

        if (val1 > val2) {
          const temp = currentRows[j].key
          currentRows[j].key = currentRows[j + 1].key
          currentRows[j + 1].key = temp

          setRows([...currentRows])
          swapped = true

          setActive({ pos: currentRows[j + 1].pos, state: "insert" })
          await sleep(200)
        }
      }
      if (!swapped) break
    }

    setMessage({ text: "Arreglo ordenado con éxito.", tone: "ok" })
    setActive(null)
    setBusy(false)
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
          {!isTableView ? (
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
              <TopControls
                isHash={isHash}
                hasData={hasData}
                busy={busy}
                keySize={keySize}
                setKeySize={setKeySize}
                arraySizeInput={arraySizeInput}
                setArraySizeInput={setArraySizeInput}
                hashAlgo={hashAlgo}
                setHashAlgo={setHashAlgo}
                collision={collision}
                doubleHash={doubleHash}
                triggerRehash={triggerRehash}
                generateTable={generateTable}
                clearTable={() => {
                  setRows(null)
                  setActive(null)
                  setMessage(null)
                }}
              />

              <div className="min-h-0 flex-1 flex gap-4">
                <TableView rows={rows} active={active} isHash={isHash} />

                <HashExplanation
                  isHash={isHash}
                  hashExplanation={hashExplanation}
                />
              </div>

              <BottomControls
                isHash={isHash}
                busy={busy}
                hasRows={rows !== null}
                keyInput={keyInput}
                setKeyInput={setKeyInput}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                insertHash={() => insertHash()}
                insertSequential={() => insertSequential()}
                insertAuto={insertAuto}
                deleteSequential={deleteSequential}
                handleSearch={handleSearch}
                sortArray={sortArray}
                hashAlgo={hashAlgo}
                collision={collision}
                setCollision={setCollision}
                doubleHash={doubleHash}
                setDoubleHash={setDoubleHash}
                collisionOpen={collisionOpen}
                setCollisionOpen={setCollisionOpen}
                triggerRehash={triggerRehash}
              />

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

      <ConfirmModal pendingChange={pendingChange} applyChange={applyChange} />
    </div>
  )
}
