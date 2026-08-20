import { useState } from 'react'

export function Modal({ title, onClose, children, wide, compact }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col ${wide ? 'max-w-3xl' : compact ? 'max-w-md' : 'max-w-lg'} overflow-hidden rounded-2xl border border-hairline bg-paper shadow-2xl shadow-navy/20 toast-in`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-white px-5 py-3.5">
          <h3 className="font-heading text-base font-semibold text-navy">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-paper-dark hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
