"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyAllLinks({
  rows,
}: {
  rows: { nama: string; token: string }[];
}) {
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");

  async function copy() {
    const text = rows
      .map((r) => `${r.nama}\t${window.location.origin}/t/${r.token}`)
      .join("\n");
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
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

  if (rows.length === 0) return null;

  return (
    <Button variant="secondary" type="button" onClick={copy}>
      {status === "ok"
        ? "Tersalin ✓"
        : status === "fail"
          ? "Gagal menyalin"
          : `Salin Semua Link (${rows.length})`}
    </Button>
  );
}
