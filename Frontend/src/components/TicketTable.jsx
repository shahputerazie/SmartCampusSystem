const statusStyles = {
  OPEN: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
}

const statusLabels = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

function formatDate(value) {
  if (!value) {
    return 'Pending sync'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

function TicketTable({ isLoading, onSelectTicket, selectedTicketId, tickets }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!tickets.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900">No tickets found</h3>
        <p className="mt-2 text-sm text-slate-500">
          Adjust the search or filter criteria, or create a new support request.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <div className="hidden grid-cols-[1.8fr_1fr_1fr_1fr] gap-4 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 xl:grid">
        <span>Title</span>
        <span>Status</span>
        <span>Owner</span>
        <span>Date</span>
      </div>

      <div className="divide-y divide-slate-200">
        {tickets.map((ticket) => {
          const normalizedStatus = ticket.status || 'OPEN'
          const statusClass =
            statusStyles[normalizedStatus] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
          const statusLabel = statusLabels[normalizedStatus] || normalizedStatus
          const isSelected = ticket.id === selectedTicketId

          return (
            <button
              key={ticket.id ?? `${ticket.title}-${ticket.createdAt}`}
              type="button"
              onClick={() => onSelectTicket(ticket.id)}
              className={`grid w-full gap-4 px-5 py-4 text-left transition md:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1fr] xl:items-center ${
                isSelected ? 'bg-[#f4f8fc]' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="min-w-0">
                <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                  {ticket.title}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  SCSS-{ticket.id ?? 'NEW'} • {ticket.category || 'General'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 xl:hidden">
                  Status
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                >
                  {statusLabel}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 xl:hidden">
                  Owner
                </p>
                <p className="mt-1 text-sm text-slate-600">{ticket.assignee}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 xl:hidden">
                  Date Created
                </p>
                <p className="mt-1 text-sm text-slate-600">{formatDate(ticket.createdAt)}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TicketTable
