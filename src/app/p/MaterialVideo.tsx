"use client";

import { useState } from "react";

export function MaterialVideo({ src, title }: { src: string; title: string }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <video
        controls
        preload="metadata"
        src={src}
        title={title}
        onError={() =>
          setError(
            "Video gagal diputar. Format file mungkin tidak didukung browser ini, atau file rusak. Coba buka di browser lain, atau minta admin ganti file."
          )
        }
        className="aspect-video w-full rounded-md border border-hairline"
      />
      {error ? (
        <p className="mt-2 rounded-md border border-flag/30 bg-flag/10 px-3 py-2 text-sm text-flag">
          {error}
        </p>
      ) : null}
    </div>
  );
}
