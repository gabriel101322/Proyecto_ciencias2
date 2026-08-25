import { Dispatch, SetStateAction } from "react"
import { TREE_ALGORITHMS } from "../constants"
import { PendingChange } from "../types"

type TopTreeControlsProps = {
  hasData: boolean
  busy: boolean
  treeAlgo: string
  setTreeAlgo: Dispatch<SetStateAction<string>>
  clearTree: () => void
}

export function TopTreeControls({
  hasData,
  busy,
  treeAlgo,
  setTreeAlgo,
  clearTree,
}: TopTreeControlsProps) {
  return (
    <div className="flex items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52241A]/60">
          Algoritmo de Árbol
        </span>
        <select
          value={treeAlgo}
          onChange={(e) => {
            const val = e.target.value
            setTreeAlgo(val)
            if (hasData) clearTree() // Por ahora reiniciamos al cambiar
          }}
          disabled={busy}
          className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[13px] font-medium text-[#2b1610] shadow-sm outline-none transition focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
        >
          {TREE_ALGORITHMS.map((algo) => (
            <option key={algo} value={algo}>
              {algo}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={clearTree}
        disabled={busy || !hasData}
        className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Borrar árbol
      </button>


    </div>
  )
}

type BottomTreeControlsProps = {
  busy: boolean
  hasData: boolean
  treeAlgo: string
  keyInput: string
  setKeyInput: Dispatch<SetStateAction<string>>
  searchInput: string
  setSearchInput: Dispatch<SetStateAction<string>>
  insertKey: () => void
  deleteKey: () => void
  searchKey: () => void
}

export function BottomTreeControls({
  busy,
  hasData,
  treeAlgo,
  keyInput,
  setKeyInput,
  searchInput,
  setSearchInput,
  insertKey,
  deleteKey,
  searchKey,
}: BottomTreeControlsProps) {
  const isHuffman = treeAlgo === "Árbol de Huffman"

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-sm font-semibold text-[#52241A]">
        {isHuffman ? "Texto:" : "Clave:"}
      </span>
      <input
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && insertKey()}
        disabled={busy}
        placeholder={isHuffman ? "Ingresa un texto para Huffman" : "Espacio de texto"}
        className="h-10 min-w-0 flex-1 rounded-lg border border-[#52241A]/20 bg-white px-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50"
      />
      <button
        onClick={insertKey}
        disabled={busy || !keyInput.trim()}
        className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isHuffman ? "Generar Árbol" : "Insertar clave"}
      </button>
      
      <button
        onClick={deleteKey}
        disabled={busy || !hasData || !keyInput.trim()}
        className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-2 text-[12px] xl:px-3 xl:text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Borrar clave
      </button>

      <div className="relative min-w-0 flex-1 ml-4">
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
          onKeyDown={(e) => e.key === "Enter" && searchKey()}
          disabled={busy || !hasData}
          placeholder="Buscar clave"
          className="h-10 w-full rounded-lg border border-[#52241A]/20 bg-white pl-9 pr-3 text-[13px] text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793] disabled:opacity-50"
        />
      </div>
      <button
        onClick={searchKey}
        disabled={busy || !hasData || !searchInput.trim()}
        className="h-10 shrink-0 rounded-lg bg-[#52241A] px-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3d1912] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Buscar clave
      </button>
    </div>
  )
}
