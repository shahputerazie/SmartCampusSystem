export default function OperationsPage({ effectiveRole, renderOverviewCards, renderStaffDashboard }) {
  if (effectiveRole === 'STAFF') {
    return renderStaffDashboard()
  }

  return (
    <>
      {renderOverviewCards()}

      <section className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Ticket management</h2>
        <p className="mt-1 text-sm text-slate-500">
          View all tickets, assign the correct owner, and manage operational ticket handling from
          one queue.
        </p>
      </section>
    </>
  )
}
