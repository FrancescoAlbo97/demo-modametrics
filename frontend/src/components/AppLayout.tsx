import { LogOut, BarChart2 } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { to: '/analisi', label: 'Analisi' },
  { to: '/esplora', label: 'Esplora' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ingest', label: 'Carica dati' },
]

export default function AppLayout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-stone-800 tracking-tight">ModaMetrics</span>
            <span className="text-stone-400 text-sm hidden sm:block">· Turismo di lusso in Sardegna</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition px-3 py-1.5 rounded-lg hover:bg-stone-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Esci</span>
          </button>
        </div>

        <nav className="max-w-5xl mx-auto px-4 flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
