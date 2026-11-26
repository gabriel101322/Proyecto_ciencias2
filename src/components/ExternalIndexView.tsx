import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  IndexCalcParams,
  IndexCalcResults,
  calculateIndexStructure,
} from "../utils/indexUtils"

interface ExternalIndexViewProps {
  onSave?: (data: any) => void
  onOpen?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ExternalIndexView({ onSave, onOpen }: ExternalIndexViewProps) {
  // ── Estado de los inputs (empiezan limpios según pedido del usuario) ──
  const [mode, setMode] = useState<"un_nivel" | "multinivel">("un_nivel")
  const [indexType, setIndexType] = useState<"primario" | "secundario">("primario")
  const [rInput, setRInput] = useState<string>("")
  const [bInput, setBInput] = useState<string>("")
  const [recSizeInput, setRecSizeInput] = useState<string>("")
  const [riInput, setRiInput] = useState<string>("")

  // ── Resultado del cálculo ──
  const [results, setResults] = useState<IndexCalcResults | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Referencias para trazar los punteros SVG
  const containerRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<
    Array<{ x1: number; y1: number; x2: number; y2: number; label: string }>
  >([])

  const handleCalculate = () => {
    const r = parseInt(rInput, 10)
    const B = parseInt(bInput, 10)
    const R = parseInt(recSizeInput, 10)
    const Ri = parseInt(riInput, 10)

    if (isNaN(r) || r <= 0) {
      setErrorMsg("Ingresa un número válido de registros (r > 0).")
      return
    }
    if (isNaN(B) || B <= 0) {
      setErrorMsg("Ingresa un tamaño de bloque en bytes válido (B > 0).")
      return
    }
    if (isNaN(R) || R <= 0) {
      setErrorMsg("Ingresa un tamaño de registro en bytes válido (R > 0).")
      return
    }
    if (isNaN(Ri) || Ri <= 0) {
      setErrorMsg("Ingresa un tamaño de registro de índice en bytes válido (Ri > 0).")
      return
    }
    if (R > B) {
      setErrorMsg("El registro de datos (R) no puede ser mayor que el tamaño de bloque (B).")
      return
    }
    if (Ri > B) {
      setErrorMsg("El registro de índice (Ri) no puede ser mayor que el tamaño de bloque (B).")
      return
    }

    setErrorMsg(null)
    const calc = calculateIndexStructure({
      r,
      B,
      R,
      Ri,
      indexType,
      mode,
    })

    if (!calc) {
      setErrorMsg("No fue posible generar la estructura con los parámetros proporcionados.")
      return
    }

    setResults(calc)
  }

  const handleClear = () => {
    setRInput("")
    setBInput("")
    setRecSizeInput("")
    setRiInput("")
    setResults(null)
    setErrorMsg(null)
    setLines([])
  }

  // Recalcular punteros visuales cuando cambie el resultado o el tamaño
  useEffect(() => {
    if (!results || !containerRef.current) {
      setLines([])
      return
    }

    const updatePointers = () => {
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const newLines: Array<{ x1: number; y1: number; x2: number; y2: number; label: string }> = []

      // Buscamos los elementos con data-pointer-from y data-pointer-to
      const fromElems = container.querySelectorAll<HTMLElement>("[data-pointer-from]")
      fromElems.forEach((fromEl) => {
        const targetId = fromEl.getAttribute("data-pointer-from")
        if (!targetId) return
        const toEl = container.querySelector<HTMLElement>(`[data-pointer-to="${targetId}"]`)
        if (!toEl) return

        const r1 = fromEl.getBoundingClientRect()
        const r2 = toEl.getBoundingClientRect()

        newLines.push({
          x1: r1.right - containerRect.left,
          y1: r1.top + r1.height / 2 - containerRect.top,
          x2: r2.left - containerRect.left,
          y2: r2.top + r2.height / 2 - containerRect.top,
          label: targetId,
        })
      })

      setLines(newLines)
    }

    const timer = setTimeout(updatePointers, 120)
    window.addEventListener("resize", updatePointers)
    window.addEventListener("scroll", updatePointers, { passive: true })
    const currentContainer = containerRef.current
    if (currentContainer) {
      currentContainer.addEventListener("scroll", updatePointers, { passive: true })
    }

    const observer = new ResizeObserver(() => updatePointers())
    if (currentContainer) observer.observe(currentContainer)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updatePointers)
      window.removeEventListener("scroll", updatePointers)
      if (currentContainer) {
        currentContainer.removeEventListener("scroll", updatePointers)
        observer.disconnect()
      }
    }
  }, [results, mode, indexType])

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1 text-[#2b1610]">
      {/* ── Sub-pestañas: Un Nivel / Multinivel ────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center rounded-xl bg-white/80 p-1 border border-[#52241A]/15 shadow-xs relative">
          <button
            onClick={() => {
              setMode("un_nivel")
              if (results) {
                setResults(calculateIndexStructure({ ...results.params, mode: "un_nivel" }))
              }
            }}
            className={`relative rounded-lg px-5 py-2 text-xs font-bold transition-colors select-none z-10 ${
              mode === "un_nivel"
                ? "text-white"
                : "text-[#52241A]/70 hover:text-[#52241A]"
            }`}
          >
            {mode === "un_nivel" && (
              <motion.div
                layoutId="indexModeTabPill"
                className="absolute inset-0 rounded-lg bg-[#52241A] shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Un Nivel</span>
          </button>
          <button
            onClick={() => {
              setMode("multinivel")
              if (results) {
                setResults(calculateIndexStructure({ ...results.params, mode: "multinivel" }))
              }
            }}
            className={`relative rounded-lg px-5 py-2 text-xs font-bold transition-colors select-none z-10 ${
              mode === "multinivel"
                ? "text-white"
                : "text-[#52241A]/70 hover:text-[#52241A]"
            }`}
          >
            {mode === "multinivel" && (
              <motion.div
                layoutId="indexModeTabPill"
                className="absolute inset-0 rounded-lg bg-[#52241A] shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Multinivel</span>
          </button>
        </div>

        {/* Acciones de exportar e imprimir */}
        <div className="flex items-center gap-1.5 ml-auto">
          {onOpen && (
            <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2.5 text-[12px] xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
              <input type="file" accept=".json" className="hidden" onChange={onOpen} />
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
              </svg>
              Abrir
            </label>
          )}

          {onSave && (
            <button
              onClick={() => onSave(results)}
              disabled={!results}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2.5 text-[12px] xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                <path d="M17 21v-8H7v8M7 3v5h8" />
              </svg>
              Guardar
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-2.5 text-[12px] xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* ── Formulario de Parámetros ─────────────────────────────────── */}
      <div className="rounded-2xl border border-[#52241A]/15 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#52241A]">
            {mode === "un_nivel" ? "Índice de Un Nivel" : "Índice Multinivel"}
          </h2>
          <p className="text-xs text-[#52241A]/70 mt-1">
            Calcula los bloques del archivo de datos, genera un índice primario (no denso) o secundario (denso) y visualiza la estructura conectada con sus accesos a disco.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#52241A]/70">
              r (registros)
            </span>
            <input
              type="number"
              min={1}
              value={rInput}
              onChange={(e) => setRInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
              placeholder="Ej. 30556"
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-3 font-mono text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#52241A]/70">
              B (bytes/bloque)
            </span>
            <input
              type="number"
              min={1}
              value={bInput}
              onChange={(e) => setBInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
              placeholder="Ej. 1024"
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-3 font-mono text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#52241A]/70">
              R (bytes/reg. dato)
            </span>
            <input
              type="number"
              min={1}
              value={recSizeInput}
              onChange={(e) => setRecSizeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
              placeholder="Ej. 100"
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-3 font-mono text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#52241A]/70">
              Ri = V+P (bytes/reg. índice)
            </span>
            <input
              type="number"
              min={1}
              value={riInput}
              onChange={(e) => setRiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
              placeholder="Ej. 15"
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-3 font-mono text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
            />
          </label>
        </div>

        <div className="mt-4 flex items-end gap-3 flex-wrap">
          <label className="flex flex-col gap-1.5 min-w-[240px]">
            <span className="text-[11px] font-semibold text-[#52241A]/70">
              Tipo de índice
            </span>
            <select
              value={indexType}
              onChange={(e) => setIndexType(e.target.value as "primario" | "secundario")}
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] font-medium text-[#2b1610] shadow-sm outline-none transition focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
            >
              <option value="primario">Primario (no denso)</option>
              <option value="secundario">Secundario (denso)</option>
            </select>
          </label>

          <button
            onClick={handleCalculate}
            className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]"
          >
            Crear estructura
          </button>

          <button
            onClick={handleClear}
            className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
          >
            Limpiar
          </button>
        </div>

        {errorMsg && (
          <p className="mt-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            {errorMsg}
          </p>
        )}
      </div>

      {/* ── Resultados de Cálculos y Visualización (cuando existe resultado) ── */}
      <AnimatePresence>
        {results ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col gap-5"
          >
            {/* Banner verde / Resumen de Fórmulas */}
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 px-4 py-3 text-xs leading-relaxed text-emerald-900 font-medium shadow-xs">
              {results.summaryText}
            </div>

            {/* Tabla "Cálculos" exactamente como en la diapositiva */}
            <div className="rounded-2xl border border-[#52241A]/15 bg-white p-5 shadow-sm">
              <h3 className="text-md font-bold text-[#52241A] mb-3">Cálculos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#52241A]/5 border-b border-[#52241A]/15 text-[#52241A] text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Parámetro</th>
                      <th className="py-2.5 px-3">Fórmula</th>
                      <th className="py-2.5 px-3">Sustitución</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#52241A]/10 font-mono text-[12px]">
                    <tr className="hover:bg-[#faf6f2]">
                      <td className="py-2.5 px-3 font-medium font-sans text-[#52241A]">
                        bfr (reg. dato/bloque)
                      </td>
                      <td className="py-2.5 px-3 text-[#52241A]/80">⌊B / R⌋</td>
                      <td className="py-2.5 px-3 text-[#2b1610]">
                        ⌊{results.params.B} / {results.params.R}⌋ = <strong>{results.bfr}</strong>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#faf6f2]">
                      <td className="py-2.5 px-3 font-medium font-sans text-[#52241A]">
                        b (bloques datos)
                      </td>
                      <td className="py-2.5 px-3 text-[#52241A]/80">⌈r / bfr⌉</td>
                      <td className="py-2.5 px-3 text-[#2b1610]">
                        ⌈{results.params.r} / {results.bfr}⌉ = <strong>{results.b}</strong>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#faf6f2]">
                      <td className="py-2.5 px-3 font-medium font-sans text-[#52241A]">
                        bfri (reg. índice/bloque)
                      </td>
                      <td className="py-2.5 px-3 text-[#52241A]/80">⌊B / Ri⌋</td>
                      <td className="py-2.5 px-3 text-[#2b1610]">
                        ⌊{results.params.B} / {results.params.Ri}⌋ = <strong>{results.bfri}</strong>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#faf6f2]">
                      <td className="py-2.5 px-3 font-medium font-sans text-[#52241A]">
                        ri (entradas de índice)
                      </td>
                      <td className="py-2.5 px-3 text-[#52241A]/80">
                        {results.params.indexType === "primario" ? "ri = b" : "ri = r"}
                      </td>
                      <td className="py-2.5 px-3 text-[#2b1610]">
                        {results.params.indexType === "primario" ? (
                          <>b = <strong>{results.b}</strong></>
                        ) : (
                          <>r = <strong>{results.params.r}</strong></>
                        )}
                      </td>
                    </tr>

                    {/* Filas de bloques de índice */}
                    {results.params.mode === "un_nivel" ? (
                      <tr className="hover:bg-[#faf6f2]">
                        <td className="py-2.5 px-3 font-medium font-sans text-[#52241A]">
                          bi (bloques índice)
                        </td>
                        <td className="py-2.5 px-3 text-[#52241A]/80">⌈ri / bfri⌉</td>
                        <td className="py-2.5 px-3 text-[#2b1610]">
                          ⌈{results.ri} / {results.bfri}⌉ = <strong>{results.bi}</strong>
                        </td>
                      </tr>
                    ) : (
                      results.levels.map((lvl) => (
                        <tr key={lvl.level} className="hover:bg-[#faf6f2]">
                          <td className="py-2.5 px-3 font-medium font-sans text-[#52241A]">
                            bi{lvl.level} (bloques índice Nivel {lvl.level})
                          </td>
                          <td className="py-2.5 px-3 text-[#52241A]/80">{lvl.formula}</td>
                          <td className="py-2.5 px-3 text-[#2b1610]">
                            {lvl.substitution} {lvl.blocks === 1 && <span className="text-emerald-700 font-sans font-bold text-xs ml-1">(Raíz alcanzada)</span>}
                          </td>
                        </tr>
                      ))
                    )}

                    <tr className="hover:bg-[#faf6f2]">
                      <td className="py-2.5 px-3 font-medium font-sans text-[#52241A]">
                        Accesos sin índice
                      </td>
                      <td className="py-2.5 px-3 text-[#52241A]/80">⌈log₂(b)⌉</td>
                      <td className="py-2.5 px-3 text-[#2b1610]">
                        ⌈log₂({results.b})⌉ = ⌈{results.accessesWithoutIndexExact.toFixed(4)}⌉ = <strong>{results.accessesWithoutIndex}</strong>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#faf6f2] bg-emerald-50/40">
                      <td className="py-2.5 px-3 font-bold font-sans text-emerald-900">
                        Accesos con índice {results.params.indexType === "primario" ? "Primario" : "Secundario"} ({results.params.mode === "un_nivel" ? "Un Nivel" : "Multinivel"})
                      </td>
                      <td className="py-2.5 px-3 text-emerald-800 font-medium">
                        {results.params.mode === "un_nivel"
                          ? "⌈log₂(bi)⌉ + 1"
                          : "t + 1 (niveles + datos)"}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-950 font-bold">
                        {results.params.mode === "un_nivel" ? (
                          <>
                            ⌈log₂({results.bi})⌉ + 1 = ⌈{results.accessesWithIndexExact.toFixed(4)}⌉ + 1 = <strong>{results.accessesWithIndex}</strong>
                          </>
                        ) : (
                          <>
                            {results.levels.length} + 1 = <strong>{results.accessesWithIndex}</strong>
                          </>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Visualización de la Estructura (como en la Imagen 3) ── */}
            <div className="rounded-2xl border border-[#52241A]/15 bg-white p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#52241A]/10">
                <h3 className="text-md font-bold text-[#52241A]">
                  Visualización de la Estructura
                </h3>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 text-slate-800 px-3 py-1 text-xs font-bold border border-slate-200">
                    Sin índice: {results.accessesWithoutIndex} accesos
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold border border-emerald-200">
                    Con índice {results.params.indexType === "primario" ? "primario" : "secundario"}: {results.accessesWithIndex} accesos
                  </span>
                </div>
              </div>

              {/* Contenedor relativo para columnas y punteros SVG */}
              <div ref={containerRef} className="relative w-full overflow-x-auto py-4">
                {/* Capa de Punteros SVG */}
                <svg className="pointer-events-none absolute inset-0 size-full z-10">
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                  {lines.map((line, idx) => {
                    const dx = line.x2 - line.x1
                    const cx1 = line.x1 + dx * 0.4
                    const cy1 = line.y1
                    const cx2 = line.x1 + dx * 0.6
                    const cy2 = line.y2

                    return (
                      <path
                        key={`line-${idx}-${line.label}`}
                        d={`M ${line.x1} ${line.y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${line.x2} ${line.y2}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.8"
                        strokeDasharray={line.label.includes("ellipsis") ? "4 3" : undefined}
                        markerEnd="url(#arrow)"
                      />
                    )
                  })}
                </svg>

                {/* Sub-etiquetas de encabezado */}
                <div className="grid grid-cols-2 gap-16 min-w-[650px] mb-3 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#52241A] uppercase tracking-wider">
                      Est. Índice ({results.params.indexType === "primario" ? "no denso" : "denso"})
                    </span>
                    <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                      {results.bi} bloques
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#52241A]/50 lowercase">
                      puntero
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#52241A] uppercase tracking-wider">
                        Est. Datos
                      </span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                        {results.b} bloques
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid con las dos columnas de bloques */}
                <div className="grid grid-cols-2 gap-16 min-w-[650px] px-2 text-xs">
                  {/* ── COLUMNA IZQUIERDA: BLOQUES DE ÍNDICE ──────────────── */}
                  <div className="flex flex-col gap-4">
                    {/* Bloque B1 del Índice */}
                    <div className="rounded-xl border border-slate-300 bg-slate-50/70 overflow-hidden shadow-xs">
                      <div className="bg-slate-200/80 px-3 py-1 font-bold text-slate-800 text-center text-[11px]">
                        B1
                      </div>
                      <div className="divide-y divide-slate-200 text-[11px] font-mono">
                        <div
                          data-pointer-from="b1_to_b1"
                          className="flex items-center justify-between px-3 py-1 bg-white hover:bg-blue-50/50"
                        >
                          <span className="text-slate-700">1</span>
                          <span className="font-semibold text-slate-900">Reg 1</span>
                        </div>

                        <div
                          data-pointer-from="b1_to_b2"
                          className="flex items-center justify-between px-3 py-1 bg-white hover:bg-blue-50/50"
                        >
                          <span className="text-slate-700">2</span>
                          <span className="font-semibold text-slate-900">Reg 2</span>
                        </div>

                        {results.bfri > 3 && (
                          <div className="py-1 text-center text-slate-400 bg-slate-50">
                            · · ·
                          </div>
                        )}

                        <div
                          data-pointer-from="b1_to_b_last_in_b1"
                          className="flex items-center justify-between px-3 py-1 bg-white hover:bg-blue-50/50"
                        >
                          <span className="text-slate-700">{results.bfri}</span>
                          <span className="font-semibold text-slate-900">
                            Reg {results.bfri}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloque B2 del Índice (si bi >= 2) */}
                    {results.bi >= 2 && (
                      <div className="rounded-xl border border-slate-300 bg-slate-50/70 overflow-hidden shadow-xs">
                        <div className="bg-slate-200/80 px-3 py-1 font-bold text-slate-800 text-center text-[11px]">
                          B2
                        </div>
                        <div className="divide-y divide-slate-200 text-[11px] font-mono">
                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-slate-700">{results.bfri + 1}</span>
                            <span className="font-semibold text-slate-900">
                              Reg {results.bfri + 1}
                            </span>
                          </div>

                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-slate-700">{results.bfri + 2}</span>
                            <span className="font-semibold text-slate-900">
                              Reg {results.bfri + 2}
                            </span>
                          </div>

                          {results.bfri > 3 && (
                            <div className="py-1 text-center text-slate-400 bg-slate-50">
                              · · ·
                            </div>
                          )}

                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-slate-700">{results.bfri * 2}</span>
                            <span className="font-semibold text-slate-900">
                              Reg {results.bfri * 2}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Separador elíptico si hay muchos bloques de índice */}
                    {results.bi > 3 && (
                      <div className="py-2 text-center text-slate-400 font-bold text-lg tracking-widest">
                        · · ·
                      </div>
                    )}

                    {/* Último Bloque de Índice B{bi} (si bi >= 3) */}
                    {results.bi >= 3 && (
                      <div className="rounded-xl border border-slate-300 bg-slate-50/70 overflow-hidden shadow-xs">
                        <div className="bg-slate-200/80 px-3 py-1 font-bold text-slate-800 text-center text-[11px]">
                          B{results.bi}
                        </div>
                        <div className="divide-y divide-slate-200 text-[11px] font-mono">
                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-slate-700">
                              {(results.bi - 1) * results.bfri + 1}
                            </span>
                            <span className="font-semibold text-slate-900">
                              Reg {(results.bi - 1) * results.bfri + 1}
                            </span>
                          </div>

                          {results.ri - ((results.bi - 1) * results.bfri + 1) > 1 && (
                            <div className="py-1 text-center text-slate-400 bg-slate-50">
                              · · ·
                            </div>
                          )}

                          <div
                            data-pointer-from="blast_to_blast"
                            className="flex items-center justify-between px-3 py-1 bg-white hover:bg-blue-50/50"
                          >
                            <span className="text-slate-700">{results.ri}</span>
                            <span className="font-semibold text-slate-900">
                              Reg {results.ri}
                            </span>
                          </div>

                          {/* Espacio libre sin uso del último bloque */}
                          {results.bi * results.bfri > results.ri && (
                            <div className="flex items-center justify-center px-3 py-1 bg-slate-100/80 text-[10px] text-slate-500 italic">
                              {results.ri + 1} - {results.bi * results.bfri} Reg sin uso
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── COLUMNA DERECHA: BLOQUES DE DATOS ─────────────────── */}
                  <div className="flex flex-col gap-4">
                    {/* Bloque B1 de Datos */}
                    <div
                      data-pointer-to="b1_to_b1"
                      className="rounded-xl border border-emerald-300 bg-emerald-50/50 overflow-hidden shadow-xs"
                    >
                      <div className="bg-emerald-200/80 px-3 py-1 font-bold text-emerald-900 text-center text-[11px]">
                        B1
                      </div>
                      <div className="divide-y divide-emerald-100 text-[11px] font-mono">
                        <div className="flex items-center justify-between px-3 py-1 bg-white">
                          <span className="text-emerald-700">1</span>
                          <span className="font-semibold text-emerald-950">Reg 1</span>
                        </div>

                        <div className="flex items-center justify-between px-3 py-1 bg-white">
                          <span className="text-emerald-700">2</span>
                          <span className="font-semibold text-emerald-950">Reg 2</span>
                        </div>

                        {results.bfr > 3 && (
                          <div className="py-1 text-center text-emerald-400 bg-emerald-50/30">
                            · · ·
                          </div>
                        )}

                        <div className="flex items-center justify-between px-3 py-1 bg-white">
                          <span className="text-emerald-700">{results.bfr}</span>
                          <span className="font-semibold text-emerald-950">
                            Reg {results.bfr}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloque B2 de Datos */}
                    {results.b >= 2 && (
                      <div
                        data-pointer-to="b1_to_b2"
                        className="rounded-xl border border-emerald-300 bg-emerald-50/50 overflow-hidden shadow-xs"
                      >
                        <div className="bg-emerald-200/80 px-3 py-1 font-bold text-emerald-900 text-center text-[11px]">
                          B2
                        </div>
                        <div className="divide-y divide-emerald-100 text-[11px] font-mono">
                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-emerald-700">{results.bfr + 1}</span>
                            <span className="font-semibold text-emerald-950">
                              Reg {results.bfr + 1}
                            </span>
                          </div>

                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-emerald-700">{results.bfr + 2}</span>
                            <span className="font-semibold text-emerald-950">
                              Reg {results.bfr + 2}
                            </span>
                          </div>

                          {results.bfr > 3 && (
                            <div className="py-1 text-center text-emerald-400 bg-emerald-50/30">
                              · · ·
                            </div>
                          )}

                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-emerald-700">{results.bfr * 2}</span>
                            <span className="font-semibold text-emerald-950">
                              Reg {results.bfr * 2}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Separador elíptico */}
                    {results.bfr > 2 && results.bfri < results.b && (
                      <div className="py-1 text-center text-emerald-400 font-bold text-lg tracking-widest">
                        · · ·
                      </div>
                    )}

                    {/* Bloque B{bfri} de Datos (último bloque al que apunta B1) */}
                    {results.bfri > 2 && results.bfri <= results.b && (
                      <div
                        data-pointer-to="b1_to_b_last_in_b1"
                        className="rounded-xl border border-emerald-300 bg-emerald-50/50 overflow-hidden shadow-xs"
                      >
                        <div className="bg-emerald-200/80 px-3 py-1 font-bold text-emerald-900 text-center text-[11px]">
                          B{results.bfri}
                        </div>
                        <div className="divide-y divide-emerald-100 text-[11px] font-mono">
                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-emerald-700">
                              {(results.bfri - 1) * results.bfr + 1}
                            </span>
                            <span className="font-semibold text-emerald-950">
                              Reg {(results.bfri - 1) * results.bfr + 1}
                            </span>
                          </div>

                          {results.bfr > 2 && (
                            <div className="py-1 text-center text-emerald-400 bg-emerald-50/30">
                              · · ·
                            </div>
                          )}

                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-emerald-700">
                              {results.bfri * results.bfr}
                            </span>
                            <span className="font-semibold text-emerald-950">
                              Reg {results.bfri * results.bfr}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Separador elíptico antes del último bloque de datos */}
                    {results.b > results.bfri + 1 && (
                      <div className="py-1 text-center text-emerald-400 font-bold text-lg tracking-widest">
                        · · ·
                      </div>
                    )}

                    {/* Último Bloque de Datos B{b} */}
                    {results.b > results.bfri && (
                      <div
                        data-pointer-to="blast_to_blast"
                        className="rounded-xl border border-emerald-300 bg-emerald-50/50 overflow-hidden shadow-xs"
                      >
                        <div className="bg-emerald-200/80 px-3 py-1 font-bold text-emerald-900 text-center text-[11px]">
                          B{results.b}
                        </div>
                        <div className="divide-y divide-emerald-100 text-[11px] font-mono">
                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-emerald-700">
                              {(results.b - 1) * results.bfr + 1}
                            </span>
                            <span className="font-semibold text-emerald-950">
                              Reg {(results.b - 1) * results.bfr + 1}
                            </span>
                          </div>

                          {results.params.r - ((results.b - 1) * results.bfr + 1) > 1 && (
                            <div className="py-1 text-center text-emerald-400 bg-emerald-50/30">
                              · · ·
                            </div>
                          )}

                          <div className="flex items-center justify-between px-3 py-1 bg-white">
                            <span className="text-emerald-700">{results.params.r}</span>
                            <span className="font-semibold text-emerald-950">
                              Reg {results.params.r}
                            </span>
                          </div>

                          {/* Espacio libre sin uso del último bloque */}
                          {results.b * results.bfr > results.params.r && (
                            <div className="flex items-center justify-center px-3 py-1 bg-emerald-50 text-[10px] text-emerald-700 italic">
                              {results.params.r + 1} - {results.b * results.bfr} Reg sin uso
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#52241A]/20 bg-white/60 p-12 text-center shadow-inner">
            <div className="size-16 rounded-2xl bg-[#E6B793]/30 grid place-items-center mb-4 text-[#52241A]">
              <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M4 4h16v4H4V4Zm0 6h10v4H4v-4Zm0 6h6v4H4v-4Zm14-1 4 3-4 3v-6Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#52241A]">Estructura de Índices sin calcular</h3>
            <p className="mt-2 max-w-md text-xs text-[#52241A]/70 leading-relaxed">
              Ingresa los parámetros requeridos en el formulario superior (número de registros, tamaño de bloque y tamaño de registros) y presiona <strong>"Crear estructura"</strong> para generar los cálculos y visualizar el diagrama conectado con punteros a disco.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
