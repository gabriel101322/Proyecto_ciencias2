import { Section, SectionId } from "../types"

type SidebarProps = {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  sections: Section[]
  activeSection: SectionId
  selectSection: (section: Section) => void
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  sections,
  activeSection,
  selectSection,
}: SidebarProps) {
  return (
    <aside className="relative flex flex-col bg-[#52241A] text-white transition-[width] duration-300">
      {/* collapse toggle — sits on the seam between header and sidebar */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expandir barra" : "Minimizar barra"}
        className="absolute -top-6 right-0 z-20 flex size-12 translate-x-1/2 items-center justify-center rounded-full bg-[#E6B793] text-[#52241A] shadow-lg ring-4 ring-[#faf6f2] transition-transform hover:scale-105 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className={`size-5 transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 6 9 12l6 6" />
        </svg>
      </button>

      <nav className="mt-10 flex flex-col gap-1.5 px-2">
        {sections.map((section) => {
          const active = section.id === activeSection
          return (
            <button
              key={section.id}
              onClick={() => selectSection(section)}
              title={collapsed ? section.label : undefined}
              className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                active ? "bg-[#6B2E24] shadow-inner" : "hover:bg-white/8"
              }`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                  active
                    ? "bg-[#E6B793] text-[#52241A]"
                    : "bg-white/10 text-[#E6B793]"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={section.icon} />
                </svg>
              </span>
              {!collapsed && (
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-[12px] font-semibold text-white">
                    {section.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">
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
  )
}
