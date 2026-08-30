import { PendingChange } from "../types"

type ConfirmModalProps = {
  pendingChange: PendingChange | null
  applyChange: (change: PendingChange, keepArray: boolean) => void
  cancelChange: () => void
  activeOption: string
  hasInsertedData: boolean
  hasTreeData: boolean
}

export default function ConfirmModal({
  pendingChange,
  applyChange,
  cancelChange,
  activeOption,
  hasInsertedData,
  hasTreeData
}: ConfirmModalProps) {
  if (!pendingChange) return null

  if (pendingChange.type === "section") {
    const isCurrentTree = activeOption === "Árboles de Búsqueda"
    const isNewTree = pendingChange.option === "Árboles de Búsqueda"
    
    if (isCurrentTree && !isNewTree && hasTreeData) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1610]/40 backdrop-blur-[2px] transition-all">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-[#faf6f2] p-7 shadow-2xl ring-1 ring-[#52241A]/10">
            <h3 className="text-xl font-semibold text-[#52241A]">
              Advertencia
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/75">
              Estás a punto de cambiar a{" "}
              <strong className="font-semibold text-[#6B2E24]">
                "{pendingChange.option}"
              </strong>
              . Tu árbol actual será eliminado, ya que esta sección utiliza arreglos. ¿Deseas continuar?
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => cancelChange()}
                className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
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
          </div>
        </div>
      )
    }

    if (!isCurrentTree && isNewTree && hasInsertedData) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1610]/40 backdrop-blur-[2px] transition-all">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-[#faf6f2] p-7 shadow-2xl ring-1 ring-[#52241A]/10">
            <h3 className="text-xl font-semibold text-[#52241A]">
              Advertencia
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/75">
              Estás a punto de cambiar a{" "}
              <strong className="font-semibold text-[#6B2E24]">
                "{pendingChange.option}"
              </strong>
              . Tu arreglo actual será eliminado, ya que esta sección utiliza árboles. ¿Deseas continuar?
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => cancelChange()}
                className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
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
          </div>
        </div>
      )
    }

    if (!isCurrentTree && !isNewTree && hasInsertedData) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1610]/40 backdrop-blur-[2px] transition-all">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-[#faf6f2] p-7 shadow-2xl ring-1 ring-[#52241A]/10">
            <h3 className="text-xl font-semibold text-[#52241A]">
              ¿Conservar arreglo actual?
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/75">
              Estás a punto de cambiar a{" "}
              <strong className="font-semibold text-[#6B2E24]">
                "{pendingChange.option}"
              </strong>
              . ¿Deseas mantener los datos actuales en la tabla o empezar con un
              arreglo vacío?
            </p>
  
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => cancelChange()}
                className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => applyChange(pendingChange, false)}
                className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
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
          </div>
        </div>
      )
    }

    return null
  }

  const isHash = pendingChange.type === "hashAlgo"
  const newName = isHash ? pendingChange.algo : pendingChange.coll
  const title = isHash ? "Cambio de Algoritmo Hash" : "Cambio de Resolución de Colisiones"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1610]/40 backdrop-blur-[2px] transition-all">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-[#faf6f2] p-7 shadow-2xl ring-1 ring-[#52241A]/10">
        <h3 className="text-xl font-semibold text-[#52241A]">
          {title}
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-[#52241A]/75">
          Estás a punto de cambiar a{" "}
          <strong className="font-semibold text-[#6B2E24]">
            "{newName}"
          </strong>
          . Esto reorganizará (rehasheará) todos los datos de la tabla inmediatamente. ¿Estás seguro de realizar este cambio?
        </p>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => cancelChange()}
            className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
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
      </div>
    </div>
  )
}
