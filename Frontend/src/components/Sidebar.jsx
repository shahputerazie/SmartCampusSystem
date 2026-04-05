import {
  LayoutDashboard,
  TicketPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react'

const iconMap = {
  'report-issue': TicketPlus,
  operations: LayoutDashboard,
  'ticket-management': Wrench,
  'category-management': TicketPlus,
  'user-management': Users,
}

function Sidebar({
  activeNav,
  currentRole,
  isOpen,
  items,
  onClose,
  onSelect,
  onTemporaryRoleChange,
  summary,
  temporaryRole,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[304px] flex-col bg-[#003366] px-5 py-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.24)] transition duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:rounded-r-[32px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#FFCC00]">
              Universiti Malaysia Terengganu
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">SCSS Admin Console</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Smart Campus Support System
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-200 transition hover:border-white/20 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <SidebarMetric label="Total" value={summary.total} />
          <SidebarMetric label="Active" value={summary.inProgress} />
          <SidebarMetric label="Done" value={summary.resolved} />
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Temporary Access
          </p>
          <select
            value={temporaryRole || currentRole || 'ADMIN'}
            onChange={(event) => onTemporaryRoleChange(event.target.value)}
            className="mt-3 h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-medium text-white outline-none transition focus:border-white/30"
          >
            <option value="ADMIN" className="text-slate-900">ADMIN</option>
            <option value="STAFF" className="text-slate-900">STAFF</option>
            <option value="ASSIGNEE" className="text-slate-900">ASSIGNEE</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Sidebar-only preview switch for testing access levels.
          </p>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = iconMap[item.key] || LayoutDashboard
            const isActive = item.key === activeNav

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-[#003366] shadow-lg'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

function SidebarMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}

export default Sidebar
