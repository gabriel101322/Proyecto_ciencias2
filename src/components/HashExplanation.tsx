import { ReactNode } from "react"

type HashExplanationProps = {
  isHash: boolean
  hashExplanation: { title: string; steps: ReactNode[] } | null
}

export default function HashExplanation({
  isHash,
  hashExplanation,
}: HashExplanationProps) {
  if (!isHash) return null

  return (
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
            <div>{hashExplanation.steps}</div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <p className="text-sm font-medium text-[#52241A]/50">
              Inserta una clave para ver el procedimiento paso a paso de la
              función Hash.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
