import Link from "next/link";
import { Card } from "@/components/ui/Card";
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
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md p-8 text-center">
        <p className="text-h2 font-semibold">{title}</p>
        <p className="mt-2 text-sm text-ink-secondary">{body}</p>
        {href && hrefLabel ? (
          <Link href={href} className="mt-6 inline-block">
            <Button type="button">{hrefLabel}</Button>
          </Link>
        ) : null}
      </Card>
    </main>
  );
}
