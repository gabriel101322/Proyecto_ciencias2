import { Dispatch, SetStateAction, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HASH_ALGORITHMS, COLLISION_SOLUTIONS } from "../constants"
import { PendingChange } from "../types"

type TopControlsProps = {
  isHash: boolean
  hasData: boolean
  hasInsertedData: boolean
  busy: boolean
  keySize: number
  setKeySize: Dispatch<SetStateAction<number>>
  arraySizeInput: string
  setArraySizeInput: Dispatch<SetStateAction<string>>
  hashAlgo: string
  requestChange: (change: PendingChange) => void
  collision: string
  doubleHash: string
  triggerRehash: (algo: string, coll: string, double: string) => void
  generateTable: () => void
  clearTable: () => void
  onSave: () => void
  onOpen: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TopControls({
  isHash,
  hasData,
  hasInsertedData,
  busy,
  keySize,
  setKeySize,
  arraySizeInput,
  setArraySizeInput,
  hashAlgo,
  requestChange,
  collision,
  doubleHash,
  triggerRehash,
  generateTable,
  clearTable,
  onSave,
  onOpen,
}: TopControlsProps) {
  return (
    <div className="flex flex-wrap items-end gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
          Tamaño de la clave
        </span>
        <select
          value={keySize}
          onChange={(e) => setKeySize(Number(e.target.value))}
          disabled={hasInsertedData || busy}
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
              requestChange({ type: "hashAlgo", algo: val })
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
        className="h-10 shrink-0 rounded-lg bg-[#52241A] px-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#6B2E24] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:bg-[#52241A]"
      >
        Generar arreglo
      </button>
      <button
        onClick={clearTable}
        disabled={busy}
        className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-3.5 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Borrar arreglo
      </button>

      <div className="ml-auto flex items-end gap-2.5">
        <label className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
          <input type="file" accept=".json" className="hidden" onChange={onOpen} />
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
        </label>
        <button onClick={onSave} className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
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
        <button
          onClick={() => window.print()}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 active:scale-[0.98]"
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
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" />
          </svg>
          Imprimir
        </button>
      </div>
    </div>
  )
}

type BottomControlsProps = {
  isHash: boolean
  busy: boolean
  hasRows: boolean
  keyInput: string
  setKeyInput: Dispatch<SetStateAction<string>>
  insertHash: () => void
  insertSequential: () => void
  insertAuto: () => void
  deleteSequential: () => void
  handleSearch: () => void
  hashAlgo: string
  collision: string
  requestChange: (change: PendingChange) => void
  doubleHash: string
  collisionOpen: boolean
  setCollisionOpen: Dispatch<SetStateAction<boolean>>
  triggerRehash: (algo: string, coll: string, double: string) => void
}

export function BottomControls({
  isHash,
  busy,
  hasRows,
  keyInput,
  setKeyInput,
  insertHash,
  insertSequential,
  insertAuto,
  deleteSequential,
  handleSearch,
  hashAlgo,
  collision,
  requestChange,
  doubleHash,
  collisionOpen,
  setCollisionOpen,
  triggerRehash,
}: BottomControlsProps) {
  const [doubleHashOpen, setDoubleHashOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="shrink-0 text-sm font-semibold text-[#52241A]">
        Clave:
      </span>
      <input
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && (isHash ? insertHash() : insertSequential())
        }
        disabled={busy}
        placeholder="Espacio de texto"
        className="h-10 min-w-0 flex-1 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50"
      />
      <button
        onClick={isHash ? insertHash : insertSequential}
        disabled={
          busy ||
          !hasRows ||
          (isHash &&
            (!hashAlgo ||
              !collision ||
              (collision === "Doble Función Hash" && !doubleHash)))
        }
        className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Insertar clave
      </button>
      <button
        onClick={insertAuto}
        disabled={
          busy ||
          !hasRows ||
          (isHash &&
            (!hashAlgo ||
              !collision ||
              (collision === "Doble Función Hash" && !doubleHash)))
        }
        className="h-10 shrink-0 rounded-lg bg-[#E6B793] text-[#52241A] px-3.5 text-[13px] font-bold shadow-sm transition hover:bg-[#D5A37F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Insertar Auto
      </button>
      <button
        onClick={deleteSequential}
        disabled={busy || !hasRows}
        className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-3.5 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Borrar clave
      </button>

      <button
        onClick={handleSearch}
        disabled={busy || !hasRows || !keyInput.trim()}
        className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Buscar
      </button>

      {isHash && (
        <div className="relative shrink-0">
          <span className="pointer-events-none absolute bottom-full left-0 mb-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-[#52241A]/60">
            Solución de colisiones
          </span>
          <button
            onClick={() => setCollisionOpen((o) => !o)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
          >
            <span className="font-semibold">
              {collision || "Seleccione..."}
              {collision === "Doble Función Hash" &&
                doubleHash &&
                ` (${doubleHash})`}
            </span>
            <svg
              viewBox="0 0 24 24"
              className={`size-4 transition-transform ${
                collisionOpen ? "rotate-180" : ""
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

          <AnimatePresence>
            {collisionOpen && (
              <>
                {/* capa para cerrar al hacer clic fuera */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setCollisionOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute bottom-full right-0 z-20 mb-2 w-60 overflow-hidden rounded-xl border border-[#52241A]/15 bg-white py-1 shadow-2xl"
                >
                  {COLLISION_SOLUTIONS.map((sol) => {
                    const selected = sol === collision
                    const isDouble = sol === "Doble Función Hash"
                    return (
                      <div key={sol}>
                        <button
                          onClick={() => {
                            if (!isDouble) {
                              setCollisionOpen(false)
                              requestChange({ type: "collision", coll: sol })
                            } else {
                              setDoubleHashOpen((o) => !o)
                            }
                          }}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                            selected
                              ? "bg-[#E6B793]/30 font-bold text-[#52241A]"
                              : "text-[#2b1610] hover:bg-[#52241A]/5"
                          }`}
                        >
                          {sol}
                          {isDouble && (
                            <svg
                              viewBox="0 0 24 24"
                              className={`size-4 transition-transform text-[#52241A]/50 ${doubleHashOpen ? "rotate-90" : ""}`}
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
                        <AnimatePresence>
                          {isDouble && (selected || doubleHashOpen) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-[#52241A]/10 bg-[#faf6f2]/80 py-1"
                            >
                              {HASH_ALGORITHMS.map((algo) => (
                                <button
                                  key={algo}
                                  onClick={() => {
                                    setCollisionOpen(false)
                                    setDoubleHashOpen(false)
                                    requestChange({ type: "collision", coll: "Doble Función Hash", double: algo })
                                  }}
                                  className={`block w-full px-8 py-1.5 text-left text-[12px] transition-colors ${
                                    algo === doubleHash
                                      ? "font-bold text-[#6B2E24] bg-[#E6B793]/20"
                                      : "text-[#52241A]/70 hover:text-[#52241A] hover:bg-white/50"
                                  }`}
                                >
                                  {algo}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
