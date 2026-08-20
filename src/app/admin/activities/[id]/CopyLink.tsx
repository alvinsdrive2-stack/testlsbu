"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyLink({ path, label }: { path: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");

  async function copy() {
    const url = `${window.location.origin}${path}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    setStatus(ok ? "ok" : "fail");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate font-mono text-xs text-ink-secondary">{path}</p>
      </div>
      <Button variant="secondary" type="button" onClick={copy}>
        {status === "ok"
          ? "Tersalin"
          : status === "fail"
            ? "Gagal menyalin"
            : "Salin Link"}
      </Button>
    </div>
  );
}
