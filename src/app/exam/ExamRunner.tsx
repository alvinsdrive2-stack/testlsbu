"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAnswer, submitAttempt } from "./actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type ExamQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
};

export function ExamRunner({
  attemptId,
  deadlineISO,
  questions,
  initialAnswers,
}: {
  attemptId: string;
  deadlineISO: string;
  questions: ExamQuestion[];
  initialAnswers: Record<string, string>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const deadline = new Date(deadlineISO).getTime();
  const [timeLeft, setTimeLeft] = useState(Math.max(0, deadline - Date.now()));

  async function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    await submitAttempt(attemptId);
    router.refresh();
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const left = deadline - Date.now();
      setTimeLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(timer);
        void doSubmit();
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  function select(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    void saveAnswer(attemptId, questionId, optionId);
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 border-b border-hairline bg-canvas/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="text-sm text-ink-secondary">
            Terjawab {answeredCount} dari {questions.length}
          </p>
          <p
            className={`font-mono text-lg font-semibold tabular-nums ${
              timeLeft <= 60_000 ? "text-red-600" : "text-ink"
            }`}
          >
            {minutes}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-5">
            <p className="text-[15px] font-medium">
              {i + 1}. {q.text}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-accent bg-accent/5 font-medium"
                        : "border-hairline bg-surface hover:bg-canvas"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={selected}
                      onChange={() => select(q.id, opt.id)}
                      className="size-4 accent-[#002b66]"
                    />
                    {opt.text}
                  </label>
                );
              })}
            </div>
          </Card>
        ))}

        <Button
          type="button"
          onClick={doSubmit}
          disabled={submitting}
          className="w-full"
        >
          {submitting ? "Mengirim..." : "Selesai & Kirim"}
        </Button>
      </div>
    </div>
  );
}
