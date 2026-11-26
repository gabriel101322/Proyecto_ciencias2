import { DynamicState, generateDynamicTable } from "../utils/dynamicHashUtils"
import { motion } from "framer-motion"

interface DynamicTableViewProps {
  state: DynamicState | null
  animatingState: {
    isAnimating: boolean
    oldState: DynamicState
    newState: DynamicState
  } | null
}

export default function DynamicTableView({ state, animatingState }: DynamicTableViewProps) {
  if (!state && !animatingState) return null

  const renderTable = (tableState: DynamicState, title: string) => {
    const table = generateDynamicTable(tableState.keys, tableState.currentBuckets)
    const maxRecords = tableState.config.recordsPerBucket

    return (
      <div className="bg-white p-3.5 rounded-2xl border border-[#52241A]/15 shadow-sm w-full flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2.5 shrink-0">
          <h3 className="text-sm font-bold text-[#52241A]">
            {title} <span className="font-normal text-xs text-[#52241A]/70">({tableState.currentBuckets} cubetas)</span>
          </h3>
        </div>

        {/* Deslizador exclusivo para la tabla horizontal y vertical */}
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 pb-2 custom-scrollbar">
          <table className="w-full text-center border-collapse border-spacing-0 bg-white rounded-lg">
            <thead>
              <tr className="bg-[#E6B793]/20 sticky top-0 z-10">
                <th className="border border-[#E6B793] p-1.5 text-[#52241A] text-xs w-10 bg-[#FAF4EE]"></th>
                {Array.from({ length: tableState.currentBuckets }).map((_, i) => (
                  <th key={i} className="border border-[#E6B793] p-1.5 text-[#52241A] min-w-[58px] bg-[#E6B793]/40 text-xs font-bold">
                    {i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRecords }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td className="border border-[#E6B793] p-1.5 text-[#52241A] font-medium bg-[#E6B793]/10 text-xs">
                    {rIdx + 1}
                  </td>
                  {table.map((bucket, bIdx) => {
                    const key = bucket[rIdx]
                    return (
                      <td key={`${rIdx}-${bIdx}`} className="border border-[#E6B793] p-1 h-[38px] min-w-[58px]">
                        {key ? (
                          <motion.div
                            layoutId={`key-${key}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#E6B793] text-[#52241A] rounded px-2 py-0.5 mx-auto w-fit min-w-[36px] font-semibold text-xs shadow-xs"
                          >
                            {key}
                          </motion.div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Overflow "C" rows */}
              {table.some(b => b.length > maxRecords) && (
                Array.from({ length: Math.max(...table.map(b => b.length)) - maxRecords }).map((_, cIdx) => (
                  <tr key={`c-${cIdx}`}>
                    <td className="border border-[#E6B793] p-1.5 text-[#52241A] font-medium bg-red-100 text-xs">
                      C{cIdx > 0 ? cIdx + 1 : ""}
                    </td>
                    {table.map((bucket, bIdx) => {
                      const key = bucket[maxRecords + cIdx]
                      return (
                        <td key={`c-${cIdx}-${bIdx}`} className={`border border-[#E6B793] p-1 h-[38px] ${key ? "bg-red-50" : ""}`}>
                          {key ? (
                            <motion.div
                              layoutId={`key-${key}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-red-200 text-red-800 rounded px-2 py-0.5 mx-auto w-fit min-w-[36px] font-bold text-xs shadow-xs"
                            >
                              {key}
                            </motion.div>
                          ) : null}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1 flex flex-col h-full">
      {animatingState ? (
        <div className="min-w-0 w-full flex-1 flex flex-col gap-2">
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold text-xs text-center shrink-0 shadow-xs">
            Reorganizando claves ({animatingState.oldState.currentBuckets} → {animatingState.newState.currentBuckets} cubetas)...
          </div>
          <div className="flex-1 min-h-0 flex gap-3 w-full">
            <div className="flex-1 min-w-0 opacity-50 pointer-events-none flex flex-col">
              {renderTable(animatingState.oldState, "Tabla Previa")}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              {renderTable(animatingState.newState, "Tabla Nueva")}
            </div>
          </div>
        </div>
      ) : (
        <div className="min-w-0 w-full flex-1 flex flex-col">
          {state && renderTable(state, "Tabla Hash Dinámica")}
        </div>
      )}
    </div>
  )
}
