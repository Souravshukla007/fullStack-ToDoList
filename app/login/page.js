import { redirect } from "next/navigation";
import { login } from "../auth-actions";
import { getSessionUserId } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const userId = await getSessionUserId();
  if (userId) redirect("/");

  const params = await Promise.resolve(searchParams || {});
  const error = params?.error || "";
  const success = params?.success || "";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/assets/icons/login.jpg')",
      }}
    >
      <section className="w-full max-w-md rounded-3xl border border-white/45 bg-white/20 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        <h1 className="mb-1 text-center text-5xl font-extrabold tracking-tight text-slate-900">Login</h1>
        <p className="mb-5 text-center text-lg text-slate-100">Enter Your Credentials</p>

        {success ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2 text-center text-sm font-medium text-emerald-700">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">{error}</p>
        ) : null}

        <form action={login} className="space-y-3">
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
            placeholder="Password"
            className="w-full rounded-2xl border border-white/45 bg-white/30 px-4 py-3 text-slate-900 placeholder:text-slate-600 outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
            required
          />

          <div className="flex items-center justify-between px-1 text-sm">
            <label className="animated-checkbox flex items-center gap-2 text-slate-100">
              <input type="checkbox" name="rememberMe" value="true" />
              <div className="animated-checkbox__mark" />
              <span>Remember me</span>
            </label>
            <a href="#" className="font-medium text-indigo-100 hover:text-indigo-200">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-2xl font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95"
          >
            Login
          </button>
        </form>

        <div className="my-5 flex items-center gap-4 text-slate-200">
          <div className="h-px flex-1 bg-white/45" />
          <span className="text-sm">or Log In with</span>
          <div className="h-px flex-1 bg-white/45" />
        </div>

        <p className="text-center text-lg text-slate-100">
          Don&apos;t have an account yet?{" "}
          <a href="/signup" className="font-semibold text-indigo-100 hover:text-indigo-200">
            Sign Up
          </a>
        </p>
      </section>
    </main>
  );
}
