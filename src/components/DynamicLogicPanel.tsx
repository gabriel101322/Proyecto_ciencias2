import { motion } from "framer-motion"
import { DynamicState } from "../utils/dynamicHashUtils"

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
  const currentBuckets = dynamicState?.currentBuckets || 0
  const keysCount = dynamicState?.keys.length || 0
  const R = config?.recordsPerBucket || 1
  const currentCapacity = currentBuckets * R

  // Cubetas y capacidad reducida proyectada
  const redBuckets = config?.isPartial
    ? Math.max(config.initialBuckets, currentBuckets - 1)
    : Math.max(config?.initialBuckets || 1, Math.floor(currentBuckets / 2))
  const redCapacity = redBuckets * R

  // DOs reales actuales sincronizadas
  const realDoExp = currentCapacity > 0 ? (keysCount / currentCapacity) * 100 : 0
  const realDoRed = redCapacity > 0 ? (keysCount / redCapacity) * 100 : 0

  return (
    <div className="w-[280px] xl:w-[290px] shrink-0 flex flex-col rounded-2xl border border-[#52241A]/15 bg-white shadow-sm select-none">
      <div className="px-3 py-2.5 border-b border-[#52241A]/15 bg-gradient-to-r from-[#52241A] to-[#6B2E24] rounded-t-2xl flex items-center justify-between shrink-0">
        <h3 className="text-[11.5px] font-bold text-white uppercase tracking-[0.14em]">
          Procedimiento Lógico (DO)
        </h3>
        {config && (
          <span className="text-[9.5px] rounded-full bg-white/10 px-2 py-0.5 text-white/90 font-mono">
            {config.isPartial ? "Parcial" : "Total"}
          </span>
        )}
      </div>

      <div className="p-2.5 bg-[#faf6f2]/40 rounded-b-2xl flex flex-col gap-2">
        {dynamicState && config ? (
          <>
            {/* Resumen de ocupación */}
            <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-white border border-[#E6B793]/40 text-xs shadow-2xs">
              <span className="text-[10.5px] font-medium text-[#52241A]/70">Capacidad:</span>
              <span className="font-mono font-bold text-[#52241A] text-[11.5px]">
                {keysCount} / {currentCapacity} <span className="font-normal text-[10px] text-[#52241A]/60">({currentBuckets} cubetas)</span>
              </span>
            </div>

            {/* Tarjeta 1: DO para Expansión */}
            <div className="bg-white p-2 rounded-xl border border-[#E6B793]/40 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#52241A] text-[11px]">DO (Expansión)</span>
                <span className="font-mono text-[9px] bg-[#52241A]/5 text-[#52241A]/70 px-1.5 py-0.5 rounded">
                  (n / Capacidad) × 100
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-[10.5px] text-[#52241A]/70">Valor actual:</span>
                <span className={`font-mono text-sm font-bold ${
                  realDoExp >= config.expThreshold ? "text-blue-600" : "text-[#52241A]"
                }`}>
                  {realDoExp.toFixed(2)}%
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="relative h-2 w-full bg-[#52241A]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, realDoExp)}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`h-full rounded-full transition-colors ${
                    realDoExp >= config.expThreshold ? "bg-blue-600" : "bg-[#6B2E24]"
                  }`}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
                  style={{ left: `${Math.min(100, config.expThreshold)}%` }}
                  title={`Umbral: ${config.expThreshold}%`}
                />
              </div>

              <div className="flex justify-between items-center text-[9.5px] text-[#52241A]/60 font-medium">
                <span>0%</span>
                <span className="text-rose-700 font-semibold">Umbral: {config.expThreshold}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Tarjeta 2: DO para Reducción */}
            <div className="bg-white p-2 rounded-xl border border-[#E6B793]/40 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#52241A] text-[11px]">DO (Reducción)</span>
                <span className="font-mono text-[9px] bg-[#52241A]/5 text-[#52241A]/70 px-1.5 py-0.5 rounded">
                  (n / Cap. Red.) × 100
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-[10.5px] text-[#52241A]/70">Valor actual:</span>
                <span className={`font-mono text-sm font-bold ${
                  realDoRed <= config.redThreshold && currentBuckets > config.initialBuckets
                    ? "text-orange-600"
                    : "text-[#52241A]"
                }`}>
                  {realDoRed.toFixed(2)}%
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="relative h-2 w-full bg-[#52241A]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, realDoRed)}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`h-full rounded-full transition-colors ${
                    realDoRed <= config.redThreshold && currentBuckets > config.initialBuckets
                      ? "bg-orange-500"
                      : "bg-[#52241A]"
                  }`}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
                  style={{ left: `${Math.min(100, config.redThreshold)}%` }}
                  title={`Umbral: ${config.redThreshold}%`}
                />
              </div>

              <div className="flex justify-between items-center text-[9.5px] text-[#52241A]/60 font-medium">
                <span>0%</span>
                <span className="text-rose-700 font-semibold">Umbral: {config.redThreshold}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Notificación concisa de cambio de cubetas */}
            {(latestOp?.didExpand || latestOp?.didReduce) && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold shadow-xs flex items-center justify-between ${
                  latestOp.didExpand
                    ? "bg-blue-50 border-blue-200 text-blue-900"
                    : "bg-orange-50 border-orange-200 text-orange-900"
                }`}
              >
                <span>{latestOp.didExpand ? "¡Expansión!" : "¡Reducción!"}</span>
                <span className="font-mono text-[10px] opacity-80">
                  {latestOp.oldBuckets} → {latestOp.newBuckets} cubetas
                </span>
              </motion.div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-5">
            <div className="size-8 rounded-xl bg-[#E6B793]/20 border border-[#E6B793]/40 grid place-items-center mb-1 text-[#52241A]">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10M6 10h10M6 14h6" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold text-[#52241A]/70">
              DO en tiempo real
            </p>
            <p className="text-[10px] text-[#52241A]/40 mt-0.5">
              Inserta o elimina claves para monitorear los porcentajes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
