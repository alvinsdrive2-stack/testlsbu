import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { ExamResult } from "@/app/exam/ExamResult";

function youtubeEmbed(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default async function ParticipantDashboardPage() {
  const token = await getParticipantToken();
  if (!token) {
    return (
      <ExamResult
        title="Sesi tidak ditemukan"
        body="Buka kembali link kegiatan yang diberikan admin untuk mendaftar."
      />
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: {
      activity: { include: { module: { include: { materials: true } } } },
      attempts: { select: { section: true, score: true, passed: true } },
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
  const postPassed = participant.attempts.some(
    (a) => a.section === "POSTTEST" && a.passed
  );

  return (
    <main className="min-h-screen py-12">
      <div className="mx-auto max-w-2xl space-y-6 px-6">
        <div>
          <h1 className="text-[var(--text-hero)] font-semibold tracking-tight">
            {participant.nama}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {activity.title} · {activity.module.title}
          </p>
        </div>

        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-ink-secondary">Nilai pretest</p>
            <p className="text-h1 font-semibold">
              {pretestScore !== null ? pretestScore : "Belum dikerjakan"}
            </p>
          </div>
          {postPassed ? (
            <p className="rounded-full bg-highlight/20 px-4 py-1 text-sm font-medium text-[#8a6d00]">
              Lulus posttest
            </p>
          ) : activity.status === "POSTTEST_OPEN" ? (
            <p className="text-sm text-ink-secondary">
              Posttest dibuka — gunakan link dari admin
            </p>
          ) : null}
        </Card>

        <section>
          <h2 className="text-h1 font-semibold">Materi</h2>
          {activity.module.materials.length === 0 ? (
            <p className="mt-2 text-sm text-ink-secondary">
              Belum ada materi dari admin.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {activity.module.materials
                .sort((a, b) => a.order - b.order)
                .map((m) => {
                  const embed = m.videoUrl ? youtubeEmbed(m.videoUrl) : null;
                  return (
                    <Card key={m.id} className="p-6">
                      <p className="text-h2 font-semibold">{m.title}</p>
                      <div className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">
                        {m.content}
                      </div>
                      {embed ? (
                        <div className="mt-4 aspect-video overflow-hidden rounded-xl">
                          <iframe
                            src={embed}
                            title={m.title}
                            allowFullScreen
                            className="h-full w-full"
                          />
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
