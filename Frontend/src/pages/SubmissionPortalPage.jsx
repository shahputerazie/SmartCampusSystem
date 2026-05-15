import { LogOut } from 'lucide-react'

export default function SubmissionPortalPage({
  categoryMeta,
  categoryOptions,
  currentUser,
  error,
  onCreateTicket,
  onLogout,
  renderTicketModal,
  submitNotice,
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.12),_transparent_24%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_50%,_#f7fafc_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">I-Kampus</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Submit Ticket</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">This fallback screen is for signed-in requester access only.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#003366] text-sm font-semibold text-white">{(currentUser.username || currentUser.role || 'US').slice(0, 2).toUpperCase()}</div>
                <div className="hidden text-left sm:block"><p className="text-sm font-semibold text-slate-900">{currentUser.username || 'System User'}</p><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{currentUser.role}</p></div>
              </div>

              <button type="button" onClick={onLogout} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-[#003366]"><LogOut className="h-4 w-4" />Logout</button>
            </div>
          </header>

          {submitNotice ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{submitNotice}</div> : null}
          {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Need campus support?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Report IT, maintenance, security, academic, or facilities issues to the support team.</p>
              <button type="button" onClick={onCreateTicket} className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278]">Submit Ticket</button>
            </article>

            <article className="rounded-3xl border border-slate-200/80 bg-slate-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Available departments</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{categoryOptions.map((category) => <div key={category} className="rounded-2xl bg-white px-4 py-4"><p className="text-sm font-semibold text-slate-900">{category}</p><p className="mt-1 text-sm text-slate-500">{categoryMeta[category]?.department}</p></div>)}</div>
            </article>
          </section>
        </div>
      </div>
      {renderTicketModal()}
    </div>
  )
}
