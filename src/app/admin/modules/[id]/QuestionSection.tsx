import type { Question, Option } from "@prisma/client";
import {
  createQuestion,
  updateQuestionText,
  deleteQuestion,
  moveQuestion,
} from "../actions";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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
      <h2 className="text-h1 font-semibold">{title}</h2>

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
                  <Button variant="danger" type="submit">
                    Hapus
                  </Button>
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
                <p
                  key={opt.id}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    opt.isCorrect
                      ? "bg-accent/10 font-medium text-ink"
                      : "text-ink-secondary"
                  }`}
                >
                  {opt.isCorrect ? "✓ " : ""}
                  {opt.text}
                </p>
              ))}
              {q.options.length === 0 ? (
                <p className="text-sm text-ink-secondary">
                  Belum ada opsi jawaban.
                </p>
              ) : null}
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
