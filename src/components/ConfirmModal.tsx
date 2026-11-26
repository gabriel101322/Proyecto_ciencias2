import { motion, AnimatePresence } from "framer-motion"
import { PendingChange } from "../types"

type ConfirmModalProps = {
  pendingChange: PendingChange | null
  applyChange: (change: PendingChange, keepArray: boolean) => void
  cancelChange: () => void
  activeOption: string
  hasInsertedData: boolean
  hasTreeData: boolean
}

const ModalBox = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1610]/55 backdrop-blur-[3px] p-4"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full max-w-md rounded-2xl bg-[#faf6f2] p-7 shadow-2xl ring-1 ring-[#52241A]/10 border border-[#E6B793]/40"
    >
      {children}
    </motion.div>
  </motion.div>
)

export default function ConfirmModal({
  pendingChange,
  applyChange,
  cancelChange,
  activeOption,
  hasInsertedData,
  hasTreeData,
}: ConfirmModalProps) {
  if (!pendingChange) return null

  if (pendingChange.type === "section") {
    const isCurrentTree = activeOption === "Árboles de Búsqueda"
    const isNewTree = pendingChange.option === "Árboles de Búsqueda"

    if (isCurrentTree && !isNewTree && hasTreeData) {
      return (
        <ModalBox>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-[#52241A]">Advertencia de cambio</h3>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/80">
            Estás a punto de cambiar a{" "}
            <strong className="font-semibold text-[#6B2E24]">
              "{pendingChange.option}"
            </strong>
            . Tu árbol actual será eliminado, ya que esta sección utiliza arreglos. ¿Deseas continuar?
          </p>
          <div className="mt-7 flex justify-end gap-2.5">
            <button
              onClick={() => cancelChange()}
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-semibold text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={() => applyChange(pendingChange, false)}
              className="h-10 rounded-lg bg-[#6B2E24] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]"
            >
              Continuar y eliminar
            </button>
          </div>
        </ModalBox>
      )
    }

    if (!isCurrentTree && isNewTree && hasInsertedData) {
      return (
        <ModalBox>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-[#52241A]">Advertencia de cambio</h3>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/80">
            Estás a punto de cambiar a{" "}
            <strong className="font-semibold text-[#6B2E24]">
              "{pendingChange.option}"
            </strong>
            . Tu arreglo actual será eliminado, ya que esta sección utiliza árboles. ¿Deseas continuar?
          </p>
          <div className="mt-7 flex justify-end gap-2.5">
            <button
              onClick={() => cancelChange()}
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-semibold text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={() => applyChange(pendingChange, false)}
              className="h-10 rounded-lg bg-[#6B2E24] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]"
            >
              Continuar y eliminar
            </button>
          </div>
        </ModalBox>
      )
    }

    if (!isCurrentTree && !isNewTree && hasInsertedData) {
      return (
        <ModalBox>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E6B793]/30 text-[#52241A]">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 3v18M3 12h18" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-[#52241A]">
              ¿Conservar arreglo actual?
            </h3>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/80">
            Estás a punto de cambiar a{" "}
            <strong className="font-semibold text-[#6B2E24]">
              "{pendingChange.option}"
            </strong>
            . ¿Deseas mantener los datos actuales en la tabla o empezar con un arreglo vacío?
          </p>

          <div className="mt-7 flex justify-end gap-2.5 flex-wrap">
            <button
              onClick={() => cancelChange()}
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-3.5 text-[13px] font-semibold text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={() => applyChange(pendingChange, false)}
              className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-3.5 text-[13px] font-semibold text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 active:scale-[0.98]"
            >
              Empezar de cero
            </button>
            <button
              onClick={() => applyChange(pendingChange, true)}
              className="h-10 rounded-lg bg-[#6B2E24] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]"
            >
              Mantener datos
            </button>
          </div>
        </ModalBox>
      )
    }

    return null
  }

  const isHash = pendingChange.type === "hashAlgo"
  const newName = isHash ? pendingChange.algo : pendingChange.coll
  const title = isHash ? "Cambio de Algoritmo Hash" : "Cambio de Resolución de Colisiones"

  return (
    <ModalBox>
      <div className="flex items-center gap-3 mb-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E6B793]/30 text-[#52241A]">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
        </span>
        <h3 className="text-lg font-bold text-[#52241A]">
          {title}
        </h3>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/80">
        Estás a punto de cambiar a{" "}
        <strong className="font-semibold text-[#6B2E24]">
          "{newName}"
        </strong>
        . Esto reorganizará (rehasheará) todos los datos de la tabla inmediatamente. ¿Estás seguro de realizar este cambio?
      </p>

      <div className="mt-7 flex justify-end gap-2.5">
        <button
          onClick={() => cancelChange()}
          className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-semibold text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5 active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          onClick={() => applyChange(pendingChange, true)}
          className="h-10 rounded-lg bg-[#6B2E24] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]"
        >
          Sí, aplicar cambio
        </button>
      </div>
    </ModalBox>
  )
}
