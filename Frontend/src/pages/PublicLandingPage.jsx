import { AlertCircle } from "lucide-react"
import MiniStat from "../components/MiniStat"

export default function PublicLandingPage({
    authError,
    categoryMeta,
    categoryOptions,
    form,
    handleLoginSubmit,
    handleSubmit,
    isLoggingIn,
    isSubmitting,
    loginForm,
    onLoginFormChange,
    onPublicFormChange,
    submitNotice,
    error,
}) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.12),_transparent_24%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_50%,_#f7fafc_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 rounded-[36px] border border-white/70 bg-[#003366] px-8 py-10 text-white shadow-[0_32px_100px_rgba(15,23,42,0.14)] sm:px-10 lg:px-12">
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#FFCC00]">
                        Universiti Malaysia Terengganu
                    </p>
                    <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight">
                        I-Kampus
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
                        Submit campus support requests directly without signing
                        in. Staff and admin users can still access the
                        operations workspace from the login panel.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
                        <div className="border-b border-slate-200/80 pb-6">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">
                                Public Ticket Submission
                            </p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                                Report an issue
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                                Share your contact details and issue summary so
                                the support team can route the request to the
                                correct department.
                            </p>
                        </div>

                        {submitNotice ? (
                            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                {submitNotice}
                            </div>
                        ) : null}
                        {error ? (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        <form
                            className="mt-6 space-y-5"
                            onSubmit={handleSubmit}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-medium text-slate-700"
                                        htmlFor="public-requester-name"
                                    >
                                        Your name
                                    </label>
                                    <input
                                        id="public-requester-name"
                                        type="text"
                                        required
                                        value={form.requesterName}
                                        onChange={(event) =>
                                            onPublicFormChange(
                                                "requesterName",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter your full name"
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-medium text-slate-700"
                                        htmlFor="public-requester-email"
                                    >
                                        Email address
                                    </label>
                                    <input
                                        id="public-requester-email"
                                        type="email"
                                        required
                                        value={form.requesterEmail}
                                        onChange={(event) =>
                                            onPublicFormChange(
                                                "requesterEmail",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="name@umt.edu.my"
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium text-slate-700"
                                    htmlFor="public-title"
                                >
                                    Title
                                </label>
                                <input
                                    id="public-title"
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={(event) =>
                                        onPublicFormChange(
                                            "title",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Example: Lab 2 Wi-Fi disconnected during class"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                                />
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-medium text-slate-700"
                                        htmlFor="public-category"
                                    >
                                        Department
                                    </label>
                                    <select
                                        id="public-category"
                                        value={form.category}
                                        onChange={(event) =>
                                            onPublicFormChange(
                                                "category",
                                                event.target.value,
                                            )
                                        }
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                                    >
                                        {categoryOptions.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Routed department
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {
                                            categoryMeta[form.category]
                                                ?.department
                                        }
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {categoryMeta[form.category]?.sla}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium text-slate-700"
                                    htmlFor="public-description"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="public-description"
                                    required
                                    rows="6"
                                    value={form.description}
                                    onChange={(event) =>
                                        onPublicFormChange(
                                            "description",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Describe the issue, exact location, impact on campus operations, and any urgent safety or teaching risks."
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                                />
                            </div>
                            <div className="grid gap-4 rounded-3xl bg-slate-50 p-4 sm:grid-cols-3">
                                <MiniStat
                                    label="Department"
                                    value={
                                        categoryMeta[form.category]
                                            ?.serviceLabel
                                    }
                                />
                                <MiniStat
                                    label="Default location"
                                    value={
                                        categoryMeta[form.category]?.location
                                    }
                                />
                                <MiniStat
                                    label="Response target"
                                    value={categoryMeta[form.category]?.sla}
                                />
                            </div>
                            <div className="flex justify-end border-t border-slate-200 pt-5">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isSubmitting
                                        ? "Submitting..."
                                        : "Submit Ticket"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="space-y-6">
                        <article className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#003366]/70">
                                Staff & Admin Access
                            </p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                                Sign in to the console
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Use your username or email and password to
                                access ticket operations, dispatching, assigned
                                work queues, and user management.
                            </p>
                            {authError ? (
                                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{authError}</span>
                                </div>
                            ) : null}
                            <form
                                className="mt-8 space-y-5"
                                onSubmit={handleLoginSubmit}
                            >
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-medium text-slate-700"
                                        htmlFor="login"
                                    >
                                        Email or username
                                    </label>
                                    <input
                                        id="login"
                                        type="text"
                                        required
                                        value={loginForm.login}
                                        onChange={(event) =>
                                            onLoginFormChange(
                                                "login",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="admin@umt.edu.my"
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-sm font-medium text-slate-700"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={loginForm.password}
                                        onChange={(event) =>
                                            onLoginFormChange(
                                                "password",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter your password"
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoggingIn}
                                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#003366] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,51,102,0.22)] transition hover:bg-[#0a4278] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isLoggingIn ? "Signing in..." : "Sign In"}
                                </button>
                            </form>
                        </article>
                        <article className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
                            <h2 className="text-lg font-semibold text-slate-950">
                                Available departments
                            </h2>
                            <div className="mt-4 grid gap-3">
                                {categoryOptions.map((category) => (
                                    <div
                                        key={category}
                                        className="rounded-2xl bg-slate-50 px-4 py-4"
                                    >
                                        <p className="text-sm font-semibold text-slate-900">
                                            {category}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {categoryMeta[category]?.department}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>
                </div>
            </div>
        </div>
    )
}
