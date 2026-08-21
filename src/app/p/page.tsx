import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { ExamResult } from "@/app/exam/ExamResult";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import { Backdrop } from "@/components/ui/Backdrop";
import { PageTransition } from "@/components/ui/PageTransition";
import { videoEmbedUrl } from "@/lib/video";
import { sanitizeMaterialHtml } from "@/lib/sanitize";

function initials(nama: string): string {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

  const stage = participant.stage;
  const progress =
    stage === "POSTTEST_PASSED" ? 100 : stage === "PRETEST_DONE" ? 50 : 25;
  const stageLabel =
    stage === "POSTTEST_PASSED"
      ? "Posttest lulus · 4 dari 4"
      : stage === "PRETEST_DONE"
        ? "Pretest selesai · 3 dari 4"
        : "Terdaftar · 2 dari 4";

  const stages = [
    { label: "Daftar", done: true },
    { label: "Pretest", done: pretestDone },
    { label: "Materi", done: pretestDone },
    { label: "Posttest", done: postPassed },
  ];

  let cta: React.ReactNode = null;
  if (postPassed) {
    cta = (
      <span className="inline-flex items-center gap-2 rounded-md bg-success-soft px-3 py-1.5 text-[15px] font-semibold text-success">
        <span aria-hidden className="size-2 rounded-full bg-success" />
        Lulus posttest
      </span>
    );
  } else if (activity.status === "CLOSED") {
    cta = (
      <p className="text-[15px] leading-relaxed text-ink-secondary">
        Kegiatan sudah ditutup. Hubungi admin untuk info lebih lanjut.
      </p>
    );
  } else if (activity.status === "POSTTEST_OPEN") {
    cta = pretestDone ? (
      <Button href={`/t/${participant.token}`}>Kerjakan Posttest</Button>
    ) : (
      <p className="text-[15px] leading-relaxed text-ink-secondary">
        Kamu belum menyelesaikan pretest dan kegiatan sudah lanjut ke tahap
        posttest. Hubungi admin.
      </p>
    );
  } else if (pretestDone) {
    cta = (
      <p className="text-[15px] leading-relaxed text-ink-secondary">
        Pelajari materi di bawah. Posttest dibuka setelah admin mengakhiri sesi
        pretest.
      </p>
    );
  } else {
    const hasActive = participant.attempts.some(
      (a) => a.section === "PRETEST" && !a.submittedAt
    );
    cta = (
      <Button href={`/j/${activity.id}/pretest`}>
        {hasActive ? "Lanjut Pretest" : "Mulai Pretest"}
      </Button>
    );
  }

  const menu = [
    { label: "Dashboard", href: "/p", active: true },
    { label: "Nilai Pretest", href: "#nilai", active: false },
    { label: "Materi", href: "#materi", active: false },
    {
      label: "Posttest",
      href:
        activity.status === "POSTTEST_OPEN" && pretestDone
          ? `/t/${participant.token}`
          : "#",
      active: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <Backdrop />
      <TopBar
        title={activity.title}
        right={
          <span className="hidden items-center gap-2.5 sm:flex">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full border-[3px] border-ink bg-accent text-[13px] font-bold text-white"
            >
              {initials(participant.nama)}
            </span>
            <span className="text-[15px] font-medium">{participant.nama}</span>
          </span>
        }
      />

      <main>
        <PageTransition className="mx-auto grid max-w-[1843px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* Kolom kiri: menu + progress + nilai/posttest/profil */}
        <aside className="order-2 space-y-4 md:order-1 md:sticky md:top-20">
          <nav className="hidden rounded-[var(--radius-card)] border border-hairline bg-surface p-2 shadow-[0_1px_3px_rgba(15,20,25,0.06)] md:block">
              {menu.map((m) => (
                <a
                  key={m.label}
                  href={m.href}
                  aria-current={m.active ? "page" : undefined}
                  className={`block rounded-md px-3 py-2.5 text-center text-[15px] font-medium transition-colors ${
                    m.active
                      ? "bg-accent-soft text-accent"
                      : "text-ink-secondary hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {m.label}
                </a>
              ))}
            </nav>

            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-4 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
              <p className="label-eyebrow text-ink-secondary">Progres</p>
              <ol className="mt-3 space-y-2.5">
                {stages.map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className={`size-2 shrink-0 rounded-full ${
                        s.done ? "bg-success" : "border border-hairline-strong bg-surface"
                      }`}
                    />
                    <span
                      className={`text-[15px] ${
                        s.done ? "font-medium" : "text-ink-secondary"
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-5 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
              <p className="label-eyebrow text-ink-secondary">Nilai Pretest</p>
              <p className="mt-2 text-[clamp(29px,3vw,41px)] font-bold tabular-nums text-accent">
                {pretestScore !== null ? pretestScore : "—"}
                {pretestScore !== null ? (
                  <span className="text-[19px] font-medium text-ink-secondary">
                    {" "}
                    / 100
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-[15px] text-ink-secondary">
                {pretestScore === null
                  ? "Belum dikerjakan"
                  : pretestScores.length > 1
                    ? `Terbaik dari ${pretestScores.length} percobaan`
                    : "Sudah dikerjakan"}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-5 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
              <p className="label-eyebrow text-ink-secondary">Posttest</p>
              {postPassed ? (
                <p className="mt-2 text-[15px] font-semibold text-success">
                  Sudah lulus
                </p>
              ) : activity.status === "POSTTEST_OPEN" ? (
                pretestDone ? (
                  <p className="mt-2 text-[15px] font-medium">
                    Siap dikerjakan —{" "}
                    <a
                      href={`/t/${participant.token}`}
                      className="text-accent hover:underline"
                    >
                      buka link
                    </a>
                  </p>
                ) : (
                  <p className="mt-2 text-[15px] text-ink-secondary">
                    Tunggu pretest selesai
                  </p>
                )
              ) : (
                <p className="mt-2 text-[15px] text-ink-secondary">
                  Dibuka setelah sesi pretest berakhir
                </p>
              )}
            </div>

        </aside>

        {/* Kolom tengah: status + materi */}
        <div className="order-1 min-w-0 md:order-2">
          <section
            id="nilai"
            className="border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)] sm:p-8"
          >
            <p className="label-eyebrow text-ink-secondary">Status kegiatan</p>
            <h1 className="mt-2 text-[clamp(29px,3vw,41px)] font-bold tracking-tight text-ink">
              {activity.title}
            </h1>
            <p className="mt-1 text-[17px] text-ink-secondary">
              {activity.module.title}
            </p>

            <div className="mt-6">
              <div
                className="h-2 overflow-hidden rounded-full bg-canvas"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progres kegiatan"
              >
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-[13px] font-medium text-ink-secondary">
                {stageLabel}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">{cta}</div>
          </section>

          <section id="materi" className="mt-8 scroll-mt-16">
            <h2 className="text-[clamp(21px,2vw,29px)] font-bold">Materi</h2>
            {activity.module.materials.length === 0 ? (
              <p className="mt-4 text-[15px] text-ink-secondary">
                Belum ada materi dari admin.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-hairline border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
                {activity.module.materials
                  .sort((a, b) => a.order - b.order)
                  .map((m, i) => {
                    const embed = m.videoUrl ? videoEmbedUrl(m.videoUrl) : null;
                    const isLegacyPlainText = !/[<>]/.test(m.content);
                    return (
                      <article key={m.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[15px] font-semibold tabular-nums text-accent"
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 w-full">
                            <h3 className="text-[clamp(21px,2vw,29px)] font-semibold">{m.title}</h3>
                            {isLegacyPlainText ? (
                              <div className="mt-3 whitespace-pre-wrap text-[16px] leading-relaxed text-ink-secondary">
                                {m.content}
                              </div>
                            ) : (
                              <div
                                className="prose-gapensi mt-3 text-[16px] leading-relaxed text-ink-secondary"
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeMaterialHtml(m.content),
                                }}
                              />
                            )}
                            {m.videoUrl && embed ? (
                              <div className="mt-6 aspect-video overflow-hidden rounded-md border border-hairline">
                                <iframe
                                  src={embed}
                                  title={m.title}
                                  allowFullScreen
                                  className="h-full w-full"
                                />
                              </div>
                            ) : null}
                            {m.videoUrl && !embed ? (
                              <video
                                controls
                                preload="metadata"
                                src={m.videoUrl}
                                className="mt-6 aspect-video w-full rounded-md border border-hairline"
                              />
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}
          </section>
        </div>
        </PageTransition>

      </main>
    </div>
  );
}
