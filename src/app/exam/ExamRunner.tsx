"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAnswer, submitAttempt } from "./actions";
import { Button } from "@/components/ui/Button";

export type ExamQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const deadline = new Date(deadlineISO).getTime();
  const [timeLeft, setTimeLeft] = useState(Math.max(0, deadline - Date.now()));

  async function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setConfirming(false);
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

  async function select(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSaveState("saving");
    try {
      await saveAnswer(attemptId, questionId, optionId);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const urgent = timeLeft <= 60_000;
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const unanswered = questions.length - answeredCount;

  return (
    <div>
      <div className="sticky top-14 z-10 border-b border-hairline bg-surface/95 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-3">
            <p className="text-[15px] tabular-nums text-ink-secondary">
              Terjawab {answeredCount} dari {questions.length}
            </p>
            {saveState !== "idle" ? (
              <span
                role="status"
                className={`text-[13px] ${
                  saveState === "error" ? "font-medium text-flag" : "text-ink-secondary"
                }`}
              >
                {saveState === "saving"
                  ? "Menyimpan…"
                  : saveState === "saved"
                    ? "Tersimpan otomatis"
                    : "Gagal menyimpan — cek koneksi, jawaban terakhir belum masuk"}
              </span>
            ) : null}
          </div>
          <p
            aria-live={urgent ? "polite" : undefined}
            className={`font-mono text-xl font-bold tabular-nums ${
              urgent ? "text-flag" : "text-ink"
            }`}
          >
            {urgent ? "Waktu hampir habis · " : ""}
            {minutes}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
        <div className="mx-auto mt-2 flex max-w-3xl gap-1.5 overflow-x-auto pb-0.5">
          {questions.map((q, i) => {
            const answered = Boolean(answers[q.id]);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() =>
                  document
                    .getElementById(`q-${q.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                aria-label={`Lompat ke soal ${i + 1}${
                  answered ? "" : " (belum dijawab)"
                }`}
                className={`flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums ${
                  answered
                    ? "border-accent bg-accent text-white"
                    : "border-hairline-strong bg-surface text-ink-secondary"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        {questions.map((q, i) => {
          const selected = answers[q.id];
          return (
            <section
              key={q.id}
              id={`q-${q.id}`}
              className="scroll-mt-40 rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-sm font-semibold tabular-nums text-accent"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[17px] font-medium leading-relaxed">
                  {q.text}
                </p>
              </div>
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <label
                      key={opt.id}
                      style={{
                        transition:
                          "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-base ${
                        isSelected
                          ? "border-accent bg-accent-soft/50 font-medium"
                          : "border-hairline bg-surface hover:bg-canvas active:scale-[0.99]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isSelected}
                        onChange={() => select(q.id, opt.id)}
                        className="size-4 accent-accent"
                      />
                      {opt.text}
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="pt-2 pb-8">
          {confirming ? (
            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
              <p className="font-semibold">
                {unanswered > 0
                  ? `Masih ada ${unanswered} soal kosong.`
                  : "Semua soal sudah terjawab."}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                Setelah dikirim, jawaban tidak bisa diubah.{" "}
                {unanswered > 0 ? "Soal kosong dinilai salah." : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={doSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Mengirim…" : "Kirim Sekarang"}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                >
                  Periksa Lagi
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={submitting}
              className="w-full"
            >
              Selesai & Kirim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
