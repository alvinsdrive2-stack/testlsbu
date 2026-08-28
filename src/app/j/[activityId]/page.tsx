import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { activityPhase } from "@/lib/activity-phase";
import { getParticipantToken } from "@/lib/session";
import { Reveal } from "@/components/ui/Reveal";
import { TopBar } from "@/components/ui/TopBar";
import { PageTransition } from "@/components/ui/PageTransition";
import { JoinForm } from "./JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { module: { select: { title: true } } },
  });

  if (!activity) notFound();

  const token = await getParticipantToken();
  if (token) {
    const participant = await prisma.participant.findUnique({
      where: { token },
      select: { activityId: true },
    });
    if (participant?.activityId === activityId) {
      redirect("/p");
    }
  }

  const phase = activityPhase(activity, new Date());

  // Pendaftaran tetap dibuka selama kegiatan berjalan (pretest/materi/posttest)
  // — peserta telat nyusul sesi yang sedang berjalan sesuai jadwal.
  if (phase === "SCHEDULED" || phase === "CLOSED") {
    const heading =
      phase === "SCHEDULED"
        ? "Pendaftaran belum dibuka"
        : "Kegiatan sudah ditutup";
    return (
      <div className="min-h-screen">
        <TopBar title={activity.title} />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6">
          <PageTransition className="w-full max-w-md">
            <div className="w-full rounded-[var(--radius-card)] border border-hairline bg-surface p-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
              <p className="label-eyebrow text-ink-secondary">
                {activity.title}
              </p>
              <p className="mt-3 text-h2 font-bold text-ink">{heading}</p>
              {phase === "SCHEDULED" && activity.registrationStart ? (
                <p className="mt-2 text-sm text-ink-secondary">
                  Dibuka{" "}
                  {activity.registrationStart.toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                  .
                </p>
              ) : (
                <p className="mt-2 text-sm text-ink-secondary">
                  Hubungi admin untuk info lebih lanjut.
                </p>
              )}
            </div>
          </PageTransition>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar title={activity.title} />
      <main className="mx-auto flex max-w-4xl items-center px-4 py-16 sm:px-6">
        <PageTransition className="grid w-full gap-8 md:grid-cols-2">
          <Reveal>
            <div>
              <p className="label-eyebrow text-ink-secondary">
                Pendaftaran Peserta
              </p>
              <h1 className="mt-3 text-[var(--text-h1)] font-bold leading-tight tracking-tight text-ink">
                {activity.title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-secondary">
                Modul {activity.module.title}. Silakan lengkapi data diri pada
                formulir di samping untuk memulai pretest.
              </p>
              {phase !== "REGISTRATION" ? (
                <p className="mt-3 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
                  Kegiatan sudah berjalan. Pendaftaran tetap dibuka — kamu akan
                  mengikuti sesi yang sedang berlangsung sesuai jadwal.
                </p>
              ) : null}
              <div className="mt-8 space-y-3 border-t border-hairline pt-6 text-[15px] text-ink-secondary">
                <p>1. Daftar dan kerjakan pretest</p>
                <p>2. Pelajari materi pelatihan</p>
                <p>3. Kerjakan posttest sampai lulus</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-8 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
              <JoinForm activityId={activity.id} />
            </div>
          </Reveal>
        </PageTransition>
      </main>
    </div>
  );
}
