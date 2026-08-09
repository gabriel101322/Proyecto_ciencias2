import { useState } from 'react'

type SectionId = 'internas' | 'externas' | 'grafos'

type Section = {
  id: SectionId
  label: string
  icon: string
  options: string[]
}

const SECTIONS: Section[] = [
  {
    id: 'internas',
    label: 'Búsquedas Internas',
    icon: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h7v4h-7v-4Z',
    options: ['Secuencial', 'Binaria'],
  },
  {
    id: 'externas',
    label: 'Búsquedas Externas',
    icon: 'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4',
    options: [
      'Función Mod',
      'Función Cuadrado',
      'Función Truncamiento',
      'Conversión de Bases',
    ],
  },
  {
    id: 'grafos',
    label: 'Grafos',
    icon: 'M6 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 7l8 0M7.5 8.5 11 13m6-4.5L13 13',
    options: ['Recorridos', 'Ruta más corta', 'Árbol de expansión'],
  },
]

type Row = { pos: number; key: string }

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('internas')
  const [activeOption, setActiveOption] = useState<string>('Secuencial')

  // ── Estado de la tabla ──────────────────────────────
  const [keySize, setKeySize] = useState(1)
  const [arraySizeInput, setArraySizeInput] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const current = SECTIONS.find((s) => s.id === activeSection)!
  const isGraphs = activeSection === 'grafos'

  const selectSection = (section: Section) => {
    setActiveSection(section.id)
    setActiveOption(section.options[0])
  }

  // Genera una tabla vacía con posiciones 1..N según el tamaño del arreglo.
  const generateTable = () => {
    const size = parseInt(arraySizeInput, 10)
    if (!Number.isFinite(size) || size <= 0) {
      setRows(null)
      return
    }
    const capped = Math.min(size, 500)
    setRows(Array.from({ length: capped }, (_, i) => ({ pos: i + 1, key: '' })))
  }

  // Reparte las filas en dos columnas (mitad izquierda / mitad derecha).
  const half = rows ? Math.ceil(rows.length / 2) : 0
  const leftRows = rows ? rows.slice(0, half) : []
  const rightRows = rows ? rows.slice(half) : []

  return (
    <div className="grid h-screen w-full grid-rows-[auto_1fr] bg-[#faf6f2] text-[#2b1610]">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="relative z-10 flex flex-col justify-between bg-[#52241A] px-8 pt-6 pb-0 text-white shadow-[0_10px_30px_-18px_rgba(82,36,26,0.9)]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#E6B793]">
            {current.label}
          </span>
          <span className="ml-auto text-[20px] font-semibold tracking-[0.02em] text-white/95">
            CIENCIAS DE LA COMPUTACIÓN 2
          </span>
        </div>

        {/* dynamic option tabs */}
        <nav
          className="mt-5 flex items-end justify-center gap-1 transition-[padding] duration-300"
          style={{ paddingLeft: collapsed ? 76 : 232 }}
        >
          {current.options.map((option) => {
            const selected = option === activeOption
            return (
              <button
                key={option}
                onClick={() => setActiveOption(option)}
                className={`relative min-w-0 truncate rounded-t-lg px-4 py-2.5 text-[clamp(11px,1.1vw,13px)] font-medium transition-colors ${
                  selected
                    ? 'bg-[#faf6f2] text-[#52241A]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {option}
                {selected && (
                  <span className="absolute inset-x-3 -top-px h-[3px] rounded-full bg-[#E6B793]" />
                )}
              </button>
            )
          })}
        </nav>
      </header>

      {/* ── Body: sidebar + content ─────────────────────────── */}
      <div className="grid min-h-0" style={{ gridTemplateColumns: `${collapsed ? 76 : 232}px 1fr` }}>
        {/* Left sidebar */}
        <aside className="relative flex flex-col bg-[#52241A] text-white transition-[width] duration-300">
          {/* collapse toggle — sits on the seam between header and sidebar */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir barra' : 'Minimizar barra'}
            className="absolute -top-6 right-0 z-20 flex size-12 translate-x-1/2 items-center justify-center rounded-full bg-[#E6B793] text-[#52241A] shadow-lg ring-4 ring-[#faf6f2] transition-transform hover:scale-105 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              className={`size-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6 9 12l6 6" />
            </svg>
          </button>

          <nav className="mt-10 flex flex-col gap-1.5 px-3">
            {SECTIONS.map((section) => {
              const active = section.id === activeSection
              return (
                <button
                  key={section.id}
                  onClick={() => selectSection(section)}
                  title={collapsed ? section.label : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    active
                      ? 'bg-[#6B2E24] shadow-inner'
                      : 'hover:bg-white/8'
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${
                      active ? 'bg-[#E6B793] text-[#52241A]' : 'bg-white/10 text-[#E6B793]'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={section.icon} />
                    </svg>
                  </span>
                  {!collapsed && (
                    <span className="flex flex-col leading-tight">
                      <span className="text-[13px] font-semibold text-white">{section.label}</span>
                      <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/45">
                        {section.options.length} opciones
                      </span>
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {!collapsed && (
            <p className="mt-auto px-5 pb-5 text-[10.5px] leading-relaxed text-white/35">
              Estructuras de datos y algoritmos de búsqueda.
            </p>
          )}
        </aside>

        {/* Central content */}
        <main className="min-w-0 overflow-auto bg-[#faf6f2] p-8">
          {isGraphs ? (
            <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center rounded-2xl border border-dashed border-[#52241A]/15 text-center">
              <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-[#52241A]/40">
                {current.label}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#52241A]">{activeOption}</h2>
              <p className="mt-3 max-w-md text-sm text-[#52241A]/55">
                El contenido de esta sección se mostrará aquí.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex h-full max-w-6xl flex-col gap-5">
              {/* ── Barra de controles superior ─────────────── */}
              <div className="flex items-end gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52241A]/60">
                    Tamaño de la clave
                  </span>
                  <select
                    value={keySize}
                    onChange={(e) => setKeySize(Number(e.target.value))}
                    className="h-10 w-20 rounded-lg border border-[#52241A]/20 bg-white px-3 text-sm text-[#2b1610] shadow-sm outline-none transition focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52241A]/60">
                    Tamaño del arreglo
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={arraySizeInput}
                    onChange={(e) => setArraySizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateTable()}
                    placeholder="Ej. 20"
                    className="h-10 w-28 rounded-lg border border-[#52241A]/20 bg-white px-3 text-sm text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
                  />
                </label>

                <button
                  onClick={generateTable}
                  className="h-10 shrink-0 rounded-lg bg-[#52241A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6B2E24] active:scale-[0.98]"
                >
                  Generar tabla
                </button>

                <div className="ml-auto flex items-end gap-2">
                  <button className="flex h-10 items-center gap-2 rounded-lg border border-[#52241A]/20 bg-white px-3 text-sm font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                      <path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                    Guardar
                  </button>
                  <button className="flex h-10 items-center gap-2 rounded-lg border border-[#52241A]/20 bg-white px-3 text-sm font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" />
                    </svg>
                    Imprimir
                  </button>
                </div>
              </div>

              {/* ── Tabla ───────────────────────────────────── */}
              <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#52241A]/15 bg-white shadow-sm">
                {rows ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-[#52241A]/15">
                    {[leftRows, rightRows].map((group, gi) => (
                      <table key={gi} className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 bg-[#52241A] text-white">
                          <tr>
                            <th className="w-28 border-b border-[#52241A] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                              Posición
                            </th>
                            <th className="border-b border-[#52241A] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                              Clave
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((row) => (
                            <tr key={row.pos} className="odd:bg-[#faf6f2]/60 hover:bg-[#E6B793]/20">
                              <td className="border-b border-[#52241A]/10 px-4 py-2 font-medium tabular-nums text-[#52241A]">
                                {row.pos}
                              </td>
                              <td className="border-b border-[#52241A]/10 px-4 py-2 text-[#2b1610]">
                                {row.key || <span className="text-[#52241A]/25">—</span>}
                              </td>
                            </tr>
                          ))}
                          {group.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-[#52241A]/30">—</td>
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
                      <span className="font-semibold text-[#52241A]"> Generar tabla</span>.
                    </p>
                    <p className="text-xs text-[#52241A]/35">
                      Se crearán las posiciones vacías listas para insertar claves.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Controles inferiores ────────────────────── */}
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-base font-semibold text-[#52241A]">Clave:</span>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Espacio de texto"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[#52241A]/20 bg-white px-3 text-sm text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
                />
                <button className="h-10 shrink-0 rounded-lg bg-[#6B2E24] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#52241A] active:scale-[0.98]">
                  Insertar clave
                </button>

                {/* Buscar clave */}
                <div className="relative min-w-0 flex-1">
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52241A]/40" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar clave"
                    className="h-10 w-full rounded-lg border border-[#52241A]/20 bg-white pl-9 pr-3 text-sm text-[#2b1610] shadow-sm outline-none transition placeholder:text-[#52241A]/30 focus:border-[#6B2E24] focus:ring-2 focus:ring-[#E6B793]"
                  />
                </div>
                <button className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-4 text-sm font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                  Buscar
                </button>

                <button className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-4 text-sm font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                  Ordenar
                </button>
                {activeSection === 'externas' && (
                  <button className="h-10 shrink-0 rounded-lg border border-[#52241A]/20 bg-white px-4 text-sm font-medium text-[#52241A] shadow-sm transition hover:bg-[#52241A]/5">
                    Solución de colisiones
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
