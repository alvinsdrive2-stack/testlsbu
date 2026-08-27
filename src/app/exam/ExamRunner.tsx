"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAnswer, submitAttempt } from "./actions";
import { Button } from "@/components/ui/Button";
import { toastError } from "@/lib/toast";

export type ExamQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function ExamRunner({
  attemptId,
  deadlineISO,
  sessionEndISO,
  questions,
  initialAnswers,
  heading,
}: {
  attemptId: string;
  deadlineISO: string;
  sessionEndISO?: string;
  questions: ExamQuestion[];
  initialAnswers: Record<string, string>;
  heading?: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const deadline = new Date(deadlineISO).getTime();
  const sessionEnd = sessionEndISO ? new Date(sessionEndISO).getTime() : null;
  const sessionCutoff = sessionEnd !== null && sessionEnd < deadline;
  const effective = sessionEnd !== null ? Math.min(deadline, sessionEnd) : deadline;
  const [timeLeft, setTimeLeft] = useState(Math.max(0, effective - Date.now()));

  async function doSubmit() {
    if (submittedRef.current) return;
    setSubmitting(true);
    setConfirming(false);
    setSubmitError(null);
    try {
      await submitAttempt(attemptId);
      submittedRef.current = true;
      router.refresh();
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
      setSubmitError(
        "Gagal mengirim jawaban. Cek koneksi, lalu coba kirim lagi."
      );
      toastError("Gagal mengirim jawaban. Coba kirim lagi.");
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const left = effective - Date.now();
      setTimeLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(timer);
        void doSubmit();
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective]);

  async function select(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSaveState("saving");
    try {
      await saveAnswer(attemptId, questionId, optionId);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      toastError("Jawaban gagal tersimpan. Cek koneksi internetmu.");
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
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 items-center gap-3">
            {heading ? (
              <p className="truncate text-[15px] font-medium text-ink">{heading}</p>
            ) : null}
            {saveState !== "idle" ? (
              <span
                role="status"
                className={`truncate text-[13px] ${
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
          <div className="flex items-center gap-3">
            <p className="text-[15px] tabular-nums text-ink-secondary">
              Terjawab {answeredCount} dari {questions.length}
            </p>
            <p
              aria-live={urgent ? "polite" : undefined}
              className={`font-mono text-lg font-bold tabular-nums ${
                urgent ? "text-flag" : "text-ink"
              }`}
            >
              {urgent ? "Waktu hampir habis · " : ""}
              {minutes}:{String(seconds).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div
          role="note"
          className="mb-5 rounded-md border border-warning/40 bg-warning-soft px-4 py-3 text-sm leading-relaxed text-ink"
        >
          <span className="font-semibold">Perhatian:</span> Anda hanya bisa
          mengerjakan selama masih sesi ujian berlangsung. Saat sesi berganti,
          jawaban Anda <span className="font-semibold">terkirim otomatis</span> dan
          ujian terkunci.
          {sessionCutoff
            ? " Sisa waktu di atas mengikuti batas akhir sesi — lebih pendek dari durasi penuh ujian."
            : ""}
        </div>
        <div className="overflow-hidden border border-hairline bg-surface shadow-[0_2px_8px_rgba(15,20,25,0.08)]">
        <div className="divide-y divide-hairline">
        {questions.map((q, i) => {
          const selected = answers[q.id];
          return (
            <section
              key={q.id}
              id={`q-${q.id}`}
              className="scroll-mt-40 p-6 sm:p-8"
            >
              <p className="text-sm font-semibold text-ink-secondary">Soal {i + 1}</p>
              <p className="mt-2 text-[17px] font-medium leading-relaxed">{q.text}</p>
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <label
                      key={opt.id}
                      style={{
                        transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 py-3 text-base ${
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
        </div>

        <div className="px-6 py-6 sm:px-8">
          {submitError ? (
            <p
              role="alert"
              className="mb-4 rounded-md border border-flag/30 bg-flag/10 px-4 py-3 text-sm font-medium text-flag"
            >
              {submitError}
            </p>
          ) : null}
        <div className="flex justify-end">
          {confirming ? (
            <div className="w-full">
              <p className="font-semibold">
                {unanswered > 0
                  ? `Masih ada ${unanswered} soal kosong.`
                  : "Semua soal sudah terjawab."}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                Setelah dikirim, jawaban tidak bisa diubah.{" "}
                {unanswered > 0 ? "Soal kosong dinilai salah." : ""}
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                >
                  Periksa Lagi
                </Button>
                <Button
                  type="button"
                  onClick={doSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Mengirim…" : "Kirim Sekarang"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={submitting}
            >
              Selesai & Kirim
            </Button>
          )}
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
