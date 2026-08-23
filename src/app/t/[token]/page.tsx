import { prisma } from "@/lib/prisma";
import { shuffleWithSeed, deadlineFor } from "@/lib/exam";
import { activityPhase } from "@/lib/activity-phase";
import { getExamQuestions } from "@/lib/exam-questions";
import { finalizeAttempt } from "@/app/exam/actions";
import { ExamResult } from "@/app/exam/ExamResult";
import { Button } from "@/components/ui/Button";
import { StartGate } from "@/components/ui/StartGate";
import { TopBar } from "@/components/ui/TopBar";
import { ExamScreen } from "@/components/exam/ExamScreen";
import { startPosttestRetry } from "./actions";
import { AnswerReview } from "@/components/exam/AnswerReview";

const CARD =
  "rounded-[var(--radius-card)] border border-hairline bg-surface p-10 shadow-[0_1px_3px_rgba(15,20,25,0.06)]";

function PosttestFailed({
  score,
  passingGrade,
  attempt,
  token,
  attemptId,
}: {
  score: number;
  passingGrade: number;
  attempt: number;
  token: string;
  attemptId: string;
}) {
  const gap = Math.max(0, passingGrade - score);
  return (
    <div className="min-h-screen">
      <TopBar title="Posttest" />
      <main className="px-6 py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className={`${CARD} mx-auto w-full max-w-md text-center`}>
            <p className="label-eyebrow text-ink-secondary">Nilai Posttest</p>
            <p className="mt-4 text-[var(--text-hero)] font-bold tabular-nums text-accent">
              {score}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-secondary">
              Passing grade {passingGrade} · Percobaan ke-{attempt}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
              {gap > 0 ? `Kurang ${gap} poin lagi buat lulus. ` : ""}
              Coba lagi kapan pun kamu siap.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <form
                action={async () => {
                  "use server";
                  await startPosttestRetry(token);
                }}
              >
                <Button type="submit">Coba Lagi</Button>
              </form>
              <Button variant="secondary" href="/p">
                Ke Dashboard
              </Button>
            </div>
          </div>
          <details className="group mt-6 border-t border-hairline pt-6">
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
        </div>
      </main>
    </div>
  );
}

function PosttestPassed({
  score,
  attemptId,
  showReview,
}: {
  score: number;
  attemptId: string;
  showReview: boolean;
}) {
  return (
    <div className="min-h-screen">
      <TopBar title="Posttest" />
      <main className="px-6 py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className={`${CARD} mx-auto w-full max-w-md text-center`}>
            <p className="label-eyebrow text-ink-secondary">Nilai Posttest</p>
            <p className="mt-4 text-[var(--text-hero)] font-bold tabular-nums text-accent">
              {score}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-success-soft px-3 py-1.5 text-sm font-semibold text-success">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              Lulus
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
              Kamu lulus posttest. Cek dashboard untuk melihat status dan materi.
            </p>
            <div className="mt-8">
              <Button href="/p">Ke Dashboard</Button>
            </div>
          </div>
          {showReview ? <AnswerReview attemptId={attemptId} /> : null}
        </div>
      </main>
    </div>
  );
}

export default async function PosttestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { activity: { include: { module: true } } },
  });

  if (!participant) {
    return (
      <ExamResult
        title="Link tidak valid"
        body="Hubungi admin untuk mendapatkan link posttest yang benar."
      />
    );
  }

  const activity = participant.activity;

  const failedPosttest = await prisma.attempt.count({
    where: {
      participantId: participant.id,
      section: "POSTTEST",
      submittedAt: { not: null },
      passed: false,
    },
  });

  const phase = activityPhase(activity, new Date());
  if (phase === "CLOSED") {
    return (
      <ExamResult
        title="Kegiatan sudah ditutup"
        body="Hubungi admin untuk info lebih lanjut."
      />
    );
  }
  if (phase !== "POSTTEST") {
    return (
      <ExamResult
        title="Posttest belum dibuka"
        body="Tunggu sampai jadwal posttest dimulai, lalu buka link ini lagi."
      />
    );
  }

  const passedAttempt = await prisma.attempt.findFirst({
    where: { participantId: participant.id, section: "POSTTEST", passed: true },
  });
  if (passedAttempt) {
    return (
      <PosttestPassed
        score={passedAttempt.score ?? 0}
        attemptId={passedAttempt.id}
        showReview={activity.module.showAnswerReview}
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
      section: "POSTTEST",
      submittedAt: null,
    },
    include: { answers: true },
  });

  if (!activeAttempt) {
    const lastSubmitted = await prisma.attempt.findFirst({
      where: {
        participantId: participant.id,
        section: "POSTTEST",
        submittedAt: { not: null },
      },
      orderBy: { submittedAt: "desc" },
    });
    if (lastSubmitted && lastSubmitted.score !== null) {
      return (
        <PosttestFailed
          score={lastSubmitted.score}
          passingGrade={activity.module.posttestPassingGrade}
          attempt={failedPosttest}
          token={token}
          attemptId={lastSubmitted.id}
        />
      );
    }
    return (
      <div className="min-h-screen">
        <TopBar title={activity.title} />
        <StartGate
          eyebrow="Ujian Akhir"
          title="Posttest"
          activity={`${activity.title} · Passing grade ${activity.module.posttestPassingGrade}`}
          durationMin={activity.module.posttestDurationMin}
          questionCount={questions.length}
        >
          <form
            action={async () => {
              "use server";
              await startPosttestRetry(token);
            }}
            className="mt-8"
          >
            <p className="mb-4 rounded-md border border-warning/40 bg-warning-soft px-4 py-3 text-left text-sm leading-relaxed text-ink">
              Ujian hanya bisa dikerjakan <strong>selama sesi posttest
              berlangsung</strong>. Kalau sesi berganti atau waktu habis,
              jawaban terkirim otomatis dan ujian terkunci.
            </p>
            <Button type="submit">Mulai Posttest</Button>
          </form>
        </StartGate>
      </div>
    );
  }

  const deadline = deadlineFor(
    activeAttempt.startedAt,
    activity.module.posttestDurationMin
  );

  const sessionEnd = activity.closedAt;
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
      <PosttestFailed
        score={refreshed.score}
        passingGrade={activity.module.posttestPassingGrade}
        attempt={failedPosttest}
        token={token}
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
      activity.module.shuffleOptions
        ? shuffleWithSeed(q.options, refreshed.seed)
        : q.options
    ).map((o) => ({ id: o.id, text: o.text })),
  }));

  const initialAnswers: Record<string, string> = {};
  for (const a of refreshed.answers) {
    if (a.optionId) initialAnswers[a.questionId] = a.optionId;
  }

  return (
    <ExamScreen
      topBarTitle={activity.title}
      heading={`Posttest · ${activity.title}`}
      attemptId={refreshed.id}
      deadlineISO={deadline.toISOString()}
      sessionEndISO={sessionEnd ? sessionEnd.toISOString() : undefined}
      questions={examQuestions}
      initialAnswers={initialAnswers}
    />
  );
}
