import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Section, SectionId } from "../types"

type HeaderProps = {
  current: Section
  activeOption: string
  collapsed: boolean
  onAlgorithmChange: (newOption: string, newSectionId?: SectionId) => void
  onSaveClick?: () => void
  onLoadClick?: () => void
}

export default function Header({
  current,
  activeOption,
  collapsed,
  onAlgorithmChange,
  onSaveClick,
  onLoadClick,
}: HeaderProps) {
  const navRef = useRef<HTMLElement>(null)

  // Scroll selected tab smoothly into view inside the horizontal scroller
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const selectedBtn = nav.querySelector<HTMLButtonElement>('[aria-selected="true"]')
    if (selectedBtn) {
      selectedBtn.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        container: "nearest",
      } as ScrollIntoViewOptions)
    }
  }, [activeOption, current.id])

  // Fallback edge-fade observer for browsers without scroll-driven animations
  useEffect(() => {
    const scroller = navRef.current
    if (!scroller || (typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()"))) {
      return
    }
    const first = scroller.firstElementChild
    const last = scroller.lastElementChild
    if (!first || !last) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, intersectionRatio } of entries) {
          scroller.classList.toggle(
            target === first ? "more-start" : "more-end",
            intersectionRatio < 1
          )
        }
      },
      { root: scroller, threshold: 1, rootMargin: "1px" }
    )

    observer.observe(first)
    observer.observe(last)
    return () => observer.disconnect()
  }, [current.options])

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
          {onSaveClick && onLoadClick && (
            <div className="mr-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveClick}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 active:bg-white/30"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Guardar
              </button>
              <button
                type="button"
                onClick={onLoadClick}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 active:bg-white/30"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Cargar
              </button>
            </div>
          )}
          <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-white/90 border border-white/15 backdrop-blur-sm">
            CIENCIAS DE LA COMPUTACIÓN 2
          </span>
        </div>
      </div>

      {/* dynamic option tabs */}
      <div
        ref={navRef as React.RefObject<HTMLDivElement>}
        role="tablist"
        aria-label={`Subtemas de ${current.label}`}
        {...({ focusgroup: "tablist nomemory" } as Record<string, string>)}
        className={`tabs-scroller mt-4 flex flex-nowrap items-end gap-1.5 transition-[padding] duration-300 ${
          current.options.length > 5 ? "justify-start" : "justify-center"
        }`}
        style={{ paddingLeft: collapsed ? 48 : 160 }}
      >
        {current.options.map((option) => {
          const selected = option === activeOption
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={selected}
              {...(selected ? ({ focusgroupstart: "" } as Record<string, string>) : {})}
              onClick={() => onAlgorithmChange(option)}
              style={{ scrollSnapAlign: "start" }}
              className={`relative shrink-0 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-[clamp(11px,1.05vw,13px)] font-semibold transition-all duration-200 select-none ${
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
      </div>
    </header>
  )
}
