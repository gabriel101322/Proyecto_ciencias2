import { Row } from "../types"
import { useEffect } from "react"
import React from "react"

type TableViewProps = {
  rows: Row[] | null
  active: {
    pos: number
    state: "compare" | "match" | "insert" | "collide" | "resolve"
    subIndex?: number
  } | null
  isHash: boolean
  isExternal?: boolean
  collision: string
  splitRange?: {
    left: number
    mid: number
    right: number
    activeHalf: "left" | "right"
  } | null
}

type DisplayItem = { type: "row"; data: Row } | { type: "ellipsis"; id: string }

export default function TableView({ rows, active, isHash, isExternal, collision, splitRange }: TableViewProps) {
  useEffect(() => {
    if (active?.pos) {
      const el = document.getElementById(`row-${active.pos}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
      }
    }
  }, [active?.pos])

  let renderGroups: { title?: string, items: DisplayItem[], index?: number }[] = []
  
  const isLinkedList = collision === "Lista Enlazada"
  let maxCols = 1
  if (rows && !isLinkedList) {
    rows.forEach((r) => {
      if (r.key) {
        const parts = r.key.split(/, | -> /)
        if (parts.length > maxCols) {
          maxCols = parts.length
        }
      }
      if (r.collidingKey) {
        const parts = r.key ? r.key.split(/, | -> /) : []
        if (parts.length + 1 > maxCols) {
          maxCols = parts.length + 1
        }
      }
    })
  }

  if (rows) {
    if (isExternal) {
      const n = rows.length
      const numBlocks = Math.ceil(Math.sqrt(n))
      const blockSize = Math.ceil(n / numBlocks) || 1

      for (let b = 0; b < numBlocks; b++) {
        let start = b * blockSize
        let end = Math.min((b + 1) * blockSize, n)
        
        let hasKey = false
        let isActive = false

        let blockItems: DisplayItem[] = []
        let lastVisibleIdx = -1

        let rawRows = rows.slice(start, end)
        rawRows.forEach((r, idx) => {
          if (r.key !== "") hasKey = true
          if (active?.pos === r.pos) isActive = true

          const isRowVisible = blockSize <= 4 || idx === 0 || idx === rawRows.length - 1 || r.key !== "" || active?.pos === r.pos

          if (isRowVisible) {
            if (lastVisibleIdx !== -1 && idx > lastVisibleIdx + 1) {
              blockItems.push({ type: "ellipsis", id: `ell_b${b}_r${r.pos}` })
            }
            blockItems.push({ type: "row", data: r })
            lastVisibleIdx = idx
          }
        })

        const isVisible = numBlocks <= 4 || b === 0 || b === numBlocks - 1 || hasKey || isActive

        if (isVisible) {
          renderGroups.push({ title: `Bloque ${b + 1}`, items: blockItems, index: b })
        }
      }
    } else {
      const n = rows.length
      const half = Math.ceil(n / 2)
      const leftCol = rows.slice(0, half)
      const rightCol = rows.slice(half)

      const globalVisibleIndices = new Set<number>()
      
      if (n > 0) {
        globalVisibleIndices.add(0)
        globalVisibleIndices.add(n - 1)
      }

      rows.forEach((r, absoluteIdx) => {
        if (r.key !== "" || r.pos === active?.pos) {
          globalVisibleIndices.add(absoluteIdx)
        }
      })

      const processColumn = (col: Row[], prefix: string, startAbsoluteIdx: number): DisplayItem[] => {
        if (n <= 20) return col.map((r) => ({ type: "row", data: r }))
        const result: DisplayItem[] = []
        let lastWasVisible = true
        col.forEach((r, localIdx) => {
          const absoluteIdx = startAbsoluteIdx + localIdx
          if (globalVisibleIndices.has(absoluteIdx)) {
            result.push({ type: "row", data: r })
            lastWasVisible = true
          } else {
            if (lastWasVisible) {
              result.push({ type: "ellipsis", id: `ell_${prefix}_${r.pos}` })
              lastWasVisible = false
            }
          }
        })
        return result
      }

      renderGroups.push({ items: processColumn(leftCol, "L", 0) })
      renderGroups.push({ items: processColumn(rightCol, "R", half) })
    }
  }

  const renderTable = (group: { title?: string, items: DisplayItem[] }, gi: string | number) => (
    <div key={gi} className={`flex flex-col ${isExternal ? 'w-64 shrink-0' : 'w-full'}`}>
      {group.title && (
        <div className="mb-2 mx-1 font-bold text-center text-[#52241A] tracking-[0.2em] text-[11px] uppercase bg-[#E6B793]/40 py-2 rounded-t-lg border-b-2 border-[#52241A]/10 shadow-sm">
          {group.title}
        </div>
      )}
      <table className={`w-full border-collapse text-sm ${isExternal ? 'border border-[#52241A]/15 rounded-lg overflow-hidden bg-white shadow-sm' : ''}`}>
        <thead className="sticky top-0 z-10 bg-[#52241A] text-white shadow-sm">
          <tr>
            <th className="w-16 border-b border-[#52241A] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
              Pos
            </th>
            {Array.from({ length: maxCols }).map((_, i) => (
              <th
                key={i}
                className="border-b border-[#52241A] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em]"
              >
                Clave {maxCols > 1 ? i + 1 : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.items.map((item) => {
            if (item.type === "ellipsis") {
              return (
                <tr key={item.id} className="bg-[#faf6f2]/40">
                  <td
                    colSpan={maxCols + 1}
                    className="border-b border-[#52241A]/10 px-4 py-1.5 text-center text-[#52241A]/30 font-bold tracking-[0.3em] leading-none select-none"
                  >
                    ...
                  </td>
                </tr>
              )
            }

            const row = item.data
            const act = active?.pos === row.pos ? active.state : null

            let rowClass = ""
            const inLeftSplit = splitRange && splitRange.activeHalf === "left" && row.pos >= splitRange.left && row.pos <= splitRange.mid
            const inRightSplit = splitRange && splitRange.activeHalf === "right" && row.pos > splitRange.mid && row.pos <= splitRange.right

            if (inLeftSplit || inRightSplit) {
              const isStart = inLeftSplit ? row.pos === splitRange.left : row.pos === splitRange.mid + 1
              const isEnd = inLeftSplit ? row.pos === splitRange.mid : row.pos === splitRange.right
              
              rowClass = `bg-yellow-200/50 text-yellow-900 font-semibold border-yellow-400 border-x-2 ${
                isStart ? "border-t-2" : ""
              } ${isEnd ? "border-b-2" : ""}`
            } else if (act === "match") {
              rowClass = "bg-[#2f7d4f] text-white font-semibold"
            } else if (act === "insert") {
              rowClass = "bg-[#E6B793] text-[#52241A] font-semibold"
            } else if (act === "compare") {
              rowClass = "bg-[#6B2E24] text-white font-semibold"
            } else if (act === "collide") {
              rowClass = "bg-[#a23b2a]/20 text-[#a23b2a] font-semibold border-2 border-[#a23b2a]"
            } else if (act === "resolve") {
              rowClass = "bg-[#E6B793] text-[#52241A] font-semibold transition-all duration-1000"
            } else if (row.inactive) {
              rowClass = "opacity-20 bg-[#2b1610]/15 grayscale blur-[0.5px] select-none pointer-events-none"
            } else {
              rowClass = "odd:bg-[#faf6f2]/60 hover:bg-[#E6B793]/20"
            }

            const parts = row.key ? row.key.split(/, | -> /) : []
            const isLinked = row.key && row.key.includes("->")

            return (
              <tr id={`row-${row.pos}`} key={`row_${row.pos}`} className={`transition-colors duration-500 ${rowClass}`}>
                <td className={`border-b border-[#52241A]/10 px-4 py-2 font-medium tabular-nums ${act ? "" : "text-[#52241A]"}`}>
                  {row.pos}
                </td>
                {isLinkedList ? (
                  <td className={`border-b border-[#52241A]/10 px-4 py-2 ${act ? "" : "text-[#2b1610]"}`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {row.key ? (
                        parts.map((k, idx, arr) => {
                          const isMain = idx === 0
                          return (
                            <div key={idx} className="flex items-center gap-1.5 shrink-0">
                              <span className={`inline-block min-w-[3.5rem] text-center rounded px-2 py-0.5 text-[13px] font-medium border transition-all ${
                                act === "match" && active?.subIndex === idx
                                  ? "motion-safe:animate-[pulse_1.5s_ease-in-out_infinite] scale-110 font-bold text-white bg-[#1b4b2f] shadow-lg ring-2 ring-white"
                                  : isMain ? "border-[#52241A]/20 bg-[#faf6f2]/80" : "border-[#E6B793] bg-[#E6B793]/20 text-[#52241A]"
                              }`}>
                                {k}
                              </span>
                              {idx < arr.length - 1 && <span className="text-[#52241A]/40 text-sm">→</span>}
                            </div>
                          )
                        })
                      ) : (
                        <span className={act ? "opacity-60" : "text-[#52241A]/25"}>—</span>
                      )}
                      {row.collidingKey && (
                        <div className="flex items-center gap-1.5 ml-1 shrink-0">
                          {row.key && <span className="text-[#52241A]/40 text-sm">→</span>}
                          <span className="inline-flex min-w-[3.5rem] justify-center items-center rounded bg-[#a23b2a] px-2 py-0.5 text-[13px] font-medium text-white shadow-sm motion-safe:animate-bounce">
                            {row.collidingKey}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                ) : (
                  Array.from({ length: maxCols }).map((_, colIdx) => {
                    const cellKey = parts[colIdx]
                    const isResolvingHere = row.collidingKey && colIdx === parts.length

                    return (
                      <td key={colIdx} className={`border-b border-[#52241A]/10 px-4 py-2 ${act ? "" : "text-[#2b1610]"}`}>
                        <div className="flex items-center gap-2">
                          {cellKey ? (
                            <span className={act === "match" && active?.subIndex === colIdx ? "inline-block motion-safe:animate-[pulse_1.5s_ease-in-out_infinite] scale-110 font-bold text-white bg-[#1b4b2f] px-2.5 py-1 rounded-md shadow-lg transition-all duration-300 ring-2 ring-white" : ""}>
                              {cellKey}
                            </span>
                          ) : isResolvingHere ? (
                            <span className="inline-flex items-center justify-center rounded bg-[#a23b2a] px-2 py-0.5 text-[12px] font-medium text-white shadow-sm motion-safe:animate-bounce">
                              {row.collidingKey}
                            </span>
                          ) : (
                            <span className={act ? "opacity-60" : "text-[#52241A]/25"}>—</span>
                          )}
                        </div>
                      </td>
                    )
                  })
                )}
              </tr>
            )
          })}
          {group.items.length === 0 && (
            <tr>
              <td colSpan={maxCols + 1} className="px-4 py-8 text-center text-[#52241A]/30">—</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  const pairedBlocks: { left: typeof renderGroups[0], right: typeof renderGroups[0] | null }[] = []
  if (isExternal && renderGroups.length > 0) {
    for (let i = 0; i < renderGroups.length; i += 2) {
      pairedBlocks.push({
        left: renderGroups[i],
        right: renderGroups[i + 1] || null
      })
    }
  }

  return (
    <div
      className={`min-h-0 flex-1 overflow-auto rounded-2xl border border-[#52241A]/15 bg-[#faf6f2] shadow-sm transition-all duration-300 ${
        isHash ? "max-w-[70%]" : "w-full"
      }`}
    >
      {rows ? (
        isExternal ? (
          <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
            {pairedBlocks.map((pair, idx) => {
              let gapBeforePair = false
              if (idx > 0) {
                const prevRight = pairedBlocks[idx - 1].right || pairedBlocks[idx - 1].left
                if (pair.left.index! > prevRight.index! + 1) {
                  gapBeforePair = true
                }
              }

              let gapInsidePair = false
              if (pair.right) {
                if (pair.right.index! > pair.left.index! + 1) {
                  gapInsidePair = true
                }
              }

              return (
                <React.Fragment key={idx}>
                  {gapBeforePair && (
                    <div className="flex justify-center py-2 opacity-60">
                      <span className="text-4xl font-bold tracking-[0.2em] text-[#52241A]/50">...</span>
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-start w-full">
                    <div className="flex justify-end w-full">
                      {renderTable(pair.left, `${idx}_L`)}
                    </div>
                    <div className="flex items-center justify-center w-8 md:w-16 h-full">
                      {gapInsidePair && (
                        <span className="text-4xl font-bold tracking-[0.2em] text-[#52241A]/50 opacity-60">...</span>
                      )}
                    </div>
                    <div className="flex justify-start w-full">
                      {pair.right ? renderTable(pair.right, `${idx}_R`) : <div />}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-[#52241A]/15 bg-white">
            {renderGroups.map((g, i) => renderTable(g, i))}
          </div>
        )
      ) : (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center bg-white">
          <p className="text-sm font-medium text-[#52241A]/50">
            Ingresa el tamaño del arreglo y presiona
            <span className="font-semibold text-[#52241A]"> Generar arreglo</span>.
          </p>
          <p className="text-xs text-[#52241A]/35">
            Se crearán las posiciones vacías listas para insertar claves.
          </p>
        </div>
      )}
    </div>
  )
}
