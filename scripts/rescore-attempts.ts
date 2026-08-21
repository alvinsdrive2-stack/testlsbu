import { prisma } from "../src/lib/prisma";
import { getExamQuestions } from "../src/lib/exam-questions";
import { computeScore } from "../src/lib/exam";

async function main() {
  const attempts = await prisma.attempt.findMany({
    where: { submittedAt: { not: null } },
    include: {
      answers: true,
      participant: { include: { activity: true } },
    },
  });

  for (const attempt of attempts) {
    const questions = await getExamQuestions(
      attempt.participant.activity.moduleId
    );
    const correctByQuestion = new Map(
      questions.map((q) => [q.id, q.options.find((o) => o.isCorrect)?.id ?? null])
    );
    let correct = 0;
    for (const [questionId, correctOptionId] of correctByQuestion) {
      const answer = attempt.answers.find((a) => a.questionId === questionId);
      if (answer?.optionId && answer.optionId === correctOptionId) correct++;
    }
    const score = computeScore(questions.length, correct);

    const mod = await prisma.module.findUnique({
      where: { id: attempt.participant.activity.moduleId },
    });
    const passingGrade =
      attempt.section === "PRETEST"
        ? (mod?.pretestPassingGrade ?? 0)
        : (mod?.posttestPassingGrade ?? 70);
    const passed = score >= passingGrade;

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { score, passed },
    });
    console.log(
      `${attempt.id} ${attempt.section}: ${attempt.score ?? "-"} -> ${score} (${passed ? "lulus" : "tidak lulus"})`
    );
  }

  // Koreksi stage peserta berdasarkan hasil baru
  const participants = await prisma.participant.findMany({
    include: { attempts: { where: { submittedAt: { not: null } } } },
  });
  for (const p of participants) {
    const stage = p.attempts.some((a) => a.section === "POSTTEST" && a.passed)
      ? "POSTTEST_PASSED"
      : p.attempts.some((a) => a.section === "PRETEST")
        ? "PRETEST_DONE"
        : "REGISTERED";
    if (stage !== p.stage) {
      await prisma.participant.update({ where: { id: p.id }, data: { stage } });
      console.log(`${p.nama}: stage ${p.stage} -> ${stage}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
