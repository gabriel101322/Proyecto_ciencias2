import { Section, SectionId } from "../types"

type HeaderProps = {
  current: Section
  activeOption: string
  collapsed: boolean
  onAlgorithmChange: (newOption: string, newSectionId?: SectionId) => void
}

export default function Header({
  current,
  activeOption,
  collapsed,
  onAlgorithmChange,
}: HeaderProps) {
  return (
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
