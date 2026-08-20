"use client";

import { useState } from "react";
import type { Question, Option } from "@prisma/client";
import {
  createQuestion,
  updateQuestionText,
  deleteQuestion,
  moveQuestion,
  addOption,
  setCorrectOption,
  deleteOption,
} from "../actions";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

type Section = "PRETEST" | "POSTTEST";

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

export function QuestionSection({
  moduleId,
  section,
  questions,
}: {
  moduleId: string;
  section: Section;
  questions: (Question & { options: Option[] })[];
}) {
  const title = section === "PRETEST" ? "Soal Pretest" : "Soal Posttest";
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <section>
      <div className="mb-4 border-b border-hairline pb-2">
        <h2 className="text-h2 font-bold">{title}</h2>
      </div>

      <div className="mt-4 space-y-4">
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
                    <Button variant="ghost" type="submit" disabled={i === 0}>
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
                  <form action={updateQuestionText} className="space-y-3">
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <TextArea
                      label="Teks soal"
                      name="text"
                      defaultValue={q.text}
                      required
                      minLength={3}
                    />
                    <SubmitButton variant="secondary">Simpan Soal</SubmitButton>
                  </form>

                  <div className="space-y-2 border-t border-hairline pt-4">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between gap-2 border border-hairline px-3 py-2 text-sm"
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
                              <input type="hidden" name="optionId" value={opt.id} />
                              <input type="hidden" name="moduleId" value={moduleId} />
                              <Button variant="ghost" type="submit">
                                Jadikan benar
                              </Button>
                            </form>
                          ) : null}
                          <form action={deleteOption}>
                            <input type="hidden" name="optionId" value={opt.id} />
                            <input type="hidden" name="moduleId" value={moduleId} />
                            <ConfirmButton
                              label="Hapus"
                              className="px-3 py-1 text-xs"
                            />
                          </form>
                        </div>
                      </div>
                    ))}

                    <form action={addOption} className="flex items-end gap-2 pt-2">
                      <input type="hidden" name="questionId" value={q.id} />
                      <input type="hidden" name="moduleId" value={moduleId} />
                      <div className="flex-1">
                        <label
                          className="mb-1 block text-sm font-medium"
                          htmlFor={`opt-${q.id}`}
                        >
                          Tambah opsi
                        </label>
                        <input
                          id={`opt-${q.id}`}
                          name="text"
                          required
                          className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <SubmitButton variant="secondary">Tambah</SubmitButton>
                    </form>
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 p-5">
        <form action={createQuestion} className="space-y-3">
          <input type="hidden" name="moduleId" value={moduleId} />
          <input type="hidden" name="section" value={section} />
          <TextArea label="Tambah soal baru" name="text" required minLength={3} />
          <SubmitButton>Tambah Soal</SubmitButton>
        </form>
      </Card>
    </section>
  );
}
