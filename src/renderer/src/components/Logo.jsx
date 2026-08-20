export default function Logo({ size = 'md', dot = true, className = '' }) {
  const cls = size === 'lg' ? 'h-12 w-12' : 'h-11 w-11'
  return (
    <span
      className={`${cls} relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-deep ring-1 ring-white/15 shadow-lg shadow-navy/20 ${className}`}
    >
      <svg viewBox="0 0 48 48" fill="none" className="h-[68%] w-[68%]">
        <path
          d="M6 15.5A4.5 4.5 0 0 1 10.5 11h8.2l3.2 4.4H37.5A4.5 4.5 0 0 1 42 19.9V34a4.5 4.5 0 0 1-4.5 4.5h-27A4.5 4.5 0 0 1 6 34v-18.5z"
          fill="#E85B18"
        />
        <circle cx="24" cy="23.5" r="6" fill="#fff" />
        <path d="M14.5 36.5c0-5.6 4.2-9 9.5-9s9.5 3.4 9.5 9" fill="#fff" />
      </svg>
      {dot && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-navy bg-status-green" />
      )}
    </span>
  )
}