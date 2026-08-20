import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { shuffleWithSeed, deadlineFor } from "@/lib/exam";
import { submitAttempt } from "@/app/exam/actions";
import { ExamRunner } from "@/app/exam/ExamRunner";
import { ExamResult } from "@/app/exam/ExamResult";
import { Button } from "@/components/ui/Button";
import { StartGate } from "@/components/ui/StartGate";
import { startPretest } from "./actions";

export default async function PretestPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;

  const token = await getParticipantToken();
  if (!token) redirect(`/j/${activityId}`);

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { activity: { include: { module: true } } },
  });
  if (!participant || participant.activityId !== activityId) {
    redirect(`/j/${activityId}`);
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
  if (activity.status !== "PRETEST_OPEN") {
    return (
      <ExamResult
        title="Pretest sudah selesai"
        body="Buka dashboard peserta untuk melihat nilai dan materi."
        href="/p"
        hrefLabel="Ke Dashboard"
      />
    );
  }

  const questions = await prisma.question.findMany({
    where: { moduleId: activity.moduleId, section: "PRETEST" },
    include: { options: true },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    return (
      <ExamResult
        title="Belum ada soal pretest"
        body="Hubungi admin — modul belum memiliki soal pretest."
      />
    );
  }

  const activeAttempt = await prisma.attempt.findFirst({
    where: {
      participantId: participant.id,
      section: "PRETEST",
      submittedAt: null,
    },
    include: { answers: true },
  });

  if (!activeAttempt) {
    const submitted = await prisma.attempt.findFirst({
      where: {
        participantId: participant.id,
        section: "PRETEST",
        submittedAt: { not: null },
      },
      orderBy: { submittedAt: "desc" },
    });
    if (submitted && submitted.score !== null) {
      return (
        <ExamResult
          title={`Nilai pretest kamu: ${submitted.score}`}
          body="Lanjut ke dashboard untuk membaca materi pelatihan."
          href="/p"
          hrefLabel="Ke Dashboard"
        />
      );
    }
    return (
      <StartGate
        eyebrow="Ujian Diawali"
        title="Pretest"
        activity={activity.title}
        durationMin={activity.module.pretestDurationMin}
        questionCount={questions.length}
      >
        <form action={startPretest} className="mt-8">
          <input type="hidden" name="activityId" value={activityId} />
          <Button variant="highlight" type="submit">
            Mulai Pretest
          </Button>
        </form>
      </StartGate>
    );
  }

  const deadline = deadlineFor(
    activeAttempt.startedAt,
    activity.module.pretestDurationMin
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
      <ExamResult
        title={`Nilai pretest kamu: ${refreshed.score}`}
        body="Lanjut ke dashboard untuk membaca materi pelatihan."
        href="/p"
        hrefLabel="Ke Dashboard"
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
      activity.module.shuffleOptions ? shuffleWithSeed(q.options, refreshed.seed) : q.options
    ).map((o) => ({ id: o.id, text: o.text })),
  }));

  const initialAnswers: Record<string, string> = {};
  for (const a of refreshed.answers) {
    if (a.optionId) initialAnswers[a.questionId] = a.optionId;
  }

  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto mb-8 max-w-2xl px-6">
        <p className="label-eyebrow text-flag">Ujian Diawali</p>
        <h1 className="mt-2 text-[var(--text-h1)] font-bold tracking-tight">
          Pretest
        </h1>
        <p className="mt-2 text-base text-ink-secondary">{activity.title}</p>
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
