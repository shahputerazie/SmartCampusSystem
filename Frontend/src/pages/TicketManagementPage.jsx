import { Filter, Plus } from 'lucide-react'
import TicketTable from '../components/TicketTable'

export default function TicketManagementPage({
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
  onCreateTicket,
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
            <h2 className="text-lg font-semibold text-slate-950">Ticket management</h2>
            <p className="mt-1 text-sm text-slate-500">
              View all tickets and review full ticket details from one queue.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

            <button
              type="button"
              onClick={onCreateTicket}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-[#003366]"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </button>
          </div>
        </div>

        <TicketTable
          isLoading={isLoading}
          selectedTicketId={selectedTicket?.id ?? null}
          tickets={filteredTickets}
          onSelectTicket={onSelectTicket}
        />
      </div>

      <TicketDetailsPanelComponent
        mode="management"
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
