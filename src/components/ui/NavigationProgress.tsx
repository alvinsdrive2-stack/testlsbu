"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

const TIMEOUT_MS = 10_000;

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;

      const sameUrl =
        url.pathname === location.pathname && url.search === location.search;
      if (sameUrl) return;

      setActive(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="animate-nav-fade pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
    >
      <div className="relative size-16">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-hairline-strong border-t-accent" />
        <Image
          src="/favicon.png"
          alt=""
          width={28}
          height={28}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
        />
      </div>
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
