import { PageTransition } from "@/components/ui/PageTransition";

export function StartGate({
  eyebrow,
  title,
  activity,
  durationMin,
  questionCount,
  children,
}: {
  eyebrow: string;
  title: string;
  activity: string;
  durationMin: number;
  questionCount: number;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-16">
      <PageTransition className="w-full max-w-md">
        <div className="w-full rounded-[var(--radius-card)] border border-hairline bg-surface p-10 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
        <p className="label-eyebrow text-ink-secondary">{eyebrow}</p>
        <h1 className="mt-3 text-[var(--text-h1)] font-bold tracking-tight text-accent">
          {title}
        </h1>
        <p className="mt-2 text-base text-ink-secondary">{activity}</p>
        <div className="mt-6 flex gap-2 border-t border-hairline pt-6 text-sm text-ink-secondary">
          <span className="rounded-md border border-hairline-strong px-3 py-1.5">
            Durasi {durationMin} menit
          </span>
          <span className="rounded-md border border-hairline-strong px-3 py-1.5">
            {questionCount} soal
          </span>
        </div>
        <p className="mt-4 text-sm text-ink-secondary">
          Jawaban tersimpan otomatis. Waktu berjalan begitu Anda mulai.
        </p>
        {children}
        </div>
      </PageTransition>
    </main>
  );
}
