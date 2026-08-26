"use client";

import { useEffect, useRef, useState } from "react";

type PlayerEvents = {
  onReady?: () => void;
  onError?: (e: { data: number }) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          width: string;
          height: string;
          playerVars?: Record<string, unknown>;
          events: PlayerEvents;
        }
      ) => { destroy: () => void };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ERROR_BY_CODE: Record<number, string> = {
  2: "ID video tidak valid.",
  5: "Browser kamu gagal memutar video ini.",
  100: "Video sudah tidak tersedia (dihapus atau dibuat private).",
  101: "Video ini tidak mengizinkan ditampilkan di situs lain (embed dibatasi uploader).",
  150: "Video ini tidak mengizinkan ditampilkan di situs lain (embed dibatasi uploader).",
};

const API_LOAD_TIMEOUT_MS = 6000;

export function YouTubeEmbed({
  videoId,
  watchUrl,
}: {
  videoId: string;
  watchUrl: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);
  const failedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const handleError = (e: { data: number }) => {
      if (cancelled) return;
      failedRef.current = true;
      setErrorMsg(ERROR_BY_CODE[e.data] ?? "Video gagal diputar di sini.");
      setStatus("error");
      try {
        playerRef.current?.destroy();
      } catch {}
    };

    const createPlayer = () => {
      if (cancelled || failedRef.current || !window.YT || !mountRef.current)
        return;
      try {
        playerRef.current = new window.YT.Player(mountRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, playsinline: 1 },
          events: {
            onReady: () => {
              if (!cancelled) setStatus("ready");
            },
            onError: handleError,
          },
        });
      } catch {
        failedRef.current = true;
        setErrorMsg("Gagal memuat video. Buka langsung di YouTube.");
        setStatus("error");
      }
    };

    if (window.YT) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    const timer = window.setTimeout(() => {
      if (!cancelled && !failedRef.current && !playerRef.current) {
        failedRef.current = true;
        setErrorMsg("Gagal memuat video. Buka langsung di YouTube.");
        setStatus("error");
      }
    }, API_LOAD_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      try {
        playerRef.current?.destroy();
      } catch {}
    };
  }, [videoId]);

  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-md border border-hairline">
        <div className="relative h-full w-full">
          <div ref={mountRef} className="h-full w-full" />
          {status === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-canvas text-sm text-ink-secondary">
              Memuat video…
            </div>
          ) : null}
          {status === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
              <p className="max-w-md text-[15px] leading-relaxed text-ink-secondary">
                {errorMsg}
              </p>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 ease-out hover:bg-accent-hover active:scale-[0.98]"
              >
                Buka di YouTube
              </a>
            </div>
          ) : null}
        </div>
      </div>
      {status !== "error" ? (
        <p className="mt-2 text-right text-xs text-ink-secondary">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Buka di YouTube ↗
          </a>
        </p>
      ) : null}
    </div>
  );
}
