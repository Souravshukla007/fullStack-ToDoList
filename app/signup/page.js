import { redirect } from "next/navigation";
import { signup } from "../auth-actions";
import { getSessionUserId } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }) {
  const userId = await getSessionUserId();
  if (userId) redirect("/");

  const params = await Promise.resolve(searchParams || {});
  const error = params?.error || "";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/assets/icons/signup.jpg')",
      }}
    >
      <section className="w-full max-w-md rounded-3xl border border-white/45 bg-white/20 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        <h1 className="mb-1 text-center text-5xl font-extrabold tracking-tight text-slate-900">Sign Up</h1>
        <p className="mb-5 text-center text-lg text-slate-100">Create a New Account</p>

        {error ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">{error}</p>
        ) : null}

        <form action={signup} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full name"
            className="w-full rounded-2xl border border-white/45 bg-white/30 px-4 py-3 text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full rounded-2xl border border-white/45 bg-white/30 px-4 py-3 text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 chars)"
            className="w-full rounded-2xl border border-white/45 bg-white/30 px-4 py-3 text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
            required
          />
          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-2xl font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-5 text-center text-lg text-slate-100">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-indigo-100 hover:text-indigo-200">
            Login
          </a>
        </p>
      </section>
    </main>
  );
}
