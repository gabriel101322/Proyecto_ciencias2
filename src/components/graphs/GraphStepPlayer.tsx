import { GraphAlgorithmStep } from "../../types/graphTypes"
import { MatrixTableView } from "./GraphMatrixAndLists"

interface GraphStepPlayerProps {
  steps: GraphAlgorithmStep[]
  currentStepIndex: number
  isPlaying: boolean
  speedMs: number
  onStepChange: (idx: number) => void
  onTogglePlay: () => void
  onSpeedChange: (ms: number) => void
  onHoverVertexLabel?: (label: string | null) => void
  emptyHint?: string
}

export default function GraphStepPlayer({
  steps,
  currentStepIndex,
  isPlaying,
  speedMs,
  onStepChange,
  onTogglePlay,
  onSpeedChange,
  onHoverVertexLabel,
  emptyHint = "Ejecuta el algoritmo para explorar la explicación paso a paso.",
}: GraphStepPlayerProps) {
  const total = steps.length
  const safeIdx = Math.min(Math.max(0, currentStepIndex), Math.max(0, total - 1))
  const step = total > 0 ? steps[safeIdx] : null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#52241A]/15 bg-white shadow-sm">
      {/* Encabezado y Controles de Reproducción */}
      <div className="border-b border-[#52241A]/15 bg-[#52241A] px-4 py-2.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E6B793]">
            Explicación Paso a Paso
          </span>
          {total > 0 && (
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Paso {safeIdx + 1} de {total}
            </span>
          )}
        </div>

        {total > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStepChange(0)}
              disabled={safeIdx === 0}
              title="Ir al primer paso"
              className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20 disabled:opacity-35"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={() => onStepChange(Math.max(0, safeIdx - 1))}
              disabled={safeIdx === 0}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20 disabled:opacity-35"
            >
              ◀ Ant.
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className="rounded-lg bg-[#E6B793] px-3 py-1 text-xs font-bold text-[#52241A] shadow-xs transition hover:bg-[#f0caa9]"
            >
              {isPlaying ? "⏸ Pausar" : "▶ Auto"}
            </button>
            <button
              type="button"
              onClick={() => onStepChange(Math.min(total - 1, safeIdx + 1))}
              disabled={safeIdx >= total - 1}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20 disabled:opacity-35"
            >
              Sig. ▶
            </button>
            <button
              type="button"
              onClick={() => onStepChange(total - 1)}
              disabled={safeIdx >= total - 1}
              title="Ir al resultado final"
              className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20 disabled:opacity-35"
            >
              ⏭
            </button>

            <select
              aria-label="Velocidad de reproducción"
              value={speedMs}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="ml-auto rounded-lg border border-white/20 bg-[#6B2E24] px-2 py-1 text-[11px] font-medium text-white outline-none"
            >
              <option value={2000}>Lento</option>
              <option value={1200}>Normal</option>
              <option value={650}>Rápido</option>
            </select>
          </div>
        )}

        {total > 1 && (
          <input
            type="range"
            aria-label="Línea de tiempo de pasos"
            min={0}
            max={total - 1}
            value={safeIdx}
            onChange={(e) => onStepChange(Number(e.target.value))}
            className="mt-2 h-1.5 w-full cursor-pointer accent-[#E6B793]"
          />
        )}
      </div>

      {/* Contenido Pedagógico del Paso Actual */}
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-[#faf6f2]/35 p-4">
        {!step ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-medium text-[#52241A]/55">{emptyHint}</p>
          </div>
        ) : (
          <>
            {/* Tarjeta Principal de Explicación */}
            <div className="rounded-xl border border-[#E6B793]/60 bg-white p-3.5 shadow-2xs">
              <h4 className="text-[13.5px] font-bold text-[#52241A]">{step.title}</h4>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#2b1610]/85">
                {step.description}
              </p>
              {step.formula && (
                <div className="mt-2.5 overflow-x-auto rounded-lg border border-[#52241A]/12 bg-[#faf6f2] px-3 py-2 font-mono text-[11.5px] font-semibold text-[#6B2E24]">
                  {step.formula}
                </div>
              )}
            </div>

            {/* Tarjetas de Resumen Rápido */}
            {step.summaryCards && step.summaryCards.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {step.summaryCards.map((card, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border px-3 py-2 ${
                      card.accent === "ok"
                        ? "border-[#2f7d4f]/30 bg-[#2f7d4f]/10 text-[#1f5c39]"
                        : card.accent === "warn"
                        ? "border-[#a23b2a]/30 bg-[#a23b2a]/10 text-[#a23b2a]"
                        : "border-[#52241A]/15 bg-white text-[#52241A]"
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                      {card.label}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs font-bold" title={card.value}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grupos de Particiones / Componentes / Niveles */}
            {step.badgeGroups && step.badgeGroups.length > 0 && (
              <div className="rounded-xl border border-[#52241A]/12 bg-white p-3 shadow-2xs">
                <div className="flex flex-wrap gap-2">
                  {step.badgeGroups.map((bg, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[#52241A]/12 bg-[#faf6f2] px-2.5 py-1.5"
                    >
                      <div className="text-[10.5px] font-bold text-[#6B2E24]">{bg.title}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {bg.items.length === 0 ? (
                          <span className="text-[11px] text-[#52241A]/45">∅</span>
                        ) : (
                          bg.items.map((item, j) => (
                            <span
                              key={j}
                              className="rounded bg-[#52241A] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-white"
                            >
                              {item}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles aritméticos / Evaluaciones paso a paso */}
            {step.detailList && step.detailList.length > 0 && (
              <div className="rounded-xl border border-[#52241A]/12 bg-white p-3 shadow-2xs">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#52241A]/65">
                  Detalle de Evaluaciones
                </div>
                <ul className="space-y-1 text-xs text-[#2b1610]/85">
                  {step.detailList.map((line, i) => (
                    <li
                      key={i}
                      className="rounded-md bg-[#faf6f2]/70 px-2.5 py-1 font-mono text-[11px] leading-snug"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Matrices asociadas al paso */}
            {step.matrices &&
              step.matrices.map((mat) => (
                <MatrixTableView
                  key={mat.id}
                  matrix={mat}
                  onHoverRowVertexLabel={onHoverVertexLabel}
                />
              ))}
          </>
        )}
      </div>
    </div>
  )
}
