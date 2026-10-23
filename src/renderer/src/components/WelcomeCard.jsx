import Swoosh from './Swoosh.jsx'
import welcomeBannerUrl from '../assets/welcome-banner-bg.png'

export default function WelcomeCard({ user, isAdmin }) {
  return (
    <section className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 shadow-lg shadow-navy-900/20 lg:mb-5">
      {/* Welcome banner blended into the navy background */}
      <img
        src={welcomeBannerUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[62%] object-cover object-center opacity-45"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/75 to-navy-900/10" />
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
      <Swoosh className="pointer-events-none absolute -bottom-10 right-4 h-36 w-36 opacity-30" />
      <div className="relative z-10 grid gap-4 p-4 lg:grid-cols-[1.25fr_1fr_0.8fr] lg:gap-5 lg:p-5">
        {/* Profile */}
        <div className="flex min-w-0 items-center gap-4">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="text-[12px] text-white/60 lg:text-[14px]">Good day,</p>
            <h2 className="truncate text-[18px] font-bold leading-tight text-white lg:text-[22px]">
              {user.full_name}
            </h2>
            <p className="mt-0.5 truncate text-[12px] font-medium capitalize text-white/70 lg:text-[13px]">
              {isAdmin ? 'Administrator' : user.role} · City Council Office
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div className="flex flex-col justify-center gap-2 border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <MiniStat label="Employee ID" value={`#${user.id}`} />
          <MiniStat label="Department" value="City Council Office" />
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-white/60">Employment Status</span>
            <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold capitalize text-success-text">
              {user.status || 'active'}
            </span>
          </span>
        </div>

        {/* Quote */}
        <div className="hidden flex-col items-end justify-center text-right xl:flex">
          <p className="text-[13px] italic leading-relaxed text-white lg:text-[14px]">
            “Organized Records for a More Efficient Public Service.”
          </p>
          <span className="mt-2 inline-block h-[3px] w-10 rounded-full bg-accent" />
        </div>
      </div>
    </section>
  )
}

function MiniStat({ label, value }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase text-white/60">{label}</span>
      <span className="text-[12px] font-semibold text-white">{value}</span>
    </span>
  )
}

function Avatar({ user }) {
  if (user?.profile_pic) {
    return (
      <img
        src={user.profile_pic}
        alt={user.full_name}
        className="h-[56px] w-[56px] shrink-0 rounded-full border-2 border-white/40 object-cover lg:h-[72px] lg:w-[72px]"
      />
    )
  }
  return (
    <span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white lg:h-[72px] lg:w-[72px] lg:text-2xl">
      {initials(user?.full_name)}
    </span>
  )
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
