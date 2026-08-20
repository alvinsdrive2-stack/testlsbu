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
import { ConfirmButton } from "@/components/ui/ConfirmButton";

type Section = "PRETEST" | "POSTTEST";

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

  return (
    <section>
      <div className="mb-4 border-b border-hairline pb-2">
        <h2 className="text-h2 font-bold">{title}</h2>
      </div>

      <div className="mt-4 space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-ink-secondary">Soal {i + 1}</p>
              <div className="flex gap-1">
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

            <form action={updateQuestionText} className="mt-2 space-y-3">
              <input type="hidden" name="questionId" value={q.id} />
              <input type="hidden" name="moduleId" value={moduleId} />
              <TextArea
                label="Teks soal"
                name="text"
                defaultValue={q.text}
                required
                minLength={3}
              />
              <Button variant="secondary" type="submit">
                Simpan Soal
              </Button>
            </form>

            <div className="mt-4 space-y-2 border-t border-hairline pt-4">
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
                      <ConfirmButton label="Hapus" className="px-3 py-1 text-xs" />
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
                <Button variant="secondary" type="submit">
                  Tambah
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <form action={createQuestion} className="space-y-3">
          <input type="hidden" name="moduleId" value={moduleId} />
          <input type="hidden" name="section" value={section} />
          <TextArea label="Tambah soal baru" name="text" required minLength={3} />
          <Button type="submit">Tambah Soal</Button>
        </form>
      </Card>
    </section>
  );
}
