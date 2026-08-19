import { useState } from 'react'

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-md border border-hairline bg-paper shadow-sm`}
      >
        <div className="flex items-center justify-between border-b border-hairline bg-white px-5 py-3">
          <h3 className="font-heading text-lg font-semibold text-navy">{title}</h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-0.5 text-ink/60 transition-colors hover:bg-paper-dark hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
