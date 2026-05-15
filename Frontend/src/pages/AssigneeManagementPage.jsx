import { Users } from 'lucide-react'

export default function AssigneeManagementPage({
  assigneeInsights,
  assigneeUsers,
  busiestAssignee,
  isUsersLoading,
  onViewAssigneeTickets,
  openOrInProgressByAssignee,
  openRoutedTickets,
}) {
  return (
    <section className="mt-6 grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div><h2 className="text-lg font-semibold text-slate-950">Assignee management</h2><p className="mt-1 text-sm text-slate-500">Monitor assignee accounts, current workload, and ticket routing pressure.</p></div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003366] text-white"><Users className="h-5 w-5" /></div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-900">Assignees</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{assigneeUsers.length}</p><p className="mt-2 text-sm leading-6 text-slate-500">Total assignee accounts available for routing.</p></article>
          <article className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-900">Open routed</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{openRoutedTickets}</p><p className="mt-2 text-sm leading-6 text-slate-500">Tickets already assigned and still waiting on action.</p></article>
          <article className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-900">Filtered results</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{assigneeInsights.length}</p><p className="mt-2 text-sm leading-6 text-slate-500">Results matching the current search query.</p></article>
        </div>

        {busiestAssignee ? <div className="mt-6 rounded-3xl border border-[#003366]/10 bg-[#003366]/5 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003366]/70">Current busiest assignee</p><p className="mt-2 text-sm font-semibold text-slate-950">{busiestAssignee.username}</p><p className="mt-1 text-sm text-slate-600">{busiestAssignee.activeTickets} active tickets, {busiestAssignee.openTickets} open tickets.</p></div> : null}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left"><thead className="bg-slate-50"><tr><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assignee</th><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Active</th><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open</th><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total</th><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Actions</th></tr></thead><tbody className="divide-y divide-slate-200 bg-white">{isUsersLoading ? <tr><td className="px-5 py-6 text-sm text-slate-500" colSpan="5">Loading assignees...</td></tr> : assigneeInsights.length ? assigneeInsights.map((assignee) => <tr key={assignee.id} className="align-top"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-950">{assignee.username}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{assignee.email}</p></td><td className="px-5 py-4 text-sm text-slate-600">{assignee.activeTickets}</td><td className="px-5 py-4 text-sm text-slate-600">{assignee.openTickets}</td><td className="px-5 py-4 text-sm text-slate-600">{assignee.totalTickets}</td><td className="px-5 py-4"><button type="button" onClick={() => onViewAssigneeTickets(assignee.username)} className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-[#003366]">View tickets</button></td></tr>) : <tr><td className="px-5 py-6 text-sm text-slate-500" colSpan="5">No assignees match the current search.</td></tr>}</tbody></table></div></div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-950">Assignment summary</h2><p className="mt-1 text-sm text-slate-500">Operational load by assignee, based on tickets currently in the system.</p></div><Users className="h-5 w-5 text-[#003366]" /></div>
        <div className="mt-6 space-y-3">{Object.keys(openOrInProgressByAssignee).length ? Object.entries(openOrInProgressByAssignee).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 6).map(([name, count]) => <div key={name} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4"><div><p className="text-sm font-semibold text-slate-950">{name}</p><p className="mt-1 text-sm text-slate-500">Active assigned tickets</p></div><span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-[#003366] px-3 text-sm font-semibold text-white">{count}</span></div>) : <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center"><h3 className="text-lg font-semibold text-slate-900">No active load</h3><p className="mt-2 text-sm text-slate-500">Assign tickets to assignees to populate the workload summary.</p></div>}</div>
      </div>
    </section>
  )
}
