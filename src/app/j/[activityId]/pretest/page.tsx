import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantToken } from "@/lib/session";
import { shuffleWithSeed, deadlineFor } from "@/lib/exam";
import { activityPhase } from "@/lib/activity-phase";
import { getExamQuestions } from "@/lib/exam-questions";
import { finalizeAttempt } from "@/app/exam/actions";
import { ExamResult } from "@/app/exam/ExamResult";
import { Button } from "@/components/ui/Button";
import { StartGate } from "@/components/ui/StartGate";
import { TopBar } from "@/components/ui/TopBar";
import { ExamScreen } from "@/components/exam/ExamScreen";
import { AnswerReview } from "@/components/exam/AnswerReview";
import { StartPretestForm } from "./StartPretestForm";

const CARD =
  "rounded-[var(--radius-card)] border border-hairline bg-surface p-10 shadow-[0_1px_3px_rgba(15,20,25,0.06)]";

const FLOW_STEPS = [
  { label: "Daftar", done: true },
  { label: "Pretest", done: true },
  { label: "Materi", current: true },
  { label: "Posttest", done: false },
];

function PretestResult({
  score,
  activityTitle,
  attemptId,
}: {
  score: number;
  activityTitle: string;
  attemptId: string;
}) {
  return (
    <div className="min-h-screen">
      <TopBar title={activityTitle} />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mx-auto w-full max-w-md">
          <div className={`${CARD} text-center`}>
            <p className="label-eyebrow text-ink-secondary">Nilai Pretest</p>
            <p className="mt-4 text-[var(--text-hero)] font-bold tabular-nums text-accent">
              {score}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-success-soft px-3 py-1.5 text-sm font-semibold text-success">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              Pretest Selesai
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
              Baca materi pelatihan di dashboard untuk bersiap menghadapi
              posttest.
            </p>
            <div className="mt-8">
              <Button href="/p" className="w-full">
                Ke Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-6 border-t border-hairline pt-6">
            <div className="grid grid-cols-4 gap-2">
              {FLOW_STEPS.map((s, i) => (
                <div key={s.label} className="text-center">
                  <div
                    className={`mx-auto flex size-7 items-center justify-center rounded-full text-[13px] font-bold ${
                      s.done
                        ? "bg-success text-white"
                        : s.current
                          ? "bg-accent text-white"
                          : "border border-hairline text-ink-secondary"
                    }`}
                  >
                    {s.done ? "✓" : String(i + 1)}
                  </div>
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      s.current ? "text-accent" : "text-ink-secondary"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <details className="group mx-auto mt-6 w-full max-w-4xl border-t border-hairline pt-6">
          <summary className="cursor-pointer list-none text-sm font-semibold text-accent hover:underline [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden
              className="mr-1.5 inline-block transition-transform group-open:rotate-90"
            >
              ▸
            </span>
            Lihat review jawaban — mana yang benar, mana yang salah
          </summary>
          <AnswerReview attemptId={attemptId} />
        </details>
      </main>
    </div>
  );
}

export default async function PretestPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;

  const token = await getParticipantToken();
  if (!token) redirect(`/j/${activityId}`);

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { activity: { include: { module: true } } },
  });
  if (!participant || participant.activityId !== activityId) {
    redirect(`/j/${activityId}`);
  }

  const activity = participant.activity;
  const phase = activityPhase(activity, new Date());
  if (phase === "CLOSED") {
    return (
      <ExamResult
        title="Kegiatan sudah ditutup"
        body="Hubungi admin untuk info lebih lanjut."
      />
    );
  }
  if (phase !== "PRETEST") {
    return (
      <ExamResult
        title={
          phase === "SCHEDULED" ? "Pretest belum dibuka" : "Pretest sudah selesai"
        }
        body="Buka dashboard peserta untuk melihat nilai dan materi."
        href="/p"
        hrefLabel="Ke Dashboard"
      />
    );
  }

  const questions = await getExamQuestions(activity.moduleId);

  if (questions.length === 0) {
    return (
      <ExamResult
        title="Belum ada soal ujian"
        body="Hubungi admin — modul belum memiliki soal ujian."
      />
    );
  }

  const activeAttempt = await prisma.attempt.findFirst({
    where: {
      participantId: participant.id,
      section: "PRETEST",
      submittedAt: null,
    },
    include: { answers: true },
  });

  if (!activeAttempt) {
    const submitted = await prisma.attempt.findFirst({
      where: {
        participantId: participant.id,
        section: "PRETEST",
        submittedAt: { not: null },
      },
      orderBy: { submittedAt: "desc" },
    });
    if (submitted && submitted.score !== null) {
      return (
        <PretestResult
          score={submitted.score}
          activityTitle={activity.title}
          attemptId={submitted.id}
        />
      );
    }
    return (
      <div className="min-h-screen">
        <TopBar title={activity.title} />
        <StartGate
          eyebrow="Ujian Diawali"
          title="Pretest"
          activity={activity.title}
          durationMin={activity.module.pretestDurationMin}
          questionCount={questions.length}
        >
          <StartPretestForm activityId={activityId} />
        </StartGate>
      </div>
    );
  }

  const deadline = deadlineFor(
    activeAttempt.startedAt,
    activity.module.pretestDurationMin
  );

  const sessionEnd = activity.materialStart;
  const cutoff = sessionEnd
    ? Math.min(deadline.getTime(), sessionEnd.getTime())
    : deadline.getTime();
  if (Date.now() > cutoff) {
    await finalizeAttempt(activeAttempt.id);
  }

  const refreshed = await prisma.attempt.findUniqueOrThrow({
    where: { id: activeAttempt.id },
    include: { answers: true },
  });

  if (refreshed.submittedAt && refreshed.score !== null) {
    return (
      <PretestResult
        score={refreshed.score}
        activityTitle={activity.title}
        attemptId={refreshed.id}
      />
    );
  }

  const orderedQuestions = activity.module.shuffleQuestions
    ? shuffleWithSeed(questions, refreshed.seed)
    : questions;

  const examQuestions = orderedQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    options: (
      activity.module.shuffleOptions ? shuffleWithSeed(q.options, refreshed.seed) : q.options
    ).map((o) => ({ id: o.id, text: o.text })),
  }));

  const initialAnswers: Record<string, string> = {};
  for (const a of refreshed.answers) {
    if (a.optionId) initialAnswers[a.questionId] = a.optionId;
  }

  return (
    <ExamScreen
      topBarTitle={activity.title}
      heading={`Pretest · ${activity.title}`}
      attemptId={refreshed.id}
      deadlineISO={deadline.toISOString()}
      sessionEndISO={sessionEnd ? sessionEnd.toISOString() : undefined}
      questions={examQuestions}
      initialAnswers={initialAnswers}
    />
  );
}
