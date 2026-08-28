"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
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
  await finalizeAttempt(attemptId);
  revalidatePath("/p");
}

export async function finalizeAttempt(attemptId: string): Promise<boolean> {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      section: true,
      participantId: true,
      submittedAt: true,
      participant: {
        select: {
          stage: true,
          activity: {
            select: {
              moduleId: true,
              module: {
                select: { pretestPassingGrade: true, posttestPassingGrade: true },
              },
            },
          },
        },
      },
      answers: { select: { questionId: true, optionId: true } },
    },
  });
  if (!attempt || attempt.submittedAt) return false;

  // Bank soal selalu section PRETEST (lihat getExamQuestions)
  const moduleId = attempt.participant.activity.moduleId;
  const options = await prisma.option.findMany({
    where: { question: { moduleId, section: "PRETEST" }, isCorrect: true },
    select: { questionId: true, id: true },
  });

  const correctByQuestion = new Map(
    options.map((o) => [o.questionId, o.id] as const)
  );
  const totalQuestions = options.length;
  let correct = 0;
  for (const answer of attempt.answers) {
    if (answer.optionId && correctByQuestion.get(answer.questionId) === answer.optionId) {
      correct++;
    }
  }

  const score = computeScore(totalQuestions, correct);
  const passingGrade =
    attempt.section === "PRETEST"
      ? attempt.participant.activity.module.pretestPassingGrade
      : attempt.participant.activity.module.posttestPassingGrade;
  const passed = score >= passingGrade;

  const updates: Prisma.PrismaPromise<unknown>[] = [
    prisma.attempt.update({
      where: { id: attemptId },
      data: { score, passed, submittedAt: new Date() },
    }),
  ];
  if (
    attempt.section === "PRETEST" &&
    attempt.participant.stage === "REGISTERED"
  ) {
    updates.push(
      prisma.participant.update({
        where: { id: attempt.participantId },
        data: { stage: "PRETEST_DONE" },
      })
    );
  }
  if (attempt.section === "POSTTEST" && passed) {
    updates.push(
      prisma.participant.update({
        where: { id: attempt.participantId },
        data: { stage: "POSTTEST_PASSED" },
      })
    );
  }

  await prisma.$transaction(updates);
  return true;
}
