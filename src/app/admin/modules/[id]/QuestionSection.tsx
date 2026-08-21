"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Question, Option } from "@prisma/client";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  moveQuestion,
  addOption,
  setCorrectOption,
  deleteOption,
  updateExplanation,
} from "../actions";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return <span className="text-sm text-flag">{error}</span>;
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-3.5 shrink-0 transition-transform duration-200 ease-out"
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditQuestionForm({
  questionId,
  moduleId,
  initialText,
}: {
  questionId: string;
  moduleId: string;
  initialText: string;
}) {
  const [state, formAction] = useActionState(updateQuestion, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <TextArea
        label="Teks soal"
        name="text"
        defaultValue={initialText}
        required
        minLength={3}
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary">Simpan Soal</SubmitButton>
        <ErrorNote error={state.error} />
      </div>
    </form>
  );
}

function ExplanationForm({
  questionId,
  moduleId,
  initialExplanation,
}: {
  questionId: string;
  moduleId: string;
  initialExplanation: string;
}) {
  const [state, formAction] = useActionState(updateExplanation, {});
  return (
    <form
      action={formAction}
      className="mt-2 space-y-2 rounded-md border border-accent-soft bg-accent-soft/60 p-3"
    >
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <TextArea
        label="Penjelasan jawaban benar (opsional)"
        name="explanation"
        defaultValue={initialExplanation}
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary" className="px-4 py-2 text-sm">
          Simpan Penjelasan
        </SubmitButton>
        <ErrorNote error={state.error} />
      </div>
    </form>
  );
}

function AddOptionForm({
  questionId,
  moduleId,
}: {
  questionId: string;
  moduleId: string;
}) {
  const [state, formAction] = useActionState(addOption, {});
  return (
    <form action={formAction} className="flex items-end gap-2 pt-2">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <div className="flex-1">
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor={`opt-${questionId}`}
        >
          Tambah opsi
        </label>
        <input
          id={`opt-${questionId}`}
          name="text"
          required
          className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <SubmitButton variant="secondary">Tambah</SubmitButton>
      <ErrorNote error={state.error} />
    </form>
  );
}

function DeleteOptionButton({
  optionId,
  moduleId,
}: {
  optionId: string;
  moduleId: string;
}) {
  const [state, formAction] = useActionState(deleteOption, {});
  return (
    <div className="flex items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="optionId" value={optionId} />
        <input type="hidden" name="moduleId" value={moduleId} />
        <ConfirmButton label="Hapus" className="px-3 py-1 text-xs" />
      </form>
      <ErrorNote error={state.error} />
    </div>
  );
}

function CreateQuestionModal({
  moduleId,
  onCreated,
  onClose,
}: {
  moduleId: string;
  onCreated: (questionId: string) => void;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(createQuestion, {});

  useEffect(() => {
    if (state.ok && state.questionId) {
      onCreated(state.questionId);
    }
  }, [state, onCreated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-label="Tambah soal baru"
        className="w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-h2 font-bold">Soal baru</h3>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="px-3"
          >
            ✕
          </Button>
        </div>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="moduleId" value={moduleId} />
          <TextArea
            label="Teks soal"
            name="text"
            required
            minLength={3}
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingLabel="Menambah…">Tambah Soal</SubmitButton>
            <ErrorNote error={state.error} />
          </div>
        </form>
      </Card>
    </div>
  );
}

export function QuestionSection({
  moduleId,
  questions,
}: {
  moduleId: string;
  questions: (Question & { options: Option[] })[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreated = (questionId: string) => {
    setModalOpen(false);
    setOpen((s) => ({ ...s, [questionId]: true }));
  };

  return (
    <section>
      <div className="mb-4 border-b border-hairline pb-2">
        <h2 className="text-h2 font-bold">Soal Ujian</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Satu set soal, dipakai untuk pretest dan posttest.
        </p>
      </div>

      <div className="mt-4 space-y-4 pb-20">
        {questions.length === 0 ? (
          <Card className="p-6 text-center text-[15px] text-ink-secondary">
            Belum ada soal. Klik tombol + di kanan bawah untuk menambah.
          </Card>
        ) : null}

        {questions.map((q, i) => {
          const expanded = open[q.id] ?? false;
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-ink-secondary">Soal {i + 1}</p>
                  <p className="mt-1 truncate text-[15px] font-medium">
                    {q.text}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-secondary">
                    {q.options.length} opsi
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <form action={moveQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <input type="hidden" name="direction" value="up" />
                    <Button
                      variant="ghost"
                      type="submit"
                      disabled={i === 0}
                      aria-label={`Naikkan urutan soal ${i + 1}`}
                    >
                      ↑
                    </Button>
                  </form>
                  <form action={moveQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <input type="hidden" name="direction" value="down" />
                    <Button
                      variant="ghost"
                      type="submit"
                      disabled={i === questions.length - 1}
                      aria-label={`Turunkan urutan soal ${i + 1}`}
                    >
                      ↓
                    </Button>
                  </form>
                  <form action={deleteQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <ConfirmButton label="Hapus" />
                  </form>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen((s) => ({ ...s, [q.id]: !s[q.id] }))
                }
                className="mt-4 flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-accent hover:bg-canvas"
              >
                <span
                  className={`transition-transform duration-200 ease-out ${
                    expanded ? "rotate-180" : ""
                  }`}
                >
                  <Chevron />
                </span>
                {expanded ? "Tutup edit" : "Edit soal & opsi"}
              </button>

              {expanded ? (
                <div className="mt-3 space-y-3">
                  <EditQuestionForm
                    questionId={q.id}
                    moduleId={moduleId}
                    initialText={q.text}
                  />

                  <div className="space-y-2 border-t border-hairline pt-4">
                    {q.options.map((opt) => (
                      <div key={opt.id}>
                        <div
                          className={`flex items-center justify-between gap-2 border px-3 py-2 text-sm ${
                            opt.isCorrect
                              ? "border-accent bg-accent-soft/40"
                              : "border-hairline"
                          }`}
                        >
                          <span
                            className={
                              opt.isCorrect
                                ? "font-medium text-ink"
                                : "text-ink-secondary"
                            }
                          >
                            {opt.isCorrect ? "✓ " : ""}
                            {opt.text}
                          </span>
                          <div className="flex shrink-0 gap-1">
                            {!opt.isCorrect ? (
                              <form action={setCorrectOption}>
                                <input
                                  type="hidden"
                                  name="optionId"
                                  value={opt.id}
                                />
                                <input
                                  type="hidden"
                                  name="moduleId"
                                  value={moduleId}
                                />
                                <Button variant="ghost" type="submit">
                                  Jadikan benar
                                </Button>
                              </form>
                            ) : null}
                            <DeleteOptionButton
                              optionId={opt.id}
                              moduleId={moduleId}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {q.options.some((o) => o.isCorrect) ? (
                      <ExplanationForm
                        questionId={q.id}
                        moduleId={moduleId}
                        initialExplanation={q.explanation ?? ""}
                      />
                    ) : null}

                    <AddOptionForm questionId={q.id} moduleId={moduleId} />
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {mounted
        ? createPortal(
            <>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                aria-label="Tambah soal baru"
                className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-all duration-200 ease-out hover:bg-accent-hover active:scale-95"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-6">
                  <path
                    d="M12 5v14M5 12h14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {modalOpen ? (
                <CreateQuestionModal
                  moduleId={moduleId}
                  onCreated={handleCreated}
                  onClose={() => setModalOpen(false)}
                />
              ) : null}
            </>,
            document.body
          )
        : null}
    </section>
  );
}
