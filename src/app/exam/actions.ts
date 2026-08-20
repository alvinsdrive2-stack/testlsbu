"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/exam";

export async function saveAnswer(attemptId: string, questionId: string, optionId: string) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.submittedAt) return;

  const option = await prisma.option.findUnique({
    where: { id: optionId },
    select: { questionId: true },
  });
  if (!option || option.questionId !== questionId) return;

  await prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, optionId },
    update: { optionId },
  });
}

export async function submitAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      participant: { include: { activity: { include: { module: true } } } },
      answers: true,
    },
  });
  if (!attempt || attempt.submittedAt) return;

  const questions = await prisma.question.findMany({
    where: { moduleId: attempt.participant.activity.moduleId, section: attempt.section },
    include: { options: true },
  });

  const correctByQuestion = new Map(
    questions.map((q) => [q.id, q.options.find((o) => o.isCorrect)?.id ?? null])
  );

  let correct = 0;
  for (const [questionId, correctOptionId] of correctByQuestion) {
    const answer = attempt.answers.find((a) => a.questionId === questionId);
    if (answer && answer.optionId && answer.optionId === correctOptionId) {
      correct++;
    }
  }

  const score = computeScore(questions.length, correct);
  const passingGrade =
    attempt.section === "PRETEST"
      ? attempt.participant.activity.module.pretestPassingGrade
      : attempt.participant.activity.module.posttestPassingGrade;
  const passed = score >= passingGrade;

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { score, passed, submittedAt: new Date() },
  });

  if (attempt.section === "PRETEST" && attempt.participant.stage === "REGISTERED") {
    await prisma.participant.update({
      where: { id: attempt.participantId },
      data: { stage: "PRETEST_DONE" },
    });
  }

  if (attempt.section === "POSTTEST" && passed) {
    await prisma.participant.update({
      where: { id: attempt.participantId },
      data: { stage: "POSTTEST_PASSED" },
    });
  }

  revalidatePath("/p");
}
