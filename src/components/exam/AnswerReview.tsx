import { prisma } from "@/lib/prisma";
import { getExamQuestions } from "@/lib/exam-questions";

export async function AnswerReview({ attemptId }: { attemptId: string }) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      section: true,
      answers: { select: { questionId: true, optionId: true } },
      participant: { select: { activity: { select: { moduleId: true } } } },
    },
  });
  if (!attempt) return null;

  const questions = await getExamQuestions(
    attempt.participant.activity.moduleId
  );

  const answerByQ = new Map(attempt.answers.map((a) => [a.questionId, a.optionId]));

  return (
    <section className="mt-8">
      <h2 className="text-h2 font-bold text-ink">
        Review Jawaban — {attempt.section === "PRETEST" ? "Pretest" : "Posttest"}
      </h2>
      <p className="mt-1 text-sm text-ink-secondary">
        Lihat jawaban Anda. Jawaban yang benar cuma dijelaskan, jawaban yang salah tidak dibocorkan.
      </p>
      <div className="mt-4 overflow-hidden border border-hairline bg-surface shadow-[0_2px_8px_rgba(15,20,25,0.08)]">
        <div className="divide-y divide-hairline">
          {questions.map((q, i) => {
            const chosenId = answerByQ.get(q.id);
            const chosen = q.options.find((o) => o.id === chosenId);
            const answered = Boolean(chosenId);
            const correct = answered && chosen?.isCorrect;
            return (
              <div key={q.id} className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-ink-secondary">
                    Soal {i + 1}
                  </p>
                  {answered ? (
                    correct ? (
                      <span className="rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
                        Benar
                      </span>
                    ) : (
                      <span className="rounded-full bg-flag/10 px-3 py-1 text-sm font-semibold text-flag">
                        Salah
                      </span>
                    )
                  ) : (
                    <span className="rounded-full bg-canvas px-3 py-1 text-sm font-semibold text-ink-secondary">
                      Tidak dijawab
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[17px] font-medium leading-relaxed text-ink">
                  {q.text}
                </p>
                <p className="mt-4 text-sm text-ink-secondary">
                  Jawaban Anda:{" "}
                  <span className="font-medium text-ink">
                    {chosen
                      ? `${String.fromCharCode(65 + q.options.findIndex((o) => o.id === chosen.id))}. ${chosen.text}`
                      : "—"}
                  </span>
                </p>
                {answered && correct && q.explanation ? (
                  <p className="mt-3 rounded-md bg-success-soft px-4 py-3 text-sm leading-relaxed text-success">
                    <span className="font-semibold">Alasan:</span> {q.explanation}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
