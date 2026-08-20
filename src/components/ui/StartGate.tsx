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
    <main className="flex min-h-screen items-center justify-center bg-accent px-6">
      <div className="w-full max-w-md text-center">
        <p className="label-eyebrow text-highlight">{eyebrow}</p>
        <h1 className="mt-4 text-[var(--text-hero)] font-bold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-white/70">{activity}</p>
        <div className="mt-8 flex justify-center gap-8 border-y border-white/15 py-4 text-sm text-white/80">
          <span>Durasi {durationMin} menit</span>
          <span>{questionCount} soal</span>
        </div>
        <p className="mt-4 text-sm text-white/60">
          Jawaban tersimpan otomatis. Waktu berjalan begitu kamu mulai.
        </p>
        {children}
      </div>
    </main>
  );
}
