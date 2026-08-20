import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const VARIANTS = {
  form: {
    trigger:
      'flex w-full items-center justify-between gap-2 rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-orange focus:ring-1 focus:ring-orange',
    chevron: 'flex h-4 w-4 shrink-0 items-center justify-center text-ink/35'
  },
  chip: {
    trigger:
      'flex items-center gap-1.5 font-medium text-ink outline-none transition-colors hover:text-orange',
    chevron: 'flex h-4 w-4 shrink-0 items-center justify-center text-ink/35',
    panelMinWidth: 208
  }
}

const ITEM_H = 38
const MAX_PANEL_H = 224

export default function Select({ value, onChange, options, placeholder = 'Select…', variant = 'form', className = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const v = VARIANTS[variant] || VARIANTS.form

  const selected = options.find((o) => o.value === value)

  const place = () => {
    const rect = rootRef.current.getBoundingClientRect()
    const panelH = Math.min(options.length * ITEM_H, MAX_PANEL_H) + 8
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const openUp = spaceBelow < panelH && rect.top > spaceBelow
    setPos({
      width: rect.width,
      minWidth: v.panelMinWidth || undefined,
      left: rect.left,
      top: openUp ? rect.top - panelH - 6 : rect.bottom + 6,
      maxHeight: openUp ? Math.min(panelH, rect.top - 8) : Math.min(panelH, spaceBelow)
    })
  }

  useEffect(() => {
    if (!open) return
    place()
    const onResize = () => place()
    const onScroll = () => place()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, options.length])

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && rootRef.current.contains(e.target)) return
      if (panelRef.current && panelRef.current.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const pick = (o) => {
    onChange(o.value)
    setOpen(false)
  }

  const onTriggerKey = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
        setHighlight(options.findIndex((o) => o.value === value))
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + options.length) % options.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight >= 0) pick(options[highlight])
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${v.trigger} ${open ? 'border-orange ring-1 ring-orange' : ''}`}
      >
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label || placeholder}</span>
        <span className={v.chevron}>
          <ChevronIcon open={open} />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: 'fixed',
              left: pos?.left,
              top: pos?.top,
              width: pos?.width,
              minWidth: pos?.minWidth,
              maxHeight: pos?.maxHeight,
              zIndex: 200
            }}
            className="mt-0.5 overflow-y-auto rounded-xl border border-hairline bg-white p-1 shadow-xl shadow-navy/10"
          >
            {options.map((o, i) => {
              const isSel = o.value === value
              const isHi = i === highlight
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(o)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSel
                      ? 'bg-orange-soft font-semibold text-orange'
                      : isHi
                        ? 'bg-paper text-ink'
                        : 'text-ink/70 hover:bg-paper hover:text-ink'
                  }`}
                >
                  {o.label}
                  {isSel && <CheckIcon />}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}