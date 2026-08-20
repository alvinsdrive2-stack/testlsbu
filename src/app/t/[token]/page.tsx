import { prisma } from "@/lib/prisma";
import { shuffleWithSeed, deadlineFor } from "@/lib/exam";
import { finalizeAttempt } from "@/app/exam/actions";
import { ExamRunner } from "@/app/exam/ExamRunner";
import { ExamResult } from "@/app/exam/ExamResult";
import { Button } from "@/components/ui/Button";
import { StartGate } from "@/components/ui/StartGate";
import { TopBar } from "@/components/ui/TopBar";
import { PageTransition } from "@/components/ui/PageTransition";
import { startPosttestRetry } from "./actions";

const CARD =
  "rounded-[var(--radius-card)] border border-hairline bg-surface p-10 shadow-[0_1px_3px_rgba(15,20,25,0.06)]";

function PosttestFailed({
  score,
  passingGrade,
  attempt,
  token,
}: {
  score: number;
  passingGrade: number;
  attempt: number;
  token: string;
}) {
  const gap = Math.max(0, passingGrade - score);
  return (
    <div className="min-h-screen">
      <TopBar title="Posttest" />
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-16">
        <div className={`${CARD} w-full max-w-md text-center`}>
          <p className="label-eyebrow text-ink-secondary">Nilai Posttest</p>
          <p className="mt-4 text-[var(--text-hero)] font-bold tabular-nums text-accent">
            {score}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-secondary">
            Passing grade {passingGrade} · Percobaan ke-{attempt}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            {gap > 0 ? `Kurang ${gap} poin lagi buat lulus. ` : ""}
            Pelajari materi di dashboard, lalu coba lagi kapan pun.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <form
              action={async () => {
                "use server";
                await startPosttestRetry(token);
              }}
            >
              <Button type="submit">Coba Lagi</Button>
            </form>
            <Button variant="secondary" href="/p">
              Pelajari Materi
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function PosttestPassed({ score }: { score: number }) {
  return (
    <div className="min-h-screen">
      <TopBar title="Posttest" />
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-16">
        <div className={`${CARD} w-full max-w-md text-center`}>
          <p className="label-eyebrow text-ink-secondary">Nilai Posttest</p>
          <p className="mt-4 text-[var(--text-hero)] font-bold tabular-nums text-accent">
            {score}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-success-soft px-3 py-1.5 text-sm font-semibold text-success">
            <span aria-hidden className="size-2 rounded-full bg-success" />
            Lulus
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            Kamu lulus posttest. Cek dashboard untuk melihat status dan materi.
          </p>
          <div className="mt-8">
            <Button href="/p">Ke Dashboard</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default async function PosttestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { activity: { include: { module: true } } },
  });

  if (!participant) {
    return (
      <ExamResult
        title="Link tidak valid"
        body="Hubungi admin untuk mendapatkan link posttest yang benar."
      />
    );
  }

  const activity = participant.activity;

  const failedPosttest = await prisma.attempt.count({
    where: {
      participantId: participant.id,
      section: "POSTTEST",
      submittedAt: { not: null },
      passed: false,
    },
  });

  if (activity.status === "CLOSED") {
    return (
      <ExamResult
        title="Kegiatan sudah ditutup"
        body="Hubungi admin untuk info lebih lanjut."
      />
    );
  }
  if (activity.status === "PRETEST_OPEN") {
    return (
      <ExamResult
        title="Posttest belum dibuka"
        body="Tunggu sampai admin membuka posttest, lalu buka link ini lagi."
      />
    );
  }

  const passedAttempt = await prisma.attempt.findFirst({
    where: { participantId: participant.id, section: "POSTTEST", passed: true },
  });
  if (passedAttempt) {
    return <PosttestPassed score={passedAttempt.score ?? 0} />;
  }

  const questions = await prisma.question.findMany({
    where: { moduleId: activity.moduleId, section: "POSTTEST" },
    include: { options: true },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    return (
      <ExamResult
        title="Belum ada soal posttest"
        body="Hubungi admin — modul belum memiliki soal posttest."
      />
    );
  }

  const activeAttempt = await prisma.attempt.findFirst({
    where: {
      participantId: participant.id,
      section: "POSTTEST",
      submittedAt: null,
    },
    include: { answers: true },
  });

  if (!activeAttempt) {
    const lastSubmitted = await prisma.attempt.findFirst({
      where: {
        participantId: participant.id,
        section: "POSTTEST",
        submittedAt: { not: null },
      },
      orderBy: { submittedAt: "desc" },
    });
    if (lastSubmitted && lastSubmitted.score !== null) {
      return (
        <PosttestFailed
          score={lastSubmitted.score}
          passingGrade={activity.module.posttestPassingGrade}
          attempt={failedPosttest}
          token={token}
        />
      );
    }
    return (
      <div className="min-h-screen">
        <TopBar title={activity.title} />
        <StartGate
          eyebrow="Ujian Akhir"
          title="Posttest"
          activity={`${activity.title} · Passing grade ${activity.module.posttestPassingGrade}`}
          durationMin={activity.module.posttestDurationMin}
          questionCount={questions.length}
        >
          <form
            action={async () => {
              "use server";
              await startPosttestRetry(token);
            }}
            className="mt-8"
          >
            <Button type="submit">Mulai Posttest</Button>
          </form>
        </StartGate>
      </div>
    );
  }

  const deadline = deadlineFor(
    activeAttempt.startedAt,
    activity.module.posttestDurationMin
  );

  if (Date.now() > deadline.getTime()) {
    await finalizeAttempt(activeAttempt.id);
  }

  const refreshed = await prisma.attempt.findUniqueOrThrow({
    where: { id: activeAttempt.id },
    include: { answers: true },
  });

  if (refreshed.submittedAt && refreshed.score !== null) {
    return (
      <PosttestFailed
        score={refreshed.score}
        passingGrade={activity.module.posttestPassingGrade}
        attempt={failedPosttest}
        token={token}
      />
    );
  }

  const orderedQuestions = activity.module.shuffleQuestions
    ? shuffleWithSeed(questions, refreshed.seed)
    : questions;

  const examQuestions = orderedQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    options: (
      activity.module.shuffleOptions
        ? shuffleWithSeed(q.options, refreshed.seed)
        : q.options
    ).map((o) => ({ id: o.id, text: o.text })),
  }));

  const initialAnswers: Record<string, string> = {};
  for (const a of refreshed.answers) {
    if (a.optionId) initialAnswers[a.questionId] = a.optionId;
  }

  return (
    <div className="min-h-screen">
      <TopBar title={activity.title} />
      <main className="mx-auto my-[2.5vh] min-h-[95vh] max-w-11/12 bg-white px-6 py-8 shadow-2xl">
        <PageTransition>
          <div className="mx-auto mb-6 max-w-3xl px-4 sm:px-6">
            <p className="label-eyebrow text-ink-secondary">Ujian Akhir</p>
            <h1 className="mt-1 text-[var(--text-h1)] font-bold tracking-tight text-ink">
              Posttest
            </h1>
            <p className="mt-1 text-base text-ink-secondary">
              {activity.title} · Passing grade {activity.module.posttestPassingGrade}
            </p>
          </div>
          <ExamRunner
            attemptId={refreshed.id}
            deadlineISO={deadline.toISOString()}
            questions={examQuestions}
            initialAnswers={initialAnswers}
            heading={`Posttest · ${activity.title}`}
          />
        </PageTransition>
      </main>
    </div>
  );
}
