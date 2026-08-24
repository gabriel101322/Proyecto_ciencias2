import { HuffmanLogicData } from "../types"

interface HuffmanExplanationProps {
  data: HuffmanLogicData
}

export default function HuffmanExplanation({ data }: HuffmanExplanationProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. Probabilidades Iniciales */}
      <section className="rounded-xl border border-[#52241A]/10 bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-semibold text-[#52241A]">1. Probabilidades Iniciales</h4>
        <div className="flex flex-wrap gap-4 font-mono text-sm">
          {Object.entries(data.initialFrequencies).map(([char, freq]) => (
            <div key={char} className="flex items-center gap-1">
              <span className="font-bold text-[#6B2E24]">{char === " " ? "ESPACIO" : char}</span>
              <span>=</span>
              <span className="rounded bg-[#52241A]/5 px-1 py-0.5">
                {freq}/{data.totalLength}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs opacity-75">
          Donde <span className="font-mono">L = {data.totalLength}</span> caracteres.
        </div>
      </section>

      {/* 2. Reducción Paso a Paso */}
      <section className="rounded-xl border border-[#52241A]/10 bg-white p-4 shadow-sm overflow-x-auto">
        <h4 className="mb-3 font-semibold text-[#52241A]">2. Procedimiento de Reducción</h4>
        <div className="flex gap-6 pb-2 min-w-max">
          {data.reductionSteps.map((step, idx) => (
            <div key={idx} className="flex flex-col gap-2 relative">
              <div className="text-xs font-semibold text-[#52241A]/50 mb-1 border-b border-[#52241A]/10 pb-1">
                Paso {idx + 1}
              </div>
              {/* List of remaining nodes */}
              {step.remainingNodes.map((n) => (
                <div key={n.id} className="font-mono text-sm flex items-center gap-2">
                  <span className="font-bold text-[#6B2E24] w-12 truncate">{n.label === " " ? "ESP" : n.label}</span>
                  <span className="text-[#52241A]/70">{n.freq}/{data.totalLength}</span>
                </div>
              ))}
              
              {/* Highlight what was combined to form the NEXT step */}
              {step.combined && (
                <div className="mt-2 border-t border-dashed border-[#52241A]/20 pt-2 text-xs">
                  <span className="font-mono text-[#a23b2a]">
                    {(step.combined.leftLabel === " " ? "ESP" : step.combined.leftLabel) || "N"} + {(step.combined.rightLabel === " " ? "ESP" : step.combined.rightLabel) || "N"}
                  </span>
                  <span className="block mt-1 font-mono font-semibold text-[#6B2E24]">
                    → {(step.combined.newLabel === " " ? "ESP" : step.combined.newLabel) || "N"} ({step.combined.newFreq}/{data.totalLength})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. Tabla de Códigos */}
      <section className="rounded-xl border border-[#52241A]/10 bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-semibold text-[#52241A]">3. Tabla de Códigos y Longitud Media</h4>
        
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#52241A]/10">
                <th className="py-2 px-3 font-semibold text-[#52241A]">K</th>
                <th className="py-2 px-3 font-semibold text-[#52241A]">Cod</th>
                <th className="py-2 px-3 font-semibold text-[#52241A]">L_i</th>
                <th className="py-2 px-3 font-semibold text-[#52241A]">P_i</th>
              </tr>
            </thead>
            <tbody>
              {data.codes.map(c => (
                <tr key={c.char} className="border-b border-[#52241A]/5 hover:bg-[#52241A]/5 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-[#6B2E24]">{c.char === " " ? "ESPACIO" : c.char}</td>
                  <td className="py-2 px-3 font-mono text-[#52241A]/80">{c.code}</td>
                  <td className="py-2 px-3 text-[#52241A]/80">{c.length}</td>
                  <td className="py-2 px-3 text-[#52241A]/80">{c.prob}/{data.totalLength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* L Media */}
        <div className="bg-[#E6B793]/10 p-3 rounded-lg border border-[#E6B793]/30">
          <div className="font-mono text-sm text-[#52241A] mb-1">
            <strong>L = ∑ P_i × L_i</strong>
          </div>
          <div className="font-mono text-sm text-[#6B2E24] mb-2 leading-relaxed">
            L = {data.codes.map(c => `(${c.prob}/${data.totalLength} × ${c.length})`).join(" + ")}
          </div>
          <div className="font-mono text-[15px] font-bold text-[#52241A] mt-2 border-t border-[#E6B793]/30 pt-2">
            L = {data.averageLength.toFixed(3)} bits/carácter
          </div>
        </div>
      </section>

      {/* 4. Cadena Final */}
      <section className="rounded-xl border border-[#52241A]/10 bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-semibold text-[#52241A]">4. Cadena Binaria Final</h4>
        <div className="font-mono text-sm break-all leading-loose bg-[#52241A]/5 p-3 rounded-lg border border-[#52241A]/10 text-[#6B2E24]">
          {data.encodedString.split('|').map((chunk, i) => (
            <span key={i} className="inline-block px-0.5">
              {chunk}
              {i < data.encodedString.split('|').length - 1 && (
                <span className="text-[#52241A]/30 font-light mx-0.5">|</span>
              )}
            </span>
          ))}
        </div>
      </section>

    </div>
  )
}
