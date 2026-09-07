import { ReactNode } from "react"
import { DynamicState, OperationResult } from "../utils/dynamicHashUtils"

type DynamicLogicPanelProps = {
  isDynamic: boolean
  dynamicState: DynamicState | null
}

export default function DynamicLogicPanel({
  isDynamic,
  dynamicState,
}: DynamicLogicPanelProps) {
  if (!isDynamic) return null

  const latestOp = dynamicState?.history[dynamicState.history.length - 1]
  const config = dynamicState?.config

  return (
    <div className="min-h-0 w-[35%] flex-shrink-0 flex flex-col rounded-2xl border border-[#52241A]/15 bg-white shadow-sm transition-all duration-300">
      <div className="p-3 border-b border-[#52241A]/15 bg-[#52241A] rounded-t-2xl">
        <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.14em]">
          Procedimiento Lógico (DO)
        </h3>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-[#faf6f2]/30 rounded-b-2xl">
        {latestOp && config ? (
          <>
            <h4 className="text-[13px] font-bold text-[#6B2E24] mb-3 pb-2 border-b border-[#E6B793]/50">
              {latestOp.action}
            </h4>
            <div className="space-y-4 text-sm text-[#2b1610]">
              <div className="bg-white p-3 rounded-lg border border-[#E6B793]/40 shadow-sm">
                <p className="font-semibold text-[#52241A] mb-1">Cálculo de DO (Expansión):</p>
                <div className="flex justify-between items-center mb-1">
                  <span>Fórmula:</span>
                  <span className="font-mono text-[10px] bg-gray-100 px-1 rounded">(Nº Claves / (Cubetas × Registros)) × 100</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Resultado:</span>
                  <span className={latestOp.doExp >= config.expThreshold ? "text-blue-600 font-bold" : ""}>
                    {latestOp.doExp.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>Umbral de Expansión:</span>
                  <span>{config.expThreshold}%</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E6B793]/40 shadow-sm">
                <p className="font-semibold text-[#52241A] mb-1">Cálculo de DO (Reducción):</p>
                <div className="flex justify-between items-center mb-1">
                  <span>Fórmula:</span>
                  <span className="font-mono text-[10px] bg-gray-100 px-1 rounded">(Nº Claves / Cubetas) × 100</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Resultado:</span>
                  <span className={latestOp.doRed <= config.redThreshold && latestOp.oldBuckets > config.initialBuckets ? "text-orange-600 font-bold" : ""}>
                    {latestOp.doRed.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>Umbral de Reducción:</span>
                  <span>{config.redThreshold}%</span>
                </div>
              </div>

              {(latestOp.didExpand || latestOp.didReduce) && (
                <div className={`p-3 rounded-lg border font-medium ${
                  latestOp.didExpand 
                    ? "bg-blue-50 border-blue-200 text-blue-700" 
                    : "bg-orange-50 border-orange-200 text-orange-700"
                }`}>
                  {latestOp.didExpand 
                    ? `¡Expansión requerida! N pasa de ${latestOp.oldBuckets} a ${latestOp.newBuckets} cubetas.` 
                    : `¡Reducción requerida! N pasa de ${latestOp.oldBuckets} a ${latestOp.newBuckets} cubetas.`
                  }
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <p className="text-sm font-medium text-[#52241A]/50">
              Genera la tabla e inserta o elimina una clave para ver el cálculo de Densidad de Ocupación.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
