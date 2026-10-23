import { useId } from 'react'

// Diagonal orange curved band (spec §5.1, §5.2, §5.3). Position with className.
export default function Swoosh({ className = '' }) {
  const rawId = useId().replace(/:/g, '')
  const id = `gov-swoosh-${rawId}`
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F7861E" />
          <stop offset="1" stopColor="#EA6A0A" />
        </linearGradient>
      </defs>
      <path
        d="M-20 200 C 60 145, 115 115, 220 15 L 220 55 C 115 145, 60 175, -20 235 Z"
        fill={`url(#${id})`}
      />
    </svg>
  )
}

// Broad double swoosh (white edge + orange band) for the header divider,
// echoing the reference's sweeping band. Tall narrow container (e.g. w-44 h-full).
export function SwooshWide({ className = '' }) {
  const rawId = useId().replace(/:/g, '')
  const id = `gov-swoosh-wide-${rawId}`
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-o`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F7861E" />
          <stop offset="1" stopColor="#EA6A0A" />
        </linearGradient>
      </defs>
      <path
        d="M20 210 C 85 140, 125 95, 160 -10 L 195 -10 C 160 95, 120 140, 55 210 Z"
        fill="#FFFFFF"
      />
      <path
        d="M65 210 C 130 140, 170 95, 205 -10 L 230 -10 C 195 95, 155 140, 90 210 Z"
        fill={`url(#${id}-o)`}
      />
    </svg>
  )
}
