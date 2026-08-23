import { useState, ReactNode } from "react"

type SectionId = "internas" | "externas" | "grafos"

const HASH_ALGORITHMS = [
  "Hash Mod",
  "Hash Cuadrado",
  "Truncamiento",
  "Hash Plegamiento",
]

const COLLISION_SOLUTIONS = [
  "Lista Enlazada",
  "Solución Lineal",
  "Solución Cuadrática",
  "Doble Función Hash",
  "Arreglo Anidado",
]

type Section = {
  id: SectionId
  label: string
  icon: string
  options: string[]
}

const SECTIONS: Section[] = [
  {
    id: "internas",
    label: "Búsquedas Internas",
    icon: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h7v4h-7v-4Z",
    options: [
      "Secuencial",
      "Binaria",
      "Transformaciones de Claves",
      "Árboles Binarios",
    ],
  },
  {
    id: "externas",
    label: "Búsquedas Externas",
    icon: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4",
    options: ["Secuencial", "Binaria", "Transformaciones de Claves"],
  },
  {
    id: "grafos",
    label: "Grafos",
    icon: "M6 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 7l8 0M7.5 8.5 11 13m6-4.5L13 13",
    options: ["Recorridos", "Ruta más corta", "Árbol de expansión"],
  },
]

type Row = { pos: number; key: string; inactive?: boolean; collidingKey?: string }

// Funciones globales para calcular hash y rehashear el arreglo de forma instantánea
const computeInitialHash = (val: number, algo: string, N: number) => {
  if (algo === "Hash Mod") return (val % N) + 1
  if (algo === "Hash Cuadrado") {
    const sq = (val * val).toString()
    const mid = Math.floor(sq.length / 2)
    const digits = sq.substring(Math.max(0, mid - 1), mid + 1)
    return (parseInt(digits || "0", 10) % N) + 1
  }
  if (algo === "Truncamiento") {
    const str = val.toString()
    let trunc = ""
    for (let i = 0; i < str.length; i += 2) trunc += str[i]
    return (parseInt(trunc || "0", 10) % N) + 1
  }
  if (algo === "Hash Plegamiento") {
    const str = val.toString()
    let sum = 0
    for (let i = 0; i < str.length; i += 2) {
      sum += parseInt(str.substring(i, i + 2), 10)
    }
    return (sum % N) + 1
  }
  return (val % N) + 1
}

const computeSecondaryHash = (val: number, algo: string, N: number) => {
  const step = computeInitialHash(val, algo, N)
  return step === 0 ? 1 : step
}

const rehashInstantly = (
  currentRows: Row[],
  algo: string,
  coll: string,
  double: string
) => {
  if (!currentRows || currentRows.length === 0 || !algo || !coll) return currentRows;
  if (coll === "Doble Función Hash" && !double) return currentRows;

  const N = currentRows.length;
  // Extraer claves actuales
  const allKeys: string[] = [];
  currentRows.forEach((r) => {
    if (r.key) {
      r.key.split(/, | -> /).forEach((kStr) => {
        const k = kStr.trim();
        if (k) allKeys.push(k);
      });
    }
  });

  // Crear arreglo vacío
  const newRows = Array.from({ length: N }, (_, i) => ({
    pos: i + 1,
    key: "",
    inactive: false,
  }));

  // Insertar instantáneo
  for (const key of allKeys) {
    const k = parseInt(key, 10);
    let pos = computeInitialHash(k, algo, N);
    let attempts = 0;
    let inserted = false;

    while (attempts < N) {
      const rowIdx = pos - 1;
      const currentRow = newRows[rowIdx];

      if (currentRow.key === "") {
        currentRow.key = key;
        inserted = true;
        break;
      } else {
        if (coll === "Lista Enlazada" || coll === "Arreglo Anidado") {
          currentRow.key =
            currentRow.key + (coll === "Lista Enlazada" ? " -> " : ", ") + key;
          inserted = true;
          break;
        }

        attempts++;
        if (coll === "Solución Lineal") {
          pos = (pos % N) + 1;
        } else if (coll === "Solución Cuadrática") {
          pos = ((pos - 1 + attempts * attempts) % N) + 1;
        } else if (coll === "Doble Función Hash") {
          const step = computeSecondaryHash(k, double, N);
          pos = ((pos - 1 + step) % N) + 1;
        }
      }
    }
  }
  return newRows;
};

