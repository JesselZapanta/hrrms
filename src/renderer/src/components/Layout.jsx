import { useEffect, useState } from 'react'
import { Modal } from './Modal.jsx'
import AppHeader from './AppHeader.jsx'
import Sidebar from './Sidebar.jsx'
import WelcomeCard from './WelcomeCard.jsx'

const META = {
  dashboard: { title: 'Dashboard', subtitle: 'Registry Overview' },
  employees: { title: 'Employees', subtitle: 'Records Management' },
  folder: { title: 'Employee Folder', subtitle: 'Filing Documents' },
  categories: { title: 'File Categories', subtitle: 'Filing Structure' },
  offices: { title: 'Offices', subtitle: 'City Offices Directory' },
  salaryGrades: { title: 'Salary Grades', subtitle: 'Salary Standardization' },
  users: { title: 'User Management', subtitle: 'Access Control' },
  profile: { title: 'Profile', subtitle: 'Account Settings' }
}

export default function Layout({ user, view, onNavigate, children, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [version, setVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState(null)
  useEffect(() => {
    window.api?.app?.version?.()
      ?.then((res) => setVersion(res?.data ?? res ?? ''))
      .catch(() => {})
  }, [])
  useEffect(() => {
    const off = window.api?.app?.onUpdateStatus?.((data) => {
      setUpdateStatus(data)
      if (data.status === 'not-available') {
        setTimeout(() => setUpdateStatus(null), 3000)
      }
    })
    return () => off?.()
  }, [])
  const meta = META[view] || META.dashboard
  const hideBreadcrumb = ['dashboard', 'users', 'employees', 'categories', 'offices', 'salaryGrades'].includes(view)

  return (
    <div className="flex h-full flex-col bg-canvas">
      <AppHeader user={user} onNavigate={onNavigate} onLogoutRequest={() => setConfirmLogout(true)} />

      <div className="flex min-h-0 flex-1">
        <Sidebar user={user} view={view} onNavigate={onNavigate} version={version} />

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {updateStatus && updateStatus.status !== 'not-available' && (
            <div className="flex items-center gap-3 border-b border-border bg-navy-900 px-6 py-2.5 text-sm text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                {updateStatus.status === 'downloading' ? <SpinnerIcon /> : updateStatus.status === 'downloaded' ? <CheckIconSmall /> : <DownloadIcon />}
              </span>
              <span className="flex-1 font-medium">
                {updateStatus.status === 'checking' && 'Checking for updates…'}
                {updateStatus.status === 'available' && `Update ${updateStatus.version} available — downloading…`}
                {updateStatus.status === 'downloading' && `Downloading update… ${updateStatus.percent}%`}
                {updateStatus.status === 'downloaded' && `Update ${updateStatus.version} ready — restart to install`}
                {updateStatus.status === 'error' && `Update error: ${updateStatus.message}`}
              </span>
              {updateStatus.status === 'downloading' && (
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/15">
                  <span className="block h-full bg-accent transition-all" style={{ width: `${updateStatus.percent}%` }} />
                </span>
              )}
              {updateStatus.status === 'downloaded' && (
                <button
                  onClick={() => window.api?.app?.quitAndInstall?.()}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark"
                >
                  Restart to install
                </button>
              )}
              {updateStatus.status === 'error' && (
                <button onClick={() => setUpdateStatus(null)} className="text-white/60 hover:text-white">
                  <CloseIconSmall />
                </button>
              )}
            </div>
          )}

          {/* Breadcrumb */}
          {!hideBreadcrumb && (
            <div className="shrink-0 px-3 pb-1 pt-3 lg:px-5 lg:pt-4">
              <span className="text-[12px] font-semibold text-text-primary lg:text-[14px]">{meta.title}</span>
              <span className="ml-2 text-[10px] text-text-muted lg:text-[12px]">{meta.subtitle}</span>
            </div>
          )}

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1280px] px-3 py-3 lg:px-5 lg:py-4">{children}</div>
          </main>
        </div>
      </div>

      {confirmLogout && (
        <Modal title="Sign out" onClose={() => setConfirmLogout(false)} compact>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <LogoutIcon />
            </span>
            <div>
              <div className="text-sm font-semibold text-text-primary">Log out of HRRMS?</div>
              <p className="mt-0.5 text-xs text-text-secondary">
                You will need to sign in again to continue.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={() => setConfirmLogout(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-row-hover"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmLogout(false)
                onLogout()
              }}
              className="rounded-lg bg-danger-text px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[.98]"
            >
              Sign Out
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function CheckIconSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CloseIconSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
