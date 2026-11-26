import { motion } from "framer-motion"
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
    <header className="relative z-10 flex flex-col justify-between bg-gradient-to-r from-[#441c14] via-[#52241A] to-[#441c14] px-8 pt-5 pb-0 text-white shadow-[0_12px_32px_-16px_rgba(43,22,16,0.8)] border-b border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2 rounded-full bg-[#E6B793] shadow-[0_0_8px_rgba(230,183,147,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#E6B793]">
            {current.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-white/90 border border-white/15 backdrop-blur-sm">
            CIENCIAS DE LA COMPUTACIÓN 2
          </span>
        </div>
      </div>

      {/* dynamic option tabs with smooth framer-motion indicator */}
      <nav
        className="mt-4 flex items-end justify-center gap-1.5 overflow-x-auto transition-[padding] duration-300"
        style={{ paddingLeft: collapsed ? 48 : 160 }}
      >
        {current.options.map((option) => {
          const selected = option === activeOption
          return (
            <button
              key={option}
              onClick={() => onAlgorithmChange(option)}
              className={`relative min-w-0 shrink-0 truncate rounded-t-xl px-4 py-2.5 text-[clamp(11px,1.05vw,13px)] font-semibold transition-all duration-200 select-none ${
                selected
                  ? "bg-[#faf6f2] text-[#52241A] shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {option}

              {selected && (
                <motion.span
                  layoutId="activeHeaderTabIndicator"
                  className="absolute inset-x-3 -top-px h-[3px] rounded-full bg-[#E6B793] shadow-[0_0_6px_rgba(230,183,147,0.9)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </nav>
    </header>
  )
}