const renderLongDivision = (dividend: number, divisor: number) => {
  const divStr = dividend.toString();
  const L = divStr.length;

  let steps = [];
  let quotient = "";
  let current = "";

  for (let i = 0; i < divStr.length; i++) {
    current += divStr[i];
    let currentNum = parseInt(current, 10);

    if (quotient === "" && currentNum < divisor && i < divStr.length - 1) {
      continue;
    }

    let q = Math.floor(currentNum / divisor);
    quotient += q.toString();

    let prod = q * divisor;
    let rem = currentNum - prod;

    steps.push({
      stepDividend: currentNum,
      product: prod,
      remainder: rem,
      endIndex: i
    });

    current = rem === 0 ? "" : rem.toString();
  }

  if (quotient === "") quotient = "0";

  const lines: ReactNode[] = [];
  const barIndex = 2 + L + 1;

  lines.push(<div key="row0">  {divStr} │ {divisor}</div>);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    const prodStr = step.product.toString();
    const minusPos = 2 + step.endIndex - prodStr.length;
    let prodLine = "";
    for (let j = 0; j < minusPos; j++) prodLine += " ";
    prodLine += "-" + prodStr;

    while (prodLine.length < barIndex) prodLine += " ";

    if (i === 0) {
      prodLine += "└" + "─".repeat(Math.max(4, quotient.length + 2));
    }
    lines.push(<div key={`prod${i}`}>{prodLine}</div>);

    if (i < steps.length - 1) {
      const nextDivStr = steps[i + 1].stepDividend.toString();
      let remLine = "";
      const remEnd = 2 + steps[i + 1].endIndex;
      for (let j = 0; j < remEnd - nextDivStr.length + 1; j++) remLine += " ";
      remLine += nextDivStr;
      while (remLine.length < barIndex) remLine += " ";

      if (i === 0) {
        remLine += "  " + quotient;
      }
      lines.push(<div key={`rem${i}`}>{remLine}</div>);
    } else {
      const finalRemStr = step.remainder.toString();
      let remLineSpaces = "";
      const remEnd = 2 + step.endIndex;
      for (let j = 0; j < remEnd - finalRemStr.length + 1; j++) remLineSpaces += " ";
      lines.push(
        <div key={`finalrem`} className="flex items-center mt-1">
          <span className="whitespace-pre">{remLineSpaces}</span>
          <span className="bg-[#a23b2a] text-white font-bold px-1.5 py-0.5 rounded -ml-1.5 text-xs relative shadow-sm">
            {finalRemStr}
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-[10px] text-[#a23b2a] bg-[#a23b2a]/10 px-2 py-1 rounded-md font-sans tracking-wide whitespace-nowrap flex items-center gap-1.5 border border-[#a23b2a]/20 font-bold uppercase">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              Residuo
            </span>
          </span>
        </div>
      );
    }
  }

  return (
    <div className="font-mono text-[13px] leading-[1.3] text-[#52241A] whitespace-pre bg-[#faf6f2] border border-[#52241A]/10 p-4 rounded-xl overflow-x-auto shadow-sm my-3 relative">
      {lines}
    </div>
  );
}

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
  const [hashExplanation, setHashExplanation] = useState<{ title: string; steps: ReactNode[] } | null>(null)

  // ── Estado de la animación ──────────────────────────
  // pos que se está comparando y el resultado visual de esa celda.
  const [active, setActive] = useState<{
    pos: number
    state: "compare" | "match" | "insert" | "collide" | "resolve"
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
    if (!algo || !coll || (coll === "Doble Función Hash" && !double)) return;
    setRows((prev) => {
      if (!prev || prev.length === 0) return prev;
      return rehashInstantly(prev, algo, coll, double);
    });
  };

  // Función maestra para cambiar de algoritmo o sección
  // 1. Abre nuestro modal si hay un arreglo, o cambia directamente si está vacío
  const handleAlgorithmChange = (
    newOption: string,
    newSectionId?: SectionId,
  ) => {
    if (
      newOption === activeOption &&
      (!newSectionId || newSectionId === activeSection)
    )
      return

    if (rows && rows.length > 0) {
      // En lugar del window.confirm, activamos nuestro modal personalizado
      setPendingChange({ option: newOption, sectionId: newSectionId })
    } else {
      // Si no hay arreglo, cambiamos sin preguntar
      applyChange(newOption, newSectionId, false)
    }
  }

  // 2. Ejecuta la decisión del usuario desde el modal
  const applyChange = (
    option: string,
    sectionId: SectionId | undefined,
    keepArray: boolean,
  ) => {
    if (!keepArray) {
      setRows(null)
      setArraySizeInput("")
    } else if (rows) {
      // 1. Extraer todas las claves
      const allKeys: string[] = []
      rows.forEach((r) => {
        if (r.key) {
          // Separar posibles colisiones (Listas enlazadas, arreglos anidados)
          r.key.split(/, | -> /).forEach((kStr) => {
            const k = kStr.trim()
            if (k) {
              allKeys.push(k)
            }
          })
        }
      })

      // 2. Ordenar si la opción destino es Búsqueda Binaria
      if (option === "Binaria") {
        allKeys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      }

      // 3. Reconstruir el arreglo de forma limpia y secuencial
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
    setPendingChange(null) // Cierra el modal

    if (sectionId) setActiveSection(sectionId)
    setActiveOption(option)
  }

  const selectSection = (section: Section) => {
    handleAlgorithmChange(section.options[0], section.id)
  }

  // Genera una tabla vacía con posiciones 1..N según el tamaño del arreglo.
  const generateTable = () => {
    const size = parseInt(arraySizeInput, 10)
    if (!Number.isFinite(size) || size <= 0) {
      setRows(null)
      return
    }
    const capped = Math.min(size, 500)
    setRows(Array.from({ length: capped }, (_, i) => ({ pos: i + 1, key: "" })))
    setActive(null)
    setMessage(null)
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  // Valida que la clave tenga solo dígitos y la longitud del tamaño elegido.
  const validateKey = (value: string): string | null => {
    const key = value.trim()
    if (!key) return "Escribe una clave."
    if (!/^\d+$/.test(key)) return "La clave solo puede contener dígitos."
    if (key.length !== keySize)
      return `La clave debe tener ${keySize} dígito${keySize > 1 ? "s" : ""}.`
    return null
  }

  // ── Inserción secuencial con animación de comparación ──
  const insertSequential = async () => {
    if (busy || !rows) return
    const key = keyInput.trim()
    const error = validateKey(key)
    if (error) {
      setMessage({ text: error, tone: "warn" })
      return
    }
    setBusy(true)
    setMessage({ text: `Insertando "${key}"…`, tone: "info" })

    // Recorre el arreglo comparando posición por posición.
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
            : prev,
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
    // Limpiamos cualquier rastro de particiones anteriores en la interfaz
    if (rows) setRows(rows.map((r) => ({ ...r, inactive: false })))

    if (activeOption === "Binaria") {
      searchBinary()
    } else {
      searchSequential()
    }
  }

  // ── Búsqueda secuencial con animación ──────────────────
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
      // Optimización: si no estamos en Hash, los datos están compactados.
      // Un espacio vacío significa que ya no hay más datos.
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

  const searchBinary = async () => {
    if (busy || !rows) return
    const key = searchInput.trim()
    if (!key) {
      setMessage({ text: "Escribe una clave para buscar.", tone: "warn" })
      return
    }

    const targetVal = parseInt(key, 10)
    if (isNaN(targetVal)) return

    // 1. Validación estricta: Verificar que el arreglo esté ordenado
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

    // Clonamos el arreglo para manipular la animación de partición en la UI
    let currentRows = rows.map((r) => ({ ...r, inactive: false }))

    let left = 0
    let right = currentRows.length - 1

    // Descartar visualmente los espacios vacíos al final del arreglo
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

    // 2. Ejecución del algoritmo con animación
    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const midVal = parseInt(currentRows[mid].key, 10)

      setMessage({
        text: `Partición actual: [Pos ${currentRows[left].pos} a ${currentRows[right].pos}] - Evaluando mitad: Pos ${currentRows[mid].pos}`,
        tone: "info",
      })

      // Animar el salto hacia la mitad actual
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

      // Animación: Sombrear y descartar la mitad incorrecta
      if (midVal < targetVal) {
        // Sombrear y descartar el lado izquierdo (incluyendo la mitad)
        for (let i = left; i <= mid; i++) {
          currentRows[i].inactive = true
        }
        left = mid + 1
      } else {
        // Sombrear y descartar el lado derecho (incluyendo la mitad)
        for (let i = mid; i <= right; i++) {
          currentRows[i].inactive = true
        }
        right = mid - 1
      }

      // Aplicar los cambios al estado y esperar para ver el efecto visual de sombra
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

  // ── Borrado de clave con animación ─────────────────────
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

  // ── Inserción Hash con Animación ──────────────────────────
  const insertHash = async () => {
    if (busy || !rows) return
    const key = keyInput.trim()
    const error = validateKey(key)
    if (error) {
      setMessage({ text: error, tone: "warn" })
      return
    }
    setBusy(true)
    setMessage({ text: `Calculando Hash para "${key}"…`, tone: "info" })

    const N = rows.length
    const k = parseInt(key, 10)

    let initialExplanation: ReactNode = null;
    let pos = computeInitialHash(k, hashAlgo, N)

    if (hashAlgo === "Hash Mod") {
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Mod</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-2">
            <li><strong>Fórmula:</strong> h(k) = (k mod N) + 1</li>

            <li>
              {renderLongDivision(k, N)}
            </li>

            <li className="pt-1 text-[#2b1610]">
              <strong>Posición asignada:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span> <span className="text-xs opacity-75">(Residuo + 1)</span>
            </li>
          </ul>
        </div>
      );
    } else if (hashAlgo === "Hash Cuadrado") {
      const sq = (k * k).toString();
      const mid = Math.floor(sq.length / 2);
      const digits = sq.substring(Math.max(0, mid - 1), mid + 1);
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Cuadrado</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li><strong>Clave al cuadrado:</strong> {k}² = {sq}</li>
            <li><strong>Dígitos centrales:</strong> "{digits}"</li>
            <li><strong>Fórmula:</strong> h(k) = ({digits} mod N) + 1</li>
            <li><strong>Posición inicial asignada:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
          </ul>
        </div>
      );
    } else if (hashAlgo === "Truncamiento") {
      const str = k.toString();
      let trunc = "";
      for (let i = 0; i < str.length; i += 2) trunc += str[i];
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Truncamiento</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li><strong>Extracción (pos pares):</strong> "{trunc}"</li>
            <li><strong>Fórmula:</strong> h(k) = ({trunc} mod N) + 1</li>
            <li><strong>Posición inicial asignada:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
          </ul>
        </div>
      );
    } else if (hashAlgo === "Hash Plegamiento") {
      const str = k.toString();
      let sum = 0;
      let parts = [];
      for (let i = 0; i < str.length; i += 2) {
        let part = str.substring(i, i + 2);
        sum += parseInt(part, 10);
        parts.push(part);
      }
      initialExplanation = (
        <div key="init" className="mb-4">
          <p className="mb-1 font-semibold text-[#52241A]">1. Cálculo Hash Plegamiento</p>
          <ul className="text-sm text-[#52241A]/80 ml-2 space-y-1">
            <li><strong>División (2 en 2):</strong> {parts.join(" + ")} = {sum}</li>
            <li><strong>Fórmula:</strong> h(k) = ({sum} mod N) + 1</li>
            <li><strong>Posición inicial asignada:</strong> <span className="font-bold text-[#a23b2a]">{pos}</span></li>
          </ul>
        </div>
      );
    }

    const currentSteps: ReactNode[] = [initialExplanation];
    setHashExplanation({ title: `Algoritmo: ${hashAlgo}`, steps: [...currentSteps] });

    let currentRows = [...rows]
    let attempts = 0
    let inserted = false

    while (attempts < N) {
      setActive({ pos, state: "compare" })
      await sleep(400)

      const rowIdx = pos - 1
      const currentRow = currentRows[rowIdx]

      // Comprobar si ya existe
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
        // Colisión
        if (
          collision === "Lista Enlazada" ||
          collision === "Arreglo Anidado"
        ) {
          setActive({ pos, state: "collide" })
          currentRow.collidingKey = key
          setRows([...currentRows])
          setMessage({
            text: `Colisión en pos ${pos}. Anidando valor...`,
            tone: "warn",
          })

          currentSteps.push(
            <div key="col_resolve" className="mb-4">
              <p className="mb-1 font-semibold text-[#a23b2a]">2. Colisión detectada en {pos}</p>
              <p className="text-sm text-[#52241A]/80 ml-2">Resolviendo mediante <strong>{collision}</strong>. La clave se anida en la misma posición.</p>
            </div>
          )
          setHashExplanation({ title: `Algoritmo: ${hashAlgo}`, steps: [...currentSteps] })

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
            <p className="mb-1 font-semibold text-[#a23b2a]">{attempts + 2}. Colisión en posición {pos}</p>
            <p className="text-sm text-[#52241A]/80 ml-2">
              Resolviendo mediante <strong>{collision}</strong>...
            </p>
          </div>
        )
        setHashExplanation({ title: `Algoritmo: ${hashAlgo}`, steps: [...currentSteps] })

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
          <div key={`col_resolve_${attempts}`} className="mb-4 ml-2 border-l-2 border-[#E6B793] pl-3">
            <p className="text-sm text-[#52241A]/80">Intento #{attempts}. Nueva posición: <span className="font-bold text-[#a23b2a]">{pos}</span></p>
          </div>
        )
        setHashExplanation({ title: `Algoritmo: ${hashAlgo}`, steps: [...currentSteps] })
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

  // ── Ordenamiento con animación ─────────────────────
  const sortArray = async () => {
    if (busy || !rows) return
    setBusy(true)
    setMessage({ text: "Ordenando el arreglo…", tone: "info" })

    // Trabajaremos con una copia del arreglo para realizar los cambios
    const currentRows = [...rows]

    // Convertimos a número para comparar. Si la clave está vacía, le damos valor infinito
    // para que sea empujada hacia el final del arreglo.
    const getValue = (key: string) =>
      key === "" ? Infinity : parseInt(key, 10)

    // Encontrar el último índice que contiene datos para ignorar todos los espacios vacíos del final
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
        // 1. Animación: Resaltamos la celda actual en estado de comparación
        setActive({ pos: currentRows[j].pos, state: "compare" })
        await sleep(200) // Un tiempo un poco más rápido (200ms) para que el ordenamiento sea fluido

        const val1 = getValue(currentRows[j].key)
        const val2 = getValue(currentRows[j + 1].key)

        if (val1 > val2) {
          // Intercambiamos SOLO el valor 'key'. Mantenemos 'pos' intacto.
          const temp = currentRows[j].key
          currentRows[j].key = currentRows[j + 1].key
          currentRows[j + 1].key = temp

          // Actualizamos el estado para reflejar el cambio en pantalla
          setRows([...currentRows])
          swapped = true

          // 2. Animación: Resaltamos la siguiente celda en estado de inserción/cambio
          setActive({ pos: currentRows[j + 1].pos, state: "insert" })
          await sleep(200)
        }
      }
      // Si en la pasada no hubo intercambios, el arreglo ya está ordenado
      if (!swapped) break
    }

    setMessage({ text: "Arreglo ordenado con éxito.", tone: "ok" })
    setActive(null)
    setBusy(false)
  }
  // Filtro dinámico para arreglos grandes
  let displayRows = rows || []
  if (isHash && rows && rows.length > 100) {
    displayRows = rows.filter(
      (r) => r.pos <= 100 || r.key !== "" || r.pos === active?.pos,
    )
  }

  const hasData = rows ? rows.some((r) => r.key !== "") : false

  // Reparte las filas en dos columnas (mitad izquierda / mitad derecha).
  const half = Math.ceil(displayRows.length / 2)
  const leftRows = displayRows.slice(0, half)
  const rightRows = displayRows.slice(half)

  return (
    <div className="grid h-screen w-full grid-rows-[auto_1fr] bg-[#faf6f2] text-[#2b1610]">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="relative z-10 flex flex-col justify-between bg-[#52241A] px-8 pt-6 pb-0 text-white shadow-[0_10px_30px_-18px_rgba(82,36,26,0.9)]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#E6B793]">
            {current.label}
          </span>
          <span className="ml-auto text-[20px] font-semibold tracking-[0.02em] text-white/95">
            CIENCIAS DE LA COMPUTACIÓN 2
          </span>
        </div>

        {/* dynamic option tabs */}
        <nav
          className="mt-5 flex items-end justify-center gap-1 transition-[padding] duration-300"
          style={{ paddingLeft: collapsed ? 64 : 196 }}
        >
          {current.options.map((option) => {
            const selected = option === activeOption
            return (
              <button
                key={option}
                onClick={() => handleAlgorithmChange(option)}
                className={`relative min-w-0 truncate rounded-t-lg px-4 py-2.5 text-[clamp(11px,1.1vw,13px)] font-medium transition-colors ${selected
                    ? "bg-[#faf6f2] text-[#52241A]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {option}
                {selected && (
                  <span className="absolute inset-x-3 -top-px h-[3px] rounded-full bg-[#E6B793]" />
                )}
              </button>
            )
          })}
        </nav>
      </header>

      {/* ── Body: sidebar + content ─────────────────────────── */}
      <div
        className="grid min-h-0"
        style={{ gridTemplateColumns: `${collapsed ? 64 : 196}px 1fr` }}
      >
        {/* Left sidebar */}
        <aside className="relative flex flex-col bg-[#52241A] text-white transition-[width] duration-300">
          {/* collapse toggle — sits on the seam between header and sidebar */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir barra" : "Minimizar barra"}
            className="absolute -top-6 right-0 z-20 flex size-12 translate-x-1/2 items-center justify-center rounded-full bg-[#E6B793] text-[#52241A] shadow-lg ring-4 ring-[#faf6f2] transition-transform hover:scale-105 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              className={`size-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6 9 12l6 6" />
            </svg>
          </button>

          <nav className="mt-10 flex flex-col gap-1.5 px-2">
            {SECTIONS.map((section) => {
              const active = section.id === activeSection
              return (
                <button
                  key={section.id}
                  onClick={() => selectSection(section)}
                  title={collapsed ? section.label : undefined}
                  className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors ${active ? "bg-[#6B2E24] shadow-inner" : "hover:bg-white/8"
                    }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${active
                        ? "bg-[#E6B793] text-[#52241A]"
                        : "bg-white/10 text-[#E6B793]"
                      }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={section.icon} />
                    </svg>
                  </span>
                  {!collapsed && (
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-[12px] font-semibold text-white">
                        {section.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                        {section.options.length} opciones
                      </span>
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {!collapsed && (
            <p className="mt-auto px-5 pb-5 text-[10.5px] leading-relaxed text-white/35">
              Estructuras de datos y algoritmos de búsqueda.
            </p>
          )}
        </aside>

        {/* Central content */}
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
              {/* ── Barra de controles superior ─────────────── */}
              <div className="flex items-end gap-1.5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
                    Tamaño de la clave
                  </span>
                  <select
                    value={keySize}
                    onChange={(e) => setKeySize(Number(e.target.value))}
                    disabled={hasData || busy}
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
                    Tamaño del arreglo
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={arraySizeInput}
                    onChange={(e) => setArraySizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generateTable()}
                    disabled={hasData || busy}
                    placeholder="Ej. 20"
                    className="h-10 w-24 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>

                {isHash && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
                      Algoritmo
                    </span>
                    <select
                      value={hashAlgo}
                      onChange={(e) => {
                        const val = e.target.value
                        setHashAlgo(val)
                        triggerRehash(val, collision, doubleHash)
                      }}
                      className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[13px] font-medium text-[#2b1610] shadow-sm outline-none transition focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
                    >
                      <option value="" disabled>Seleccione...</option>
                      {HASH_ALGORITHMS.map((algo) => (
                        <option key={algo} value={algo}>
                          {algo}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  onClick={generateTable}
                  disabled={hasData || busy}
                  className="h-10 shrink-0 rounded-lg bg-[#52241A] px-2 text-[12px] xl:px-3 xl:text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#6B2E24] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:bg-[#52241A]"
                >
                  Generar arreglo
                </button>
                <button
                  onClick={() => {
                    setRows(null)
                    setActive(null)
                    setMessage(null)
                  }}
                  disabled={busy}
                  className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-3 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Borrar arreglo
                </button>

                <div className="ml-auto flex items-end gap-1.5">
                  <button className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-2.5 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                    </svg>
                    Abrir
                  </button>
                  <button className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-2.5 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                      <path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                    Guardar
                  </button>
                  <button className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-2.5 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" />
                    </svg>
                    Imprimir
                  </button>
                </div>
              </div>

              {/* ── Área Principal (Tabla + Panel) ────────────── */}
              <div className="min-h-0 flex-1 flex gap-4">
                {/* ── Tabla ───────────────────────────────────── */}
                <div className={`min-h-0 flex-1 overflow-auto rounded-2xl border border-[#52241A]/15 bg-white shadow-sm transition-all duration-300 ${isHash ? 'max-w-[65%]' : 'w-full'}`}>
                  {rows ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-[#52241A]/15">
                      {[leftRows, rightRows].map((group, gi) => (
                        <table
                          key={gi}
                          className="w-full border-collapse text-sm"
                        >
                          <thead className="sticky top-0 z-10 bg-[#52241A] text-white">
                            <tr>
                              <th className="w-28 border-b border-[#52241A] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                                Posición
                              </th>
                              <th className="w-full border-b border-[#52241A] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                                Clave
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.map((row) => {
                              const act =
                                active?.pos === row.pos ? active.state : null

                              // Lógica de estilos actualizada con el estado inactivo (sombra)
                              let rowClass = ""
                              if (act === "match") {
                                rowClass = "bg-[#2f7d4f] text-white font-semibold"
                              } else if (act === "insert") {
                                rowClass =
                                  "bg-[#E6B793] text-[#52241A] font-semibold"
                              } else if (act === "compare") {
                                rowClass = "bg-[#6B2E24] text-white font-semibold"
                              } else if (act === "collide") {
                                rowClass = "bg-[#a23b2a]/20 text-[#a23b2a] font-semibold border-2 border-[#a23b2a]"
                              } else if (act === "resolve") {
                                rowClass = "bg-[#E6B793] text-[#52241A] font-semibold transition-all duration-1000"
                              } else if (row.inactive) {
                                // --- ESTE ES EL NUEVO EFECTO DE SOMBRA ---
                                rowClass =
                                  "opacity-20 bg-[#2b1610]/15 grayscale blur-[0.5px] select-none pointer-events-none"
                              } else {
                                rowClass =
                                  "odd:bg-[#faf6f2]/60 hover:bg-[#E6B793]/20"
                              }

                              return (
                                <tr
                                  key={row.pos}
                                  className={`transition-all duration-500 ${rowClass}`}
                                >
                                  <td
                                    className={`border-b border-[#52241A]/10 px-4 py-2 font-medium tabular-nums ${act ? "" : "text-[#52241A]"
                                      }`}
                                  >
                                    {row.pos}
                                  </td>
                                  <td
                                    className={`border-b border-[#52241A]/10 px-4 py-2 ${act ? "" : "text-[#2b1610]"
                                      }`}
                                  >
                                    {row.key || (
                                      <span
                                        className={
                                          act ? "opacity-60" : "text-[#52241A]/25"
                                        }
                                      >
                                        —
                                      </span>
                                    )}
                                    {row.collidingKey && (
                                      <span className="ml-2 inline-flex items-center rounded-md bg-[#a23b2a] px-2 py-0.5 text-xs font-medium text-white motion-safe:animate-bounce">
                                        {row.collidingKey}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                            {group.length === 0 && (
                              <tr>
                                <td
                                  colSpan={2}
                                  className="px-4 py-8 text-center text-[#52241A]/30"
                                >
                                  —
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center">
                      <p className="text-sm font-medium text-[#52241A]/50">
                        Ingresa el tamaño del arreglo y presiona
                        <span className="font-semibold text-[#52241A]">
                          {" "}
                          Generar arreglo
                        </span>
                        .
                      </p>
                      <p className="text-xs text-[#52241A]/35">
                        Se crearán las posiciones vacías listas para insertar
                        claves.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Panel Explicativo (Solo en Hash) ────────── */}
                {isHash && (
                  <div className="min-h-0 w-[35%] flex-shrink-0 flex flex-col rounded-2xl border border-[#52241A]/15 bg-white shadow-sm transition-all duration-300">
                    <div className="p-3 border-b border-[#52241A]/15 bg-[#52241A] rounded-t-2xl">
                      <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.14em]">
                        Procedimiento Lógico
                      </h3>
                    </div>
                    <div className="flex-1 overflow-auto p-4 bg-[#faf6f2]/30 rounded-b-2xl">
                      {hashExplanation ? (
                        <>
                          <h4 className="text-[13px] font-bold text-[#6B2E24] mb-3 pb-2 border-b border-[#E6B793]/50">
                            {hashExplanation.title}
                          </h4>
                          <div>
                            {hashExplanation.steps}
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center px-4">
                          <p className="text-sm font-medium text-[#52241A]/50">
                            Inserta una clave para ver el procedimiento paso a paso de la función Hash.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Controles inferiores ────────────────────── */}
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-sm font-semibold text-[#52241A]">
                  Clave:
                </span>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (isHash ? insertHash() : insertSequential())}
                  disabled={busy}
                  placeholder="Espacio de texto"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50"
                />
                <button
                  onClick={isHash ? insertHash : insertSequential}
                  disabled={busy || !rows || (isHash && (!hashAlgo || !collision || (collision === "Doble Función Hash" && !doubleHash)))}
                  className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-2 text-[12px] xl:px-3 xl:text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Insertar clave
                </button>
                <button
                  onClick={deleteSequential}
                  disabled={busy || !rows}
                  className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-3 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Borrar clave
                </button>

                {/* Buscar clave */}
                <div className="relative min-w-0 flex-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52241A]/40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={busy}
                    placeholder="Buscar clave"
                    className="h-10 w-full rounded-lg border border-[#52241A]/20 bg-white pl-9 pr-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={busy || !rows}
                  className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-2 text-[12px] xl:px-3 xl:text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Buscar
                </button>

                {!isHash && (
                  <button
                    onClick={sortArray}
                    disabled={busy || !rows}
                    className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-3 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Ordenar
                  </button>
                )}
                {isHash && (
                  <div className="relative shrink-0">
                    <span className="pointer-events-none absolute bottom-full left-0 mb-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52241A]/60">
                      Solución de colisiones
                    </span>
                    <button
                      onClick={() => setCollisionOpen((o) => !o)}
                      className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-3 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
                    >
                      <span className="font-semibold">
                        {collision || "Seleccione..."}
                        {collision === "Doble Función Hash" && doubleHash &&
                          ` (${doubleHash})`}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className={`size-4 transition-transform ${collisionOpen ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {collisionOpen && (
                      <>
                        {/* capa para cerrar al hacer clic fuera */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setCollisionOpen(false)}
                        />
                        <div className="absolute bottom-full right-0 z-20 mb-2 w-56 overflow-hidden rounded-xl border border-[#52241A]/15 bg-white py-1 shadow-xl">
                          {COLLISION_SOLUTIONS.map((sol) => {
                            const selected = sol === collision
                            const isDouble = sol === "Doble Función Hash"
                            return (
                              <div key={sol}>
                                <button
                                  onClick={() => {
                                    setCollision(sol)
                                    if (!isDouble) {
                                      setCollisionOpen(false)
                                      triggerRehash(hashAlgo, sol, doubleHash)
                                    }
                                  }}
                                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${selected
                                      ? "bg-[#E6B793]/25 font-semibold text-[#52241A]"
                                      : "text-[#2b1610] hover:bg-[#52241A]/5"
                                    }`}
                                >
                                  {sol}
                                  {isDouble && (
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="size-4 text-[#52241A]/50"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="m9 6 6 6-6 6" />
                                    </svg>
                                  )}
                                </button>

                                {/* submenú de algoritmos hash para Doble Función Hash */}
                                {isDouble && selected && (
                                  <div className="border-t border-[#52241A]/10 bg-[#faf6f2]/60 py-1">
                                    {HASH_ALGORITHMS.map((algo) => (
                                      <button
                                        key={algo}
                                        onClick={() => {
                                          setDoubleHash(algo)
                                          setCollisionOpen(false)
                                          triggerRehash(hashAlgo, "Doble Función Hash", algo)
                                        }}
                                        className={`block w-full px-8 py-1.5 text-left text-[13px] transition-colors ${algo === doubleHash
                                            ? "font-semibold text-[#52241A]"
                                            : "text-[#52241A]/70 hover:text-[#52241A]"
                                          }`}
                                      >
                                        {algo}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {message && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium ${message.tone === "ok"
                      ? "bg-[#2f7d4f]/12 text-[#256b42]"
                      : message.tone === "warn"
                        ? "bg-[#a23b2a]/12 text-[#a23b2a]"
                        : "bg-[#52241A]/8 text-[#52241A]"
                    }`}
                >
                  <span
                    className={`inline-block size-2 shrink-0 rounded-full ${message.tone === "ok"
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
      {/* ── Modal personalizado de confirmación ────────────────────── */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1610]/40 backdrop-blur-[2px] transition-all">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-[#faf6f2] p-7 shadow-2xl ring-1 ring-[#52241A]/10">
            <h3 className="text-xl font-semibold text-[#52241A]">
              ¿Conservar arreglo actual?
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/75">
              Estás a punto de cambiar al algoritmo{" "}
              <strong className="font-semibold text-[#6B2E24]">
                "{pendingChange.option}"
              </strong>
              . ¿Deseas mantener los datos actuales en la tabla o empezar con un
              arreglo vacío?
            </p>

            <div className="mt-8 flex justify-end gap-3">
              {/* Botón: Borrar */}
              <button
                onClick={() =>
                  applyChange(
                    pendingChange.option,
                    pendingChange.sectionId,
                    false,
                  )
                }
                className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
              >
                Empezar de cero
              </button>
              {/* Botón: Conservar */}
              <button
                onClick={() =>
                  applyChange(
                    pendingChange.option,
                    pendingChange.sectionId,
                    true,
                  )
                }
                className="h-10 rounded-lg bg-[#6B2E24] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]"
              >
                Mantener datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
