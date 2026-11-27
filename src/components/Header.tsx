import { useEffect, useRef, useState, useCallback } from "react"
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
  const navRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = navRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth + 2
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    checkScroll()
    const handleResize = () => checkScroll()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [checkScroll, collapsed, current.options])

  // Scroll selected tab smoothly into view inside the horizontal scroller
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const selectedBtn = nav.querySelector<HTMLButtonElement>('[aria-selected="true"]')
    if (selectedBtn) {
      selectedBtn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      })
    }
    const timer = setTimeout(checkScroll, 300)
    return () => clearTimeout(timer)
  }, [activeOption, current.id, checkScroll])

  const scrollTabs = (direction: "left" | "right") => {
    if (navRef.current) {
      const amount = direction === "left" ? -240 : 240
      navRef.current.scrollBy({ left: amount, behavior: "smooth" })
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && navRef.current) {
      navRef.current.scrollLeft += e.deltaY
      checkScroll()
    }
  }

  return (
    <header className="relative z-10 flex flex-col justify-between bg-gradient-to-r from-[#441c14] via-[#52241A] to-[#441c14] pt-3 pb-0 text-white shadow-[0_12px_32px_-16px_rgba(43,22,16,0.8)] border-b border-white/10 shrink-0">
      {/* Top bar: Section Title & CC2 Badge / Save-Load buttons */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2 rounded-full bg-[#E6B793] shadow-[0_0_8px_rgba(230,183,147,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#E6B793]">
            {current.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onSaveClick && onLoadClick && (
            <div className="mr-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={onSaveClick}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 active:bg-white/30"
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
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 active:bg-white/30"
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
          <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-[10.5px] font-semibold tracking-wider text-white/90 border border-white/15 backdrop-blur-sm whitespace-nowrap">
            CIENCIAS DE LA COMPUTACIÓN 2
          </span>
        </div>
      </div>

      {/* Dynamic option tabs bar: dynamically padded to clear the sidebar collapse toggle button */}
      <div
        className="mt-2.5 flex items-end min-w-0 transition-[padding-left] duration-300 ease-in-out pr-4 sm:pr-6 gap-1"
        style={{ paddingLeft: `${collapsed ? 108 : 284}px` }}
      >
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs("left")}
            className="mb-1 mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white/90 hover:bg-white/25 active:scale-95 transition"
            aria-label="Desplazar pestañas a la izquierda"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        <div
          ref={navRef}
          role="tablist"
          aria-label={`Subtemas de ${current.label}`}
          onWheel={handleWheel}
          onScroll={checkScroll}
          className="flex items-end gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none min-w-0 flex-1 scroll-smooth"
        >
          {current.options.map((option) => {
            const selected = option === activeOption
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onAlgorithmChange(option)}
                className={`relative shrink-0 whitespace-nowrap rounded-t-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-[12.5px] sm:text-[13px] font-semibold transition-all duration-200 select-none ${
                  selected
                    ? "bg-[#faf6f2] text-[#52241A] shadow-xs"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {option}

                {selected && (
                  <motion.span
                    layoutId="activeHeaderTabIndicator"
                    className="absolute inset-x-2 -top-px h-[3px] rounded-full bg-[#E6B793] shadow-[0_0_8px_rgba(230,183,147,0.9)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs("right")}
            className="mb-1 ml-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white/90 hover:bg-white/25 active:scale-95 transition"
            aria-label="Desplazar pestañas a la derecha"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
