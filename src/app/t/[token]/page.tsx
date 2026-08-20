import { prisma } from "@/lib/prisma";
import { createParticipantSession } from "@/lib/session";
import { shuffleWithSeed, deadlineFor } from "@/lib/exam";
import { submitAttempt } from "@/app/exam/actions";
import { ExamRunner } from "@/app/exam/ExamRunner";
import { ExamResult } from "@/app/exam/ExamResult";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { startPosttestRetry } from "./actions";

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

  await createParticipantSession(participant.token);

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
    return (
      <ExamResult
        title={`Selamat, kamu lulus dengan nilai ${passedAttempt.score}`}
        body="Cek dashboard peserta untuk melihat status dan materi."
        href="/p"
        hrefLabel="Ke Dashboard"
      />
    );
  }

  let attempt = await prisma.attempt.findFirst({
    where: { participantId: participant.id, section: "POSTTEST", submittedAt: null },
    include: { answers: true },
  });

  if (!attempt) {
    attempt = await prisma.attempt.create({
      data: {
        participantId: participant.id,
        section: "POSTTEST",
        seed: Math.floor(Math.random() * 2 ** 31),
      },
      include: { answers: true },
    });
  }

  const deadline = deadlineFor(attempt.startedAt, activity.module.posttestDurationMin);

  if (Date.now() > deadline.getTime()) {
    await submitAttempt(attempt.id);
  }

  const refreshed = await prisma.attempt.findUniqueOrThrow({
    where: { id: attempt.id },
    include: { answers: true },
  });

  if (refreshed.submittedAt && refreshed.score !== null) {
    const grade = activity.module.posttestPassingGrade;
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center">
          <p className="text-h2 font-semibold">Nilai posttest kamu: {refreshed.score}</p>
          <p className="mt-2 text-sm text-ink-secondary">
            Passing grade {grade}. Kamu belum lulus — silakan coba lagi.
          </p>
          <form
            action={async () => {
              "use server";
              await startPosttestRetry(token);
            }}
            className="mt-6"
          >
            <Button type="submit">Coba Lagi</Button>
          </form>
        </Card>
      </main>
    );
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
      <div className="mx-auto mb-6 max-w-2xl px-6">
        <h1 className="text-[var(--text-hero)] font-semibold tracking-tight">
          Posttest
        </h1>
        <p className="text-sm text-ink-secondary">
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
