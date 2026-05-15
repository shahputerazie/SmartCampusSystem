import { Users } from 'lucide-react'

export default function UserManagementPage({
  adminUsersCount,
  beginEditUser,
  deletingUserId,
  editingUserId,
  filteredUsers,
  handleDeleteUser,
  handleUserSubmit,
  isSavingUser,
  isUsersLoading,
  resetUserForm,
  setUserForm,
  userForm,
  userNotice,
  users,
  usersError,
  userRoleOptions,
}) {
  const editingUser = users.find((user) => user.id === editingUserId) ?? null

  return (
    <section className="mt-6 grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">User management</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create, edit, and remove admin, staff, and assignee accounts.
            </p>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003366] text-white">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-900">Accounts</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{users.length}</p><p className="mt-2 text-sm leading-6 text-slate-500">Total users currently available in the system.</p></article>
          <article className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-900">Admins</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{adminUsersCount}</p><p className="mt-2 text-sm leading-6 text-slate-500">Privileged accounts with dashboard, ticket, and user access.</p></article>
          <article className="rounded-3xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-900">Filtered results</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{filteredUsers.length}</p><p className="mt-2 text-sm leading-6 text-slate-500">Results matching the current search query.</p></article>
        </div>

        {userNotice ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{userNotice}</div> : null}
        {usersError ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{usersError}</div> : null}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50"><tr><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">User</th><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</th><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</th><th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isUsersLoading ? (
                  <tr><td className="px-5 py-6 text-sm text-slate-500" colSpan="4">Loading users...</td></tr>
                ) : filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="px-5 py-4"><p className="text-sm font-semibold text-slate-950">{user.username}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">ID {user.id}</p></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-5 py-4"><span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">{user.role}</span></td>
                      <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => beginEditUser(user)} className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-[#003366]">Edit</button><button type="button" onClick={() => handleDeleteUser(user)} disabled={deletingUserId === user.id} className="inline-flex h-9 items-center justify-center rounded-2xl border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70">{deletingUserId === user.id ? 'Deleting...' : 'Delete'}</button></div></td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-5 py-6 text-sm text-slate-500" colSpan="4">No users match the current search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{editingUser ? `Edit ${editingUser.username}` : 'Create user'}</h2>
            <p className="mt-1 text-sm text-slate-500">{editingUser ? 'Update account identity, role, or password. Leave password blank to keep the current one.' : 'Add a new account and assign the correct role for access control.'}</p>
          </div>
          <button type="button" onClick={resetUserForm} className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900">{editingUser ? 'Cancel edit' : 'Reset'}</button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleUserSubmit}>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700" htmlFor="user-username">Username</label><input id="user-username" type="text" required value={userForm.username} onChange={(event) => setUserForm((currentForm) => ({ ...currentForm, username: event.target.value }))} placeholder="Enter username" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10" /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700" htmlFor="user-email">Email</label><input id="user-email" type="email" required value={userForm.email} onChange={(event) => setUserForm((currentForm) => ({ ...currentForm, email: event.target.value }))} placeholder="name@umt.edu.my" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10" /></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700" htmlFor="user-password">Password</label><input id="user-password" type="password" minLength={editingUserId ? undefined : 8} required={!editingUserId} value={userForm.password} onChange={(event) => setUserForm((currentForm) => ({ ...currentForm, password: event.target.value }))} placeholder={editingUserId ? 'Leave blank to keep current password' : 'Set password'} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700" htmlFor="user-role">Role</label><select id="user-role" value={userForm.role} onChange={(event) => setUserForm((currentForm) => ({ ...currentForm, role: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10">{userRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</select></div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Access summary</p><p className="mt-2 text-sm text-slate-600">`ADMIN` can manage users and tickets. `STAFF` can manage tickets. `ASSIGNEE` appears in the ticket assignee dropdown and assigned work queue.</p><p className="mt-2 text-sm text-slate-500">Passwords must be at least 8 characters.</p></div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={resetUserForm} className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900">Clear</button><button type="submit" disabled={isSavingUser} className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70">{isSavingUser ? (editingUserId ? 'Saving...' : 'Creating...') : (editingUserId ? 'Save Changes' : 'Create User')}</button></div>
        </form>
      </div>
    </section>
  )
}
