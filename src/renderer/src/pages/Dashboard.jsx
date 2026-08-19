import { useEffect, useState } from 'react'

export default function Dashboard({ user, onNavigate }) {
  const [stats, setStats] = useState({ employees: 0, files: 0, categories: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [empRes, catRes] = await Promise.all([
        window.api.employees.list({}),
        window.api.categories.listAll()
      ])
      if (!mounted) return
      let files = 0
      let recents = []
      if (empRes.ok) {
        setStats((s) => ({ ...s, employees: empRes.data.length }))
        const fileLists = await Promise.all(
          empRes.data.slice(0, 5).map(async (e) => {
            const f = await window.api.files.list(e.id)
            return (f.ok ? f.data : []).map((file) => ({ ...file, employee: e }))
          })
        )
        recents = fileLists.flat().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6)
        files = recents.length
        setRecent(recents)
      }
      if (catRes.ok) setStats((s) => ({ ...s, categories: catRes.data.length, files }))
    })()
    return () => {
      mounted = false
    }
  }, [])

  const cards = [
    { label: 'Total Employees', value: stats.employees, key: 'employees' },
    { label: 'Files on File', value: stats.files, key: 'employees' },
    { label: 'File Categories', value: stats.categories, key: 'categories' }
  ]

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Dashboard</h1>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/40">
          Registry · City Council Office · LGU Ozamiz
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onNavigate(c.key)}
            className="folder-card p-5 text-left transition-colors hover:border-orange/60"
          >
            <div className="font-mono text-3xl font-medium text-navy">{c.value}</div>
            <div className="mt-1 text-sm text-ink/60">{c.label}</div>
          </button>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-navy">Recent filings</h2>
        {recent.length === 0 ? (
          <div className="rounded-md border border-dashed border-hairline bg-white px-5 py-10 text-center text-sm text-ink/40">
            No files filed yet. Open an employee folder to begin filing documents.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-hairline bg-white">
            {recent.map((f, i) => (
              <div
                key={f.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  i !== recent.length - 1 ? 'border-b border-hairline' : ''
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{f.file_name}</div>
                  <div className="font-mono text-[11px] text-ink/40">
                    {f.employee.complete_name} · {f.subcategory_name}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-ink/40">{f.created_at}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
