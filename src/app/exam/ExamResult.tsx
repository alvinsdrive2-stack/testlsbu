import Link from "next/link";
import { Button } from "@/components/ui/Button";

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
      <div className="w-full max-w-md border-y border-hairline py-16 text-center">
        <p className="text-[var(--text-h2)] font-bold tracking-tight">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{body}</p>
        {href && hrefLabel ? (
          <Link href={href} className="mt-8 inline-block">
            <Button type="button">{hrefLabel}</Button>
          </Link>
        ) : null}
      </div>
    </main>
  );
}
