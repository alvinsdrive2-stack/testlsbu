import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function ExamResult({
  title,
  body,
  href,
  hrefLabel,
}: {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Reveal>
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-hairline bg-surface p-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          <p className="text-[var(--text-h2)] font-bold tracking-tight text-ink">
            {title}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
            {body}
          </p>
          {href && hrefLabel ? (
            <Button href={href} className="mt-8">
              {hrefLabel}
            </Button>
          ) : null}
        </div>
      </Reveal>
    </main>
  );
}
