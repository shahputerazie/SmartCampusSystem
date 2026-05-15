export default function ReportIssuePage({ categoryMeta, categoryOptions, effectiveRole, onCreateTicket }) {
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Submission access</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Temporary role preview is set to `{effectiveRole}`. This access level is limited to ticket
          submission flows.
        </p>

        <button
          type="button"
          onClick={onCreateTicket}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278]"
        >
          Submit Ticket
        </button>
      </article>

      <article className="rounded-3xl border border-slate-200/80 bg-slate-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Available departments</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {categoryOptions.map((category) => (
            <div key={category} className="rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">{category}</p>
              <p className="mt-1 text-sm text-slate-500">{categoryMeta[category]?.department}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
