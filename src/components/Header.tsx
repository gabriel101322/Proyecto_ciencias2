import { Section, SectionId } from "../types"

type HeaderProps = {
  current: Section
  activeOption: string
  collapsed: boolean
  onAlgorithmChange: (newOption: string, newSectionId?: SectionId) => void
  onSaveClick: () => void
  onLoadClick: () => void
}

export default function Header({
  current,
  activeOption,
  collapsed,
  onAlgorithmChange,
  onSaveClick,
  onLoadClick,
}: HeaderProps) {
  return (
    <header className="relative z-10 flex flex-col justify-between bg-[#52241A] px-8 pt-6 pb-0 text-white shadow-[0_10px_30px_-18px_rgba(82,36,26,0.9)]">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#E6B793]">
          {current.label}
        </span>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={onSaveClick}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 active:bg-white/30"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Guardar
            </button>
            <button
              onClick={onLoadClick}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 active:bg-white/30"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Cargar
            </button>
          </div>
          <span className="text-[20px] font-semibold tracking-[0.02em] text-white/95">
            CIENCIAS DE LA COMPUTACIÓN 2
          </span>
        </div>
      </div>

      {/* dynamic option tabs */}
      <nav
        className="mt-5 flex items-end justify-center gap-1 transition-[padding] duration-300"
        style={{ paddingLeft: collapsed ? 64 : 196 }}
      >
        {current.options.map((option) => {
          const selected = option === activeOption
          return (
            <button
              key={option}
              onClick={() => onAlgorithmChange(option)}
              className={`relative min-w-0 truncate rounded-t-lg px-4 py-2.5 text-[clamp(11px,1.1vw,13px)] font-medium transition-colors ${
                selected
                  ? "bg-[#faf6f2] text-[#52241A]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
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
  )
}
