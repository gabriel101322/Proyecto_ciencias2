import { useEffect, useRef } from "react"
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
    <header className="relative z-10 flex flex-col justify-between bg-[#52241A] px-8 pt-6 pb-0 text-white shadow-[0_10px_30px_-18px_rgba(82,36,26,0.9)]">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#E6B793]">
          {current.label}
        </span>

        <div className="ml-auto flex items-center gap-4">
          {onSaveClick && onLoadClick && (
            <div className="mr-4 flex items-center gap-2">
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
          <span className="text-[20px] font-semibold tracking-[0.02em] text-white/95">
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
        className={`tabs-scroller mt-5 flex flex-nowrap items-end gap-1 transition-[padding] duration-300 ${
          current.options.length > 5 ? "justify-start" : "justify-center"
        }`}
        style={{ paddingLeft: collapsed ? 64 : 196 }}
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
              className="relative flex-none whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-[clamp(11px,1.05vw,13px)] font-medium transition-colors text-white/75 hover:bg-white/10 hover:text-white aria-selected:bg-[#faf6f2] aria-selected:text-[#52241A] after:pointer-events-none after:absolute after:inset-x-3 after:top-0 after:border-t-[3px] after:border-transparent aria-selected:after:border-[#E6B793]"
            >
              {option}
            </button>
          )
        })}
      </div>
    </header>
  )
}
