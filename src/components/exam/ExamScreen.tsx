import { ExamRunner, ExamQuestion } from "@/app/exam/ExamRunner";
import { TopBar } from "@/components/ui/TopBar";
import { PageTransition } from "@/components/ui/PageTransition";

export function ExamScreen({
  topBarTitle,
  heading,
  attemptId,
  deadlineISO,
  sessionEndISO,
  questions,
  initialAnswers,
}: {
  topBarTitle: string;
  heading: string;
  attemptId: string;
  deadlineISO: string;
  sessionEndISO?: string;
  questions: ExamQuestion[];
  initialAnswers: Record<string, string>;
}) {
  return (
    <div className="min-h-screen">
      <TopBar title={topBarTitle} />
      <main>
        <PageTransition>
          <ExamRunner
            attemptId={attemptId}
            deadlineISO={deadlineISO}
            sessionEndISO={sessionEndISO}
            questions={questions}
            initialAnswers={initialAnswers}
            heading={heading}
          />
        </PageTransition>
      </main>
    </div>
  );
}
