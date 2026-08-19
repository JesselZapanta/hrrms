import { useEffect } from 'react'

const TONES = {
  error: {
    accent: 'bg-status-red',
    iconBg: 'bg-status-red/15',
    iconColor: 'text-status-red'
  },
  warning: {
    accent: 'bg-status-amber',
    iconBg: 'bg-status-amber/15',
    iconColor: 'text-status-amber'
  },
  success: {
    accent: 'bg-status-green',
    iconBg: 'bg-status-green/15',
    iconColor: 'text-status-green'
  }
}

export default function Toast({ message, tone = 'error', onClose, duration = 4500 }) {
  const t = TONES[tone] || TONES.error

  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[60] flex justify-center px-4">
      <div
        role="alert"
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-white/10 bg-navy text-paper shadow-2xl shadow-navy/30 toast-in"
      >
        <span className={`h-full w-1 shrink-0 self-stretch ${t.accent}`} />
        <span className={`mt-3.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${t.iconBg} ${t.iconColor}`}>
          {tone === 'success' ? <CheckIcon /> : tone === 'warning' ? <WarnIcon /> : <AlertIcon />}
        </span>
        <div className="flex-1 py-3">
          <div className="text-sm font-semibold">{titleFor(tone)}</div>
          <div className="mt-0.5 text-sm leading-snug text-paper/75">{message}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="mt-3 mr-3 rounded p-1 text-paper/50 transition-colors hover:bg-white/10 hover:text-paper"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

function titleFor(tone) {
  if (tone === 'success') return 'Success'
  if (tone === 'warning') return 'Notice'
  return 'Something went wrong'
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
