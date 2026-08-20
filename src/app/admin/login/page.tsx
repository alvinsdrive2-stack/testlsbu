import { login } from "./actions";
import { Button } from "@/components/ui/Button";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-hairline bg-surface p-10 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt="Logo Gapensi"
            className="h-10 w-auto rounded-md"
          />
          <span className="text-lg font-bold leading-none tracking-tight text-accent">
            GAPENSI
          </span>
        </div>
        <p className="label-eyebrow mt-6 text-ink-secondary">Panel Admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
          Masuk ke Panel
        </h1>
        <form action={login} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base text-ink transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-flag">
              Password salah.
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>
      </div>
    </main>
  );
}
