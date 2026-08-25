import { Row } from "../types"
import { useEffect } from "react"

type TableViewProps = {
  rows: Row[] | null
  active: {
    pos: number
    state: "compare" | "match" | "insert" | "collide" | "resolve"
    subIndex?: number
  } | null
  isHash: boolean
  collision: string
  isBlockMode?: boolean
  blockSize?: number
}

type DisplayItem = { type: "row"; data: Row } | { type: "ellipsis"; id: string }

export default function TableView({ rows, active, isHash, collision, isBlockMode, blockSize }: TableViewProps) {
  useEffect(() => {
    if (active?.pos) {
      const el = document.getElementById(`row-${active.pos}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [active?.pos])

  let leftRows: DisplayItem[] = []
  let rightRows: DisplayItem[] = []

  if (rows) {
    const half = Math.ceil(rows.length / 2)
    const leftCol = rows.slice(0, half)
    const rightCol = rows.slice(half)

    const globalVisibleIndices = new Set<number>()

    if (rows.length > 40) {
      // 1. Mostrar siempre los primeros 3 y últimos 3 de la columna
      for (let i = 0; i < 3 && i < half; i++) globalVisibleIndices.add(i)
      for (let i = half - 1; i >= half - 3 && i >= 0; i--) globalVisibleIndices.add(i)

      // 1.5. Mostrar el centro de la columna
      if (half > 0) {
        const midIdx = Math.floor(half / 2)
        for (let offset = -1; offset <= 1; offset++) {
          const targetIdx = midIdx + offset
          if (targetIdx >= 0 && targetIdx < half) {
            globalVisibleIndices.add(targetIdx)
          }
        }
      }

      // 2. Mostrar únicamente la fila activa o llena (reflejado en ambas columnas para simetría)
      rows.forEach((r, absoluteIdx) => {
        if (r.key !== "" || r.pos === active?.pos) {
          const localIdx = absoluteIdx % half
          globalVisibleIndices.add(localIdx)
        }
      })
    }

    const processColumn = (col: Row[], prefix: string): DisplayItem[] => {
      // Si el arreglo completo es pequeño, no colapsamos (mostrar normal)
      if (rows.length <= 40) {
        return col.map((r) => ({ type: "row", data: r }))
      }

      const result: DisplayItem[] = []
      let lastWasVisible = true

      col.forEach((r, localIdx) => {
        if (globalVisibleIndices.has(localIdx)) {
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

    leftRows = processColumn(leftCol, "L")
    rightRows = processColumn(rightCol, "R")
  }

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

  return (
    <div
      className={`min-h-0 flex-1 overflow-auto rounded-2xl border border-[#52241A]/15 bg-white shadow-sm transition-all duration-300 ${
        isHash ? "max-w-[70%]" : "w-full"
      }`}
    >
      {rows ? (
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-[#52241A]/15">
          {[leftRows, rightRows].map((group, gi) => (
            <table key={gi} className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#52241A] text-white shadow-sm">
                <tr>
                  <th className="w-24 border-b border-[#52241A] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                    Posición
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
                {group.map((item) => {
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
                  if (act === "match") {
                    rowClass = "bg-[#2f7d4f] text-white font-semibold"
                  } else if (act === "insert") {
                    rowClass = "bg-[#E6B793] text-[#52241A] font-semibold"
                  } else if (act === "compare") {
                    rowClass = "bg-[#6B2E24] text-white font-semibold"
                  } else if (act === "collide") {
                    rowClass =
                      "bg-[#a23b2a]/20 text-[#a23b2a] font-semibold border-2 border-[#a23b2a]"
                  } else if (act === "resolve") {
                    rowClass =
                      "bg-[#E6B793] text-[#52241A] font-semibold transition-all duration-1000"
                  } else if (row.inactive) {
                    rowClass =
                      "opacity-20 bg-[#2b1610]/15 grayscale blur-[0.5px] select-none pointer-events-none"
                  } else {
                    if (isBlockMode && blockSize && blockSize > 0) {
                      const blockIndex = Math.floor((row.pos - 1) / blockSize)
                      rowClass = blockIndex % 2 === 0 ? "bg-[#faf6f2]/80 hover:bg-[#E6B793]/20" : "bg-white hover:bg-[#E6B793]/20"
                    } else {
                      rowClass = "odd:bg-[#faf6f2]/60 hover:bg-[#E6B793]/20"
                    }
                  }

                  const parts = row.key ? row.key.split(/, | -> /) : []
                  const isLinked = row.key && row.key.includes("->")
                  
                  const isBlockEnd = isBlockMode && blockSize && blockSize > 0 && row.pos % blockSize === 0
                  const tdClassBase = isBlockEnd ? "border-b-[3px] border-[#52241A]/40" : "border-b border-[#52241A]/10"

                  return (
                    <tr
                      id={`row-${row.pos}`}
                      key={`row_${row.pos}`}
                      className={`transition-all duration-500 ${rowClass} ${isBlockEnd ? "shadow-[0_2px_4px_-1px_rgba(82,36,26,0.1)] relative z-10" : ""}`}
                    >
                      <td
                        className={`${tdClassBase} px-4 py-2 font-medium tabular-nums ${
                          act ? "" : "text-[#52241A]"
                        }`}
                      >
                        {row.pos}
                      </td>
                      {isLinkedList ? (
                        <td
                          className={`${tdClassBase} px-4 py-2 ${
                            act ? "" : "text-[#2b1610]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.key ? (
                              parts.map((k, idx, arr) => {
                                const isMain = idx === 0
                                return (
                                  <div key={idx} className="flex items-center gap-1.5 shrink-0">
                                    <span
                                      className={`inline-block min-w-[3.5rem] text-center rounded px-2 py-0.5 text-[13px] font-medium border transition-all ${
                                        act === "match" && active?.subIndex === idx
                                          ? "motion-safe:animate-[pulse_1.5s_ease-in-out_infinite] scale-110 font-bold text-white bg-[#1b4b2f] shadow-lg ring-2 ring-white"
                                          : isMain
                                          ? "border-[#52241A]/20 bg-[#faf6f2]/80"
                                          : "border-[#E6B793] bg-[#E6B793]/20 text-[#52241A]"
                                      }`}
                                    >
                                      {k}
                                    </span>
                                    {idx < arr.length - 1 && (
                                      <span className="text-[#52241A]/40 text-sm">
                                        →
                                      </span>
                                    )}
                                  </div>
                                )
                              })
                            ) : (
                              <span
                                className={
                                  act ? "opacity-60" : "text-[#52241A]/25"
                                }
                              >
                                —
                              </span>
                            )}
                            {row.collidingKey && (
                              <div className="flex items-center gap-1.5 ml-1 shrink-0">
                                {row.key && (
                                  <span className="text-[#52241A]/40 text-sm">
                                    →
                                  </span>
                                )}
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
                          const isResolvingHere =
                            row.collidingKey && colIdx === parts.length

                          return (
                            <td
                              key={colIdx}
                              className={`${tdClassBase} px-4 py-2 ${
                                act ? "" : "text-[#2b1610]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {cellKey ? (
                                  <span
                                    className={
                                      act === "match" && active?.subIndex === colIdx
                                        ? "inline-block motion-safe:animate-[pulse_1.5s_ease-in-out_infinite] scale-110 font-bold text-white bg-[#1b4b2f] px-2.5 py-1 rounded-md shadow-lg transition-all duration-300 ring-2 ring-white"
                                        : ""
                                    }
                                  >
                                    {cellKey}
                                  </span>
                                ) : isResolvingHere ? (
                                  <span className="inline-flex items-center justify-center rounded bg-[#a23b2a] px-2 py-0.5 text-[12px] font-medium text-white shadow-sm motion-safe:animate-bounce">
                                    {row.collidingKey}
                                  </span>
                                ) : (
                                  <span
                                    className={
                                      act ? "opacity-60" : "text-[#52241A]/25"
                                    }
                                  >
                                    —
                                  </span>
                                )}
                              </div>
                            </td>
                          )
                        })
                      )}
                    </tr>
                  )
                })}
                {group.length === 0 && (
                  <tr>
                    <td
                      colSpan={maxCols + 1}
                      className="px-4 py-8 text-center text-[#52241A]/30"
                    >
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ))}
        </div>
      ) : (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-[#52241A]/50">
            Ingresa el tamaño del arreglo y presiona
            <span className="font-semibold text-[#52241A]">
              {" "}
              Generar arreglo
            </span>
            .
          </p>
          <p className="text-xs text-[#52241A]/35">
            Se crearán las posiciones vacías listas para insertar claves.
          </p>
        </div>
      )}
    </div>
  )
}
