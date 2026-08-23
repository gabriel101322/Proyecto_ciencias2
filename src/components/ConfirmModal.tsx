import { SectionId } from "../types"

type ConfirmModalProps = {
  pendingChange: {
    option: string
    sectionId?: SectionId
  } | null
  applyChange: (
    option: string,
    sectionId: SectionId | undefined,
    keepArray: boolean
  ) => void
}

export default function ConfirmModal({
  pendingChange,
  applyChange,
}: ConfirmModalProps) {
  if (!pendingChange) return null

  return (
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
              applyChange(pendingChange.option, pendingChange.sectionId, false)
            }
            className="h-10 rounded-lg border border-[#52241A]/20 bg-white px-4 text-[13px] font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5"
          >
            Empezar de cero
          </button>
          {/* Botón: Conservar */}
          <button
            onClick={() =>
              applyChange(pendingChange.option, pendingChange.sectionId, true)
            }
            className="h-10 rounded-lg bg-[#6B2E24] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]"
          >
            Mantener datos
          </button>
        </div>
      </div>
    </div>
  )
}
