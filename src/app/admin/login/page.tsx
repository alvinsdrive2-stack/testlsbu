import { login } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-4">
      <div className="w-full max-w-sm border border-white/20 p-10">
        <p className="label-eyebrow text-highlight">Gapensi · Admin</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Masuk ke Panel
        </h1>
        <form action={login} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-white/60"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-[15px] text-white placeholder:text-white/40 focus:border-highlight focus:outline-none"
            />
          </div>
          {error ? (
            <p className="text-sm text-highlight">Password salah.</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-md bg-highlight py-2.5 font-semibold text-accent transition-colors hover:bg-highlight-hover hover:text-white"
          >
            Masuk
          </button>
        </form>
      </div>
    </main>
  );
}
