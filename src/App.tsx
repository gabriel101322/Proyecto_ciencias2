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

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('internas')
  const [activeOption, setActiveOption] = useState<string>('Secuencial')

  const current = SECTIONS.find((s) => s.id === activeSection)!

  const selectSection = (section: Section) => {
    setActiveSection(section.id)
    setActiveOption(section.options[0])
  }

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

        {/* Central content — placeholder for now */}
        <main className="min-w-0 overflow-auto bg-[#faf6f2] p-10">
          <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center rounded-2xl border border-dashed border-[#52241A]/15 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-[#52241A]/40">
              {current.label}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#52241A]">{activeOption}</h2>
            <p className="mt-3 max-w-md text-sm text-[#52241A]/55">
              El contenido de esta sección se mostrará aquí.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
