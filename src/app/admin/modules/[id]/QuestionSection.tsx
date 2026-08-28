"use client";

import { useActionState, useEffect, useState } from "react";
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
import { AddFab, Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { useActionToast } from "@/components/ui/useActionToast";
import { toastSuccess } from "@/lib/toast";

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
  useActionToast(state, { success: "Soal tersimpan" });
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
  useActionToast(state, { success: "Penjelasan tersimpan" });
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
  useActionToast(state, { success: "Opsi ditambahkan" });
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
  useActionToast(state, { success: "Opsi dihapus" });
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
      toastSuccess("Soal baru ditambahkan");
      onCreated(state.questionId);
    }
  }, [state, onCreated]);

  return (
    <Modal label="Tambah soal baru" title="Soal baru" open onClose={onClose}>
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
    </Modal>
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
                  <ActionForm
                    action={moveQuestion}
                    inputs={{ questionId: q.id, moduleId, direction: "up" }}
                    successMessage="Urutan soal diubah"
                  >
                    <Button
                      variant="ghost"
                      type="submit"
                      disabled={i === 0}
                      aria-label={`Naikkan urutan soal ${i + 1}`}
                    >
                      ↑
                    </Button>
                  </ActionForm>
                  <ActionForm
                    action={moveQuestion}
                    inputs={{ questionId: q.id, moduleId, direction: "down" }}
                    successMessage="Urutan soal diubah"
                  >
                    <Button
                      variant="ghost"
                      type="submit"
                      disabled={i === questions.length - 1}
                      aria-label={`Turunkan urutan soal ${i + 1}`}
                    >
                      ↓
                    </Button>
                  </ActionForm>
                  <ActionForm
                    action={deleteQuestion}
                    inputs={{ questionId: q.id, moduleId }}
                    successMessage="Soal dihapus"
                  >
                    <ConfirmButton label="Hapus" />
                  </ActionForm>
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
                    {q.options.map((opt, oi) => (
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
                            <span className="font-semibold">
                              {String.fromCharCode(65 + oi)}.
                            </span>{" "}
                            {opt.isCorrect ? "✓ " : ""}
                            {opt.text}
                          </span>
                          <div className="flex shrink-0 gap-1">
                            {!opt.isCorrect ? (
                              <ActionForm
                                action={setCorrectOption}
                                inputs={{ optionId: opt.id, moduleId }}
                                successMessage="Jawaban benar diperbarui"
                              >
                                <Button variant="ghost" type="submit">
                                  Jadikan benar
                                </Button>
                              </ActionForm>
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

      <AddFab
        label="Tambah soal baru"
        onClick={() => setModalOpen(true)}
      />

      {modalOpen ? (
        <CreateQuestionModal
          moduleId={moduleId}
          onCreated={handleCreated}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </section>
  );
}
