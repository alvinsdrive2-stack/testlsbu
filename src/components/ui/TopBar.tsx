export function TopBar({
  title,
  right,
}: {
  title?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1152px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt="Logo Gapensi"
            className="h-8 w-auto rounded-md"
          />
          <span className="text-base font-bold leading-none tracking-tight text-accent">
            GAPENSI
          </span>
          {title ? (
            <>
              <span aria-hidden className="text-ink-secondary">
                /
              </span>
              <span className="truncate text-sm text-ink-secondary">
                {title}
              </span>
            </>
          ) : null}
        </div>
        {right ? <div className="flex shrink-0 items-center gap-3">{right}</div> : null}
      </div>
    </header>
  );
}
