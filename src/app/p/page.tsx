import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { activityPhase, PHASE_LABEL } from "@/lib/activity-phase";
import { getParticipantToken } from "@/lib/session";
import { AutoRefresh } from "./AutoRefresh";
import { ProfileMenu } from "./ProfileMenu";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import { Backdrop } from "@/components/ui/Backdrop";
import { Countdown } from "@/components/ui/Countdown";
import { PageTransition } from "@/components/ui/PageTransition";
import { videoEmbedUrl, youtubeVideoId } from "@/lib/video";
import { sanitizeMaterialHtml } from "@/lib/sanitize";
import { MaterialVideo } from "./MaterialVideo";
import { MaterialPdf } from "./MaterialPdf";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { QueryToast } from "@/components/ui/QueryToast";

export default async function ParticipantDashboardPage() {
  const token = await getParticipantToken();
  if (!token) {
    redirect("/login");
  }

  const participant = await prisma.participant.findUnique({
    where: { token },
    select: {
      nama: true,
      badanUsaha: true,
      npwp: true,
      wa: true,
      email: true,
      token: true,
      stage: true,
      certificateNumber: true,
      certificateIssuedAt: true,
      activity: {
        select: {
          id: true,
          title: true,
          registrationStart: true,
          pretestStart: true,
          materialStart: true,
          posttestStart: true,
          closedAt: true,
          module: {
            select: {
              id: true,
              title: true,
              materials: {
                select: {
                  id: true,
                  order: true,
                  title: true,
                  content: true,
                  videoUrl: true,
                  pdfUrl: true,
                },
              },
            },
          },
        },
      },
      attempts: {
        select: { section: true, score: true, passed: true, submittedAt: true },
      },
    },
  });

  if (!participant) {
    redirect("/login");
  }

  if (!participant.activity) {
    return (
      <div className="min-h-screen">
        <TopBar title="Dashboard" />
        <main className="px-6 py-10">
          <div className="mx-auto w-full max-w-md rounded-[var(--radius-card)] border border-hairline bg-surface p-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            <p className="label-eyebrow text-ink-secondary">Kegiatan tidak ditemukan</p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-secondary">
              Data kegiatan kamu tidak ditemukan. Kemungkinan kegiatan sudah dihapus
              admin. Hubungi admin untuk info lebih lanjut.
            </p>
          </div>
        </main>
      </div>
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

  const phase = activityPhase(activity, new Date());
  const materiOpen = phase === "MATERIAL";
  const materiDone = pretestDone && (phase === "MATERIAL" || phase === "POSTTEST");

  const stages = [
    { label: "Daftar", done: true },
    { label: "Pretest", done: pretestDone },
    { label: "Materi", done: materiDone },
    { label: "Posttest", done: postPassed },
  ];
  const doneCount = stages.filter((s) => s.done).length;
  const progress = doneCount * 25;
  const stageLabel = `${stages[doneCount - 1].label} · ${doneCount} dari 4`;

  const fmt = (d: Date | null) =>
    d
      ? d.toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  const scheduleRows: { label: string; date: Date | null }[] = [
    { label: "Pendaftaran", date: activity.registrationStart },
    { label: "Pretest", date: activity.pretestStart },
    { label: "Materi dibuka", date: activity.materialStart },
    { label: "Posttest", date: activity.posttestStart },
    { label: "Tutup", date: activity.closedAt },
  ].filter((r) => r.date !== null);

  let cta: React.ReactNode = null;
  if (postPassed) {
    cta = (
      <span className="inline-flex items-center gap-2 rounded-md bg-success-soft px-3 py-1.5 text-[15px] font-semibold text-success">
        <span aria-hidden className="size-2 rounded-full bg-success" />
        Lulus posttest
      </span>
    );
  } else if (phase === "CLOSED") {
    cta = (
      <p className="text-[15px] leading-relaxed text-ink-secondary">
        Kegiatan sudah ditutup. Hubungi admin untuk info lebih lanjut.
      </p>
    );
  } else if (phase === "POSTTEST") {
    cta = pretestDone ? (
      <Button href={`/t/${participant.token}`}>Kerjakan Posttest</Button>
    ) : (
      <p className="text-[15px] leading-relaxed text-ink-secondary">
        Kamu belum menyelesaikan pretest dan kegiatan sudah lanjut ke tahap
        posttest. Hubungi admin.
      </p>
    );
  } else if (phase === "PRETEST") {
    if (pretestDone) {
      cta = (
        <p className="text-[15px] leading-relaxed text-ink-secondary">
          Pretest kamu selesai. Materi dibuka setelah sesi pretest berakhir.
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
  } else if (pretestDone) {
    cta = (
      <p className="text-[15px] leading-relaxed text-ink-secondary">
        Pelajari materi di bawah. Posttest dibuka sesuai jadwal kegiatan.
      </p>
    );
  } else {
    cta = (
      <p className="text-[15px] leading-relaxed text-ink-secondary">
        Pretest belum dibuka. Tunggu jadwal dari admin, atau hubungi admin untuk
        info lebih lanjut.
      </p>
    );
  }

  const menu = [
    { label: "Dashboard", href: "/p", active: true },
    { label: "Nilai Pretest", href: "#nilai", active: false },
    { label: "Materi", href: "#materi", active: false },
    {
      label: "Posttest",
      href:
        phase === "POSTTEST" && pretestDone
          ? `/t/${participant.token}`
          : "#",
      active: false,
    },
  ];

  const boundaries = [
    activity.registrationStart,
    activity.pretestStart,
    activity.materialStart,
    activity.posttestStart,
    activity.closedAt,
  ]
    .filter((d): d is Date => d !== null)
    .map((d) => d.toISOString())
    .join(",");

  return (
    <div className="min-h-screen">
      <AutoRefresh boundaries={boundaries} />
      <QueryToast success={{ joined: "Pendaftaran berhasil. Selamat datang!" }} />
      <Backdrop />
      <TopBar
        title={activity.title}
        right={<ProfileMenu nama={participant.nama} />}
      />

      <main>
        <PageTransition className="mx-auto grid max-w-[1843px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* Kolom kiri: menu + progress + nilai/posttest/profil */}
        <aside className="order-2 space-y-4 md:order-1 md:sticky md:top-20 md:self-start">
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
              {!pretestDone &&
              activity.pretestStart &&
              (phase === "SCHEDULED" || phase === "REGISTRATION") ? (
                <div className="mt-3 border-t border-hairline pt-3">
                  <p className="text-[13px] text-ink-secondary">
                    Dibuka {fmt(activity.pretestStart)} WIB
                  </p>
                  <p className="mt-0.5 text-[15px]">
                    <Countdown target={activity.pretestStart.toISOString()} />
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-5 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
              <p className="label-eyebrow text-ink-secondary">Posttest</p>
              {postPassed ? (
                <p className="mt-2 text-[15px] font-semibold text-success">
                  Sudah lulus
                </p>
              ) : phase === "POSTTEST" ? (
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
              ) : phase === "CLOSED" ? (
                <p className="mt-2 text-[15px] text-ink-secondary">
                  Kegiatan sudah ditutup
                </p>
              ) : activity.posttestStart ? (
                <div className="mt-2">
                  <p className="text-[13px] text-ink-secondary">
                    Dibuka {fmt(activity.posttestStart)} WIB
                  </p>
                  <p className="mt-0.5 text-[15px]">
                    <Countdown target={activity.posttestStart.toISOString()} />
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-[15px] text-ink-secondary">
                  Dibuka sesuai jadwal kegiatan
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
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(29px,3vw,41px)] font-bold tracking-tight text-ink">
                {activity.title}
              </h1>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                <span aria-hidden className="size-1.5 rounded-full bg-current" />
                {PHASE_LABEL[phase]}
              </span>
            </div>
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

            {scheduleRows.length > 0 ? (
              <div className="mt-6 border-t border-hairline pt-5">
                <p className="label-eyebrow text-ink-secondary">
                  Jadwal kegiatan (WIB)
                </p>
                <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {scheduleRows.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2 sm:border-0 sm:pb-0"
                    >
                      <dt className="text-[14px] text-ink-secondary">{r.label}</dt>
                      <dd className="text-[14px] font-medium tabular-nums text-ink">
                        {fmt(r.date)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </section>

          <section id="materi" className="mt-8 scroll-mt-16">
            <div className="border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)] sm:p-8">
              <p className="label-eyebrow text-ink-secondary">
                {participant.certificateNumber ? "Sertifikat" : "Materi"}
              </p>
              {participant.certificateNumber ? (
                <div className="mt-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[17px] font-semibold text-ink">
                        Sertifikat Kelulusan
                      </p>
                      <p className="mt-1 text-[15px] text-ink-secondary">
                        Nomor: {participant.certificateNumber}
                      </p>
                      {participant.certificateIssuedAt ? (
                        <p className="mt-1 text-[13px] text-ink-secondary">
                          Diterbitkan{" "}
                          {participant.certificateIssuedAt.toLocaleDateString("id-ID", {
                            dateStyle: "long",
                          })}
                        </p>
                      ) : null}
                    </div>
                    <Button href={`/api/certificate/${participant.token}?download=1`}>
                      Download Sertifikat
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-md border border-hairline">
                    <iframe
                      src={`/api/certificate/${participant.token}`}
                      className="h-[800px] w-full"
                      title="Sertifikat"
                    />
                  </div>
                </div>
              ) : !materiOpen ? (
                <div className="mt-4 flex items-start gap-4">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-md bg-canvas text-ink-secondary"
                  >
                    <svg viewBox="0 0 24 24" className="size-5">
                      <path
                        d="M7 10V7a5 5 0 0 1 10 0v3m-11 0h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[clamp(21px,2vw,29px)] font-bold tracking-tight">
                      {phase === "POSTTEST" || phase === "CLOSED"
                        ? "Sesi materi sudah berakhir"
                        : "Materi belum dibuka"}
                    </h2>
                    {phase === "POSTTEST" || phase === "CLOSED" ? (
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-secondary">
                        Sesi materi kegiatan ini sudah ditutup sesuai jadwal.
                      </p>
                    ) : activity.materialStart ? (
                      <>
                        <p className="mt-1 text-[15px] leading-relaxed text-ink-secondary">
                          Materi dibuka{" "}
                          {activity.materialStart.toLocaleString("id-ID", {
                            timeZone: "Asia/Jakarta",
                            dateStyle: "full",
                            timeStyle: "short",
                          })}{" "}
                          WIB.
                        </p>
                        <div className="mt-3 border-t border-hairline pt-3">
                          <p className="text-[13px] text-ink-secondary">
                            Dibuka dalam
                          </p>
                          <p className="mt-0.5 text-[15px] font-medium">
                            <Countdown
                              target={activity.materialStart.toISOString()}
                            />
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-secondary">
                        Materi menunggu jadwal dari admin.
                      </p>
                    )}
                  </div>
                </div>
              ) : activity.module.materials.length === 0 ? (
                <p className="mt-4 text-[15px] text-ink-secondary">
                  Belum ada materi dari admin.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-hairline">
                {activity.module.materials
                  .sort((a, b) => a.order - b.order)
                  .map((m, i) => {
                    const embed = m.videoUrl ? videoEmbedUrl(m.videoUrl) : null;
                    const ytId = m.videoUrl ? youtubeVideoId(m.videoUrl) : null;
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
                            {m.videoUrl && ytId ? (
                              <div className="mt-6">
                                <YouTubeEmbed
                                  videoId={ytId}
                                  watchUrl={m.videoUrl}
                                />
                              </div>
                            ) : null}
                            {m.videoUrl && embed && !ytId ? (
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
                              <div className="mt-6">
                                <MaterialVideo src={m.videoUrl} title={m.title} />
                              </div>
                            ) : null}
                            {m.pdfUrl ? (
                              <div className="mt-6">
                                <MaterialPdf src={m.pdfUrl} title={`PDF ${m.title}`} />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
        </PageTransition>

      </main>
    </div>
  );
}
