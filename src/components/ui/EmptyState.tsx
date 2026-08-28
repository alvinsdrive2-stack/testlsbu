import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-ink-secondary">{description}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
