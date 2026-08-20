import { prisma } from "@/lib/prisma";
import { shuffleWithSeed, deadlineFor } from "@/lib/exam";
import { submitAttempt } from "@/app/exam/actions";
import { ExamRunner } from "@/app/exam/ExamRunner";
import { ExamResult } from "@/app/exam/ExamResult";
import { Button } from "@/components/ui/Button";
import { StartGate } from "@/components/ui/StartGate";
import { startPosttestRetry } from "./actions";

function PosttestFailed({
  score,
  passingGrade,
  token,
}: {
  score: number;
  passingGrade: number;
  token: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-6">
      <div className="w-full max-w-md text-center">
        <p className="label-eyebrow text-highlight">Nilai Posttest</p>
        <p className="mt-4 text-[var(--text-hero)] font-bold tabular-nums text-white">
          {score}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          Passing grade {passingGrade}
        </p>
        <p className="mt-3 text-sm text-white/70">
          Kamu belum lulus — bisa diulang kapan pun sampai lulus.
        </p>
        <form
          action={async () => {
            "use server";
            await startPosttestRetry(token);
          }}
          className="mt-8"
        >
          <Button variant="highlight" type="submit">
            Coba Lagi
          </Button>
        </form>
      </div>
    </main>
  );
}

function PosttestPassed({ score }: { score: number }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-6">
      <div className="w-full max-w-md text-center">
        <p className="label-eyebrow text-highlight">Nilai Posttest</p>
        <p className="mt-4 text-[var(--text-hero)] font-bold tabular-nums text-white">
          {score}
        </p>
        <p className="mt-3 inline-flex border border-highlight px-4 py-1.5 text-sm font-semibold text-highlight">
          Lulus
        </p>
        <p className="mt-4 text-sm text-white/70">
          Kamu lulus posttest. Cek dashboard untuk melihat status dan materi.
        </p>
        <div className="mt-8">
          <Button variant="secondary" href="/p">
            Ke Dashboard
          </Button>
        </div>
      </div>
    </main>
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
          token={token}
        />
      );
    }
    return (
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
          <Button variant="highlight" type="submit">
            Mulai Posttest
          </Button>
        </form>
      </StartGate>
    );
  }

  const deadline = deadlineFor(
    activeAttempt.startedAt,
    activity.module.posttestDurationMin
  );

  if (Date.now() > deadline.getTime()) {
    await submitAttempt(activeAttempt.id);
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
    <main className="min-h-screen py-8">
      <div className="mx-auto mb-8 max-w-2xl px-6">
        <p className="label-eyebrow text-flag">Ujian Akhir</p>
        <h1 className="mt-2 text-[var(--text-h1)] font-bold tracking-tight">
          Posttest
        </h1>
        <p className="mt-2 text-base text-ink-secondary">
          {activity.title} · Passing grade {activity.module.posttestPassingGrade}
        </p>
      </div>
      <ExamRunner
        attemptId={refreshed.id}
        deadlineISO={deadline.toISOString()}
        questions={examQuestions}
        initialAnswers={initialAnswers}
      />
    </main>
  );
}
