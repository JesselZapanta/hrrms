import { useEffect, useRef, useState } from 'react'

const VARIANTS = {
  form: {
    trigger:
      'flex w-full items-center justify-between gap-2 rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-orange focus:ring-1 focus:ring-orange',
    panel: 'left-0',
    chevron: 'flex h-4 w-4 shrink-0 items-center justify-center text-ink/35'
  },
  chip: {
    trigger:
      'flex items-center gap-1.5 font-medium text-ink outline-none transition-colors hover:text-orange',
    panel: 'right-0',
    chevron: 'flex h-4 w-4 shrink-0 items-center justify-center text-ink/35'
  }
}

export default function Select({ value, onChange, options, placeholder = 'Select…', variant = 'form', className = '' }) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef(null)
  const v = VARIANTS[variant] || VARIANTS.form

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
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
        <span className={`min-w-0 flex-1 truncate text-left`}>{selected?.label || placeholder}</span>
        <span className={v.chevron}>
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-30 mt-1.5 max-h-56 min-w-44 overflow-y-auto rounded-xl border border-hairline bg-white p-1 shadow-xl shadow-navy/10 ${v.panel}`}
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
        </div>
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