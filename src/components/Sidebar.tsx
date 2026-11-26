import { motion } from "framer-motion"
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
    <aside className="relative flex flex-col bg-gradient-to-b from-[#52241A] to-[#3a1810] text-white border-r border-[#52241A]/30 select-none">
      {/* collapse toggle — sits on the seam between header and sidebar */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expandir barra" : "Minimizar barra"}
        className="absolute -top-6 right-0 z-20 flex size-12 translate-x-1/2 items-center justify-center rounded-full bg-[#E6B793] text-[#52241A] shadow-[0_6px_20px_rgba(43,22,16,0.35)] ring-4 ring-[#faf6f2] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-[#ebd0b7]"
      >
        <svg
          viewBox="0 0 24 24"
          className={`size-5 transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 6 9 12l6 6" />
        </svg>
      </button>

      <nav className="mt-10 flex flex-col gap-2 px-2.5">
        {sections.map((section) => {
          const active = section.id === activeSection
          return (
            <div key={section.id} className="relative group">
              <button
                onClick={() => selectSection(section)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200 z-10 ${
                  active ? "text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#6B2E24] to-[#7d362a] shadow-inner border border-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <span
                  className={`relative grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                    active
                      ? "bg-[#E6B793] text-[#52241A] shadow-xs"
                      : "bg-white/10 text-[#E6B793] group-hover:bg-white/15"
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
                  <span className="relative flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-[12px] font-bold text-white">
                      {section.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                      {section.options.length} opciones
                    </span>
                  </span>
                )}
              </button>

              {/* Tooltip on collapsed hover */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex z-50 items-center">
                  <div className="rounded-lg bg-[#2b1610] text-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10">
                    {section.label}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="mt-auto px-4 pb-5 pt-4 border-t border-white/10">
          <p className="text-[10px] font-medium leading-relaxed text-white/40">
            Estructuras de datos y algoritmos de búsqueda interactivos.
          </p>
        </div>
      )}
    </aside>
  )
}

