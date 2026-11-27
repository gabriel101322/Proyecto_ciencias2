import { AdjacencyListEntry, MatrixCell, MatrixDisplayData } from "../../types/graphTypes"

interface MatrixTableViewProps {
  matrix: MatrixDisplayData
  onHoverRowVertexLabel?: (label: string | null) => void
}

function getCellClass(hl?: MatrixCell["highlight"]): string {
  switch (hl) {
    case "pivot":
      return "bg-[#E6B793]/35 text-[#52241A] font-bold"
    case "updated":
    case "positive":
      return "bg-[#2f7d4f]/15 text-[#1f5c39] font-bold"
    case "negative":
      return "bg-[#a23b2a]/14 text-[#a23b2a] font-bold"
    case "active":
      return "bg-amber-100 text-amber-900 font-bold"
    case "infinity":
    case "zero":
      return "text-[#52241A]/40 font-normal"
    default:
      return "text-[#2b1610] font-medium"
  }
}

export function MatrixTableView({ matrix, onHoverRowVertexLabel }: MatrixTableViewProps) {
  const captionId = `caption-${matrix.id}`
  return (
    <div className="rounded-xl border border-[#52241A]/15 bg-white p-3 shadow-sm">
      <div id={captionId} className="mb-2">
        <h5 className="text-[12.5px] font-bold text-[#52241A]">{matrix.title}</h5>
        {matrix.subtitle && (
          <p className="mt-0.5 text-[11px] leading-snug text-[#52241A]/65">
            {matrix.subtitle}
          </p>
        )}
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className="graph-table-wrapper max-h-[260px] rounded-lg border border-[#52241A]/15"
      >
        <table className="w-full text-center text-xs">
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-r border-[#52241A]/15 bg-[#52241A] px-2.5 py-1.5 text-[11px] font-semibold text-[#E6B793]"
              >
                •
              </th>
              {matrix.colHeaders.map((col, cIdx) => (
                <th
                  key={`${col}-${cIdx}`}
                  scope="col"
                  className="whitespace-nowrap border-b border-r border-[#52241A]/15 bg-[#52241A] px-2.5 py-1.5 text-[11px] font-semibold text-white last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.cells.map((row, rIdx) => {
              const rHeader = matrix.rowHeaders[rIdx] ?? String(rIdx + 1)
              return (
                <tr
                  key={`${rHeader}-${rIdx}`}
                  onMouseEnter={() => onHoverRowVertexLabel?.(rHeader)}
                  onMouseLeave={() => onHoverRowVertexLabel?.(null)}
                  className="hover:bg-[#faf6f2]/80"
                >
                  <th
                    scope="row"
                    className="whitespace-nowrap border-b border-r border-[#52241A]/15 bg-[#faf6f2] px-2.5 py-1.5 text-left font-bold text-[#52241A]"
                  >
                    {rHeader}
                  </th>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      title={cell.tooltip}
                      className={`whitespace-nowrap border-b border-r border-[#52241A]/10 px-2.5 py-1.5 font-mono transition-colors last:border-r-0 ${getCellClass(
                        cell.highlight
                      )}`}
                    >
                      {cell.value}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface LinkedListViewProps {
  title: string
  subtitle: string
  entries: AdjacencyListEntry[]
  onHoverVertex?: (vertexId: string | null) => void
  onHoverEdge?: (edgeId: string | null) => void
}

export function LinkedListView({
  title,
  subtitle,
  entries,
  onHoverVertex,
  onHoverEdge,
}: LinkedListViewProps) {
  return (
    <div className="rounded-xl border border-[#52241A]/15 bg-white p-3 shadow-sm">
      <h5 className="text-[12.5px] font-bold text-[#52241A]">{title}</h5>
      <p className="mb-2.5 mt-0.5 text-[11px] text-[#52241A]/65">{subtitle}</p>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.vertexId}
            onMouseEnter={() => onHoverVertex?.(entry.vertexId)}
            onMouseLeave={() => onHoverVertex?.(null)}
            className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#52241A]/10 bg-[#faf6f2]/55 px-2.5 py-1.5 text-xs"
          >
            <div className="flex items-center gap-1.5 rounded-md bg-[#52241A] px-2.5 py-1 font-mono font-bold text-white shadow-xs">
              <span>{entry.vertexLabel}</span>
              {entry.degreeInfo && (
                <span className="rounded bg-white/15 px-1 text-[10px] font-normal text-[#E6B793]">
                  {entry.degreeInfo}
                </span>
              )}
            </div>

            <span className="font-bold text-[#52241A]/45">→</span>

            {entry.neighbors.length === 0 ? (
              <span className="rounded border border-dashed border-[#52241A]/25 px-2 py-0.5 font-mono text-[11px] text-[#52241A]/45">
                NULL
              </span>
            ) : (
              <>
                {entry.neighbors.map((nb, idx) => (
                  <div
                    key={`${nb.edgeId}-${idx}`}
                    onMouseEnter={(e) => {
                      e.stopPropagation()
                      onHoverEdge?.(nb.edgeId)
                    }}
                    onMouseLeave={() => onHoverEdge?.(null)}
                    className="flex items-center gap-1.5"
                  >
                    <div className="flex items-center overflow-hidden rounded-md border border-[#6B2E24]/30 bg-white shadow-2xs transition hover:border-[#d97706] hover:bg-amber-50">
                      <span className="px-2 py-0.5 font-mono font-bold text-[#52241A]">
                        {nb.targetLabel}
                      </span>
                      {nb.weight !== undefined && (
                        <span className="border-l border-[#6B2E24]/20 bg-[#E6B793]/25 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-[#6B2E24]">
                          w={nb.weight}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[#52241A]/40">→</span>
                  </div>
                ))}
                <span className="rounded border border-dashed border-[#52241A]/20 px-1.5 py-0.5 font-mono text-[10.5px] text-[#52241A]/45">
                  NULL
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
