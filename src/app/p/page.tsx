import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { ExamResult } from "@/app/exam/ExamResult";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

function youtubeEmbed(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function PhaseStepper({
  pretestDone,
  postPassed,
}: {
  pretestDone: boolean;
  postPassed: boolean;
}) {
  const steps = [
    { label: "Daftar", done: true },
    { label: "Pretest", done: pretestDone },
    { label: "Materi", done: pretestDone },
    { label: "Posttest", done: postPassed },
  ];

  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className={`size-2 rounded-full ${
                s.done ? "bg-highlight" : "border border-white/40 bg-transparent"
              }`}
            />
            <span
              className={`text-sm ${s.done ? "font-medium text-white" : "text-white/60"}`}
            >
              {s.label}
            </span>
          </span>
          {i < steps.length - 1 ? (
            <span aria-hidden className="h-px w-6 bg-white/25" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export default async function ParticipantDashboardPage() {
  const token = await getParticipantToken();
  if (!token) {
    return (
      <ExamResult
        title="Sesi tidak ditemukan"
        body="Sesi kamu berakhir atau kedaluwarsa. Buka ulang link kegiatan dari admin, lalu daftar lagi dengan data yang sama."
      />
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: {
      activity: { include: { module: { include: { materials: true } } } },
      attempts: {
        select: { section: true, score: true, passed: true, submittedAt: true },
      },
    },
  });

  if (!participant) {
    return (
      <ExamResult
        title="Sesi tidak valid"
        body="Hubungi admin untuk mendapatkan link kegiatan."
      />
    );
  }

  const activity = participant.activity;
  const pretestScores = participant.attempts
    .filter((a) => a.section === "PRETEST" && a.score !== null)
    .map((a) => a.score!);
  const pretestScore = pretestScores.length ? Math.max(...pretestScores) : null;
  const pretestDone = pretestScore !== null;
  const postPassed = participant.attempts.some(
    (a) => a.section === "POSTTEST" && a.passed
  );

  return (
    <main className="min-h-screen">
      <Reveal>
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="label-eyebrow text-flag">Dashboard Peserta</p>
          <h1 className="mt-3 text-[var(--text-h1)] font-bold tracking-tight">
            {participant.nama}
          </h1>
          <p className="mt-2 text-base text-ink-secondary">
            {activity.title} · {activity.module.title}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <section className="bg-accent">
          <div className="mx-auto max-w-2xl px-6 py-14">
          <PhaseStepper pretestDone={pretestDone} postPassed={postPassed} />

          <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label-eyebrow text-white/60">Nilai pretest</p>
              <p className="mt-1 text-[var(--text-h1)] font-bold tabular-nums text-white">
                {pretestScore !== null ? pretestScore : "—"}
                {pretestScore !== null ? (
                  <span className="text-lg font-medium text-white/60">
                    {" "}
                    / 100
                  </span>
                ) : null}
              </p>
              {pretestScore === null ? (
                <p className="text-sm text-white/60">Belum dikerjakan</p>
              ) : null}
            </div>
            {postPassed ? (
              <p className="border border-highlight px-4 py-1.5 text-sm font-semibold text-highlight">
                Lulus posttest
              </p>
            ) : null}
          </div>

          <div className="mt-8">
            {postPassed ? null : activity.status === "CLOSED" ? (
              <p className="text-sm leading-relaxed text-white/70">
                Kegiatan sudah ditutup. Hubungi admin untuk info lebih lanjut.
              </p>
            ) : activity.status === "POSTTEST_OPEN" ? (
              pretestDone ? (
                <Button variant="highlight" href={`/t/${participant.token}`}>
                  Kerjakan Posttest
                </Button>
              ) : (
                <p className="text-sm leading-relaxed text-white/70">
                  Kamu belum menyelesaikan pretest dan kegiatan sudah lanjut ke
                  tahap posttest. Hubungi admin.
                </p>
              )
            ) : pretestDone ? (
              <p className="text-sm leading-relaxed text-white/70">
                Pelajari materi di bawah. Posttest dibuka setelah admin
                mengakhiri sesi pretest.
              </p>
            ) : (
              <Button
                variant="highlight"
                href={`/j/${activity.id}/pretest`}
              >
                {participant.attempts.some(
                  (a) => a.section === "PRETEST" && !a.submittedAt
                )
                  ? "Lanjut Pretest"
                  : "Mulai Pretest"}
              </Button>
            )}
          </div>
        </div>
        </section>
      </Reveal>

      <Reveal delay={120}>
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="text-h2 font-bold">Materi</h2>
        {activity.module.materials.length === 0 ? (
          <p className="mt-4 text-sm text-ink-secondary">
            Belum ada materi dari admin.
          </p>
        ) : (
          <div className="mt-8 divide-y divide-hairline border-t border-hairline">
            {activity.module.materials
              .sort((a, b) => a.order - b.order)
              .map((m, i) => {
                const embed = m.videoUrl ? youtubeEmbed(m.videoUrl) : null;
                return (
                  <article key={m.id} className="py-10">
                    <div className="flex gap-4">
                      <span className="label-eyebrow w-8 shrink-0 pt-1 text-flag">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-h2 font-semibold">{m.title}</h3>
                        <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-secondary">
                          {m.content}
                        </div>
                        {embed ? (
                          <div className="mt-6 aspect-video overflow-hidden rounded-md border border-hairline">
                            <iframe
                              src={embed}
                              title={m.title}
                              allowFullScreen
                              className="h-full w-full"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>
      </Reveal>
    </main>
  );
}
