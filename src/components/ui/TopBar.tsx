import Image from "next/image";

export function TopBar({
  title,
  right,
}: {
  title?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[2304px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/favicon.png"
            alt="Logo Gapensi"
            width={64}
            height={64}
            className="h-8 w-auto rounded-md"
            priority
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
