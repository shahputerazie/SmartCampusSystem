import { Clock3, MapPin, MessageSquare, UserRound, Wrench } from 'lucide-react'

function DetailStat({ icon, label, value }) {
  const IconComponent = icon

  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#003366] shadow-sm">
          <IconComponent className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function TicketDetailsPanel({
  commentValue,
  formatDateTime,
  getStatusLabel,
  mode = 'management',
  onAssigneeChange,
  onCommentChange,
  onCommentSubmit,
  onStatusChange,
  selectedAssigneeOptions,
  statusConfig,
  statusOptions,
  ticket,
}) {
  if (!ticket) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">No ticket selected</h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose a ticket from the queue to review details, comments, and operational actions.
        </p>
      </section>
    )
  }

  const statusBadge = statusConfig[ticket.status] || statusConfig.OPEN
  const showAssignment = mode === 'management' || mode === 'assignment'
  const showStatus = mode === 'management' || mode === 'status' || mode === 'status-comments'
  const showComments = mode === 'management' || mode === 'comments' || mode === 'status-comments'
  const showMetaGrid = mode !== 'comments'

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              I-Kampus-{ticket.id ?? 'NEW'}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">{ticket.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{ticket.description}</p>
          </div>
        </div>

        {showMetaGrid ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailStat icon={MapPin} label="Location" value={ticket.location} />
            <DetailStat icon={Wrench} label="Department" value={ticket.department} />
            <DetailStat icon={UserRound} label="Assignee" value={ticket.assignee} />
            <DetailStat icon={Clock3} label="Created" value={formatDateTime(ticket.createdAt)} />
          </div>
        ) : null}

        {showAssignment || showStatus ? (
          <div className="mt-6 grid gap-4 rounded-3xl bg-slate-50 p-4">
            <div className={`grid gap-4 ${showAssignment && showStatus ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
              {showStatus ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Status</span>
                  <select
                    value={ticket.status}
                    onChange={(event) => onStatusChange(ticket.id, event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:ring-4 focus:ring-[#003366]/10"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showAssignment ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Assignee</span>
                  <select
                    value={ticket.assignee}
                    onChange={(event) => onAssigneeChange(ticket.id, event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:ring-4 focus:ring-[#003366]/10"
                  >
                    {selectedAssigneeOptions.map((assignee) => (
                      <option key={assignee} value={assignee}>
                        {assignee}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>
        ) : null}
      </article>

      {showComments ? (
        <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Comments & history</h2>
              <p className="mt-1 text-sm text-slate-500">Lifecycle notes, staff updates, and requestor follow-up.</p>
            </div>
            <MessageSquare className="h-5 w-5 text-[#003366]" />
          </div>

          <form className="mt-5" onSubmit={onCommentSubmit}>
            <label className="sr-only" htmlFor="new-comment">New comment</label>
            <textarea
              id="new-comment"
              rows="3"
              value={commentValue}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder="Add an internal update or a reply for the requestor."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
            />
            <div className="mt-3 flex justify-end">
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white transition hover:bg-[#0a4278]">Post update</button>
            </div>
          </form>

          <div className="mt-6 space-y-4">
            {ticket.comments.map((comment) => (
              <article key={comment.id} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{comment.role}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{comment.message}</p>
              </article>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}
