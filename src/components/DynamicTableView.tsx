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
      <div className="mb-6 bg-white p-4 rounded-xl border border-[#E6B793]/50 shadow-sm w-full">
        <h3 className="text-md font-bold text-[#52241A] mb-3">{title} <span className="font-normal text-sm text-[#52241A]/70">({tableState.currentBuckets} cubetas)</span></h3>
        
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-center border-collapse border-spacing-0 bg-white rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#E6B793]/20">
                <th className="border border-[#E6B793] p-2 text-[#52241A] text-sm w-12"></th>
                {Array.from({ length: tableState.currentBuckets }).map((_, i) => (
                  <th key={i} className="border border-[#E6B793] p-2 text-[#52241A] min-w-[60px] bg-[#E6B793]/40 text-sm">
                    {i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRecords }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td className="border border-[#E6B793] p-2 text-[#52241A] font-medium bg-[#E6B793]/10 text-xs">
                    {rIdx + 1}
                  </td>
                  {table.map((bucket, bIdx) => {
                    const key = bucket[rIdx]
                    return (
                      <td key={`${rIdx}-${bIdx}`} className="border border-[#E6B793] p-1.5 h-[42px] min-w-[60px]">
                        {key ? (
                          <motion.div 
                            layoutId={`key-${key}`} 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#E6B793] text-[#52241A] rounded px-2 py-1 mx-auto w-fit min-w-[40px] font-semibold text-sm shadow-sm"
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
                    <td className="border border-[#E6B793] p-2 text-[#52241A] font-medium bg-red-100 text-xs">
                      C{cIdx > 0 ? cIdx + 1 : ""}
                    </td>
                    {table.map((bucket, bIdx) => {
                      const key = bucket[maxRecords + cIdx]
                      return (
                        <td key={`c-${cIdx}-${bIdx}`} className={`border border-[#E6B793] p-1.5 h-[42px] ${key ? "bg-red-50" : ""}`}>
                          {key ? (
                            <motion.div 
                              layoutId={`key-${key}`} 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-red-200 text-red-800 rounded px-2 py-1 mx-auto w-fit min-w-[40px] font-bold text-sm shadow-sm"
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
    <div className="w-full flex flex-col items-center">
      {animatingState ? (
        <div className="w-full flex flex-col gap-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold text-sm text-center mb-2 shadow-sm">
            Reorganizando claves... ({animatingState.oldState.currentBuckets} → {animatingState.newState.currentBuckets} cubetas)
          </div>
          <div className="flex flex-col xl:flex-row gap-4 w-full">
            <div className="flex-1 opacity-60 pointer-events-none">
              {renderTable(animatingState.oldState, "Tabla Original")}
            </div>
            <div className="flex-1">
              {renderTable(animatingState.newState, "Tabla Nueva")}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          {state && renderTable(state, "Tabla Hash Dinámica")}
        </div>
      )}
    </div>
  )
}
