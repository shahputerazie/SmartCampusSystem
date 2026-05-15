import { Filter } from 'lucide-react'
import TicketTable from '../components/TicketTable'

export default function AssignedTicketsPage({
  TicketDetailsPanelComponent,
  draftComment,
  filteredTickets,
  formatDateTime,
  getStatusLabel,
  handleAssigneeChange,
  handleCommentSubmit,
  handleStatusChange,
  isLoading,
  onCommentChange,
  onSelectTicket,
  selectedAssigneeOptions,
  selectedTicket,
  setStatusFilter,
  statusFilter,
  statusConfig,
  statusOptions,
}) {
  return (
    <section className="mt-6 grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Assigned tickets</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the tickets assigned to you and keep work progress up to date.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <TicketTable
          isLoading={isLoading}
          selectedTicketId={selectedTicket?.id ?? null}
          tickets={filteredTickets}
          onSelectTicket={onSelectTicket}
        />
      </div>

      <TicketDetailsPanelComponent
        mode="status-comments"
        commentValue={draftComment}
        formatDateTime={formatDateTime}
        getStatusLabel={getStatusLabel}
        onAssigneeChange={handleAssigneeChange}
        onCommentChange={onCommentChange}
        onCommentSubmit={handleCommentSubmit}
        onStatusChange={handleStatusChange}
        selectedAssigneeOptions={selectedAssigneeOptions}
        statusConfig={statusConfig}
        statusOptions={statusOptions}
        ticket={selectedTicket}
      />
    </section>
  )
}
