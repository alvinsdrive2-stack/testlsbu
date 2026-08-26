"use client";

import { useState } from "react";

export function MaterialPdf({ src, title }: { src: string; title: string }) {
  const [error, setError] = useState(false);

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-hairline">
        <iframe
          src={src}
          title={title}
          onError={() => setError(true)}
          className="h-[800px] w-full"
        />
      </div>
      {error ? (
        <p className="mt-2 rounded-md border border-flag/30 bg-flag/10 px-3 py-2 text-sm text-flag">
          PDF gagal dimuat. File mungkin terhapus atau rusak. Hubungi admin.
        </p>
      ) : null}
    </div>
  );
}
