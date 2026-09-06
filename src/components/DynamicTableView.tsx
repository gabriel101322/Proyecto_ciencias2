import { DynamicState, generateDynamicTable } from "../utils/dynamicHashUtils"

interface DynamicTableViewProps {
  state: DynamicState | null
}

export default function DynamicTableView({ state }: DynamicTableViewProps) {
  if (!state) return null

  const table = generateDynamicTable(state.keys, state.currentBuckets)
  const maxRecords = state.config.recordsPerBucket

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-[#52241A] mb-4">Tabla Hash Dinámica</h3>
      
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-center border-collapse border-spacing-0 bg-white shadow-sm rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#E6B793]/30">
              <th className="border border-[#E6B793] p-2 text-[#52241A]"></th>
              {Array.from({ length: state.currentBuckets }).map((_, i) => (
                <th key={i} className="border border-[#E6B793] p-2 text-[#52241A] min-w-[60px] bg-[#E6B793]/50">
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRecords }).map((_, rIdx) => (
              <tr key={rIdx}>
                <td className="border border-[#E6B793] p-2 text-[#52241A] font-medium bg-[#E6B793]/20">
                  {rIdx + 1}
                </td>
                {table.map((bucket, bIdx) => (
                  <td key={`${rIdx}-${bIdx}`} className="border border-[#E6B793] p-2">
                    {bucket[rIdx] || ""}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Overflow "C" rows */}
            {table.some(b => b.length > maxRecords) && (
              Array.from({ length: Math.max(...table.map(b => b.length)) - maxRecords }).map((_, cIdx) => (
                <tr key={`c-${cIdx}`}>
                  <td className="border border-[#E6B793] p-2 text-[#52241A] font-medium bg-red-100">
                    C{cIdx > 0 ? cIdx + 1 : ""}
                  </td>
                  {table.map((bucket, bIdx) => {
                    const key = bucket[maxRecords + cIdx]
                    return (
                      <td key={`c-${cIdx}-${bIdx}`} className={`border border-[#E6B793] p-2 ${key ? "bg-red-50 text-red-700 font-bold" : ""}`}>
                        {key || ""}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {state.history.length > 0 && (
        <div className="mt-8">
          <h4 className="font-bold text-[#52241A] mb-3 border-b border-[#E6B793] pb-1">Historial de Operaciones</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {[...state.history].reverse().map((op, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${op.didExpand ? "bg-blue-50 border-blue-200" : op.didReduce ? "bg-orange-50 border-orange-200" : "bg-[#faf6f2] border-[#E6B793]/30"}`}>
                <div className="font-semibold mb-1 flex justify-between">
                  <span>{op.action}</span>
                  <span className="text-gray-500 font-normal">
                    DO Exp: {op.doExp.toFixed(2)}% | DO Red: {op.doRed.toFixed(2)}%
                  </span>
                </div>
                {op.didExpand && (
                  <p className="text-blue-700 mt-1 font-medium">
                    ¡Expansión requerida! N pasa de {op.oldBuckets} a {op.newBuckets} cubetas.
                  </p>
                )}
                {op.didReduce && (
                  <p className="text-orange-700 mt-1 font-medium">
                    ¡Reducción requerida! N pasa de {op.oldBuckets} a {op.newBuckets} cubetas.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
