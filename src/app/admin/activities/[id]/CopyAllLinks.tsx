"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyAllLinks({
  rows,
}: {
  rows: { nama: string; token: string }[];
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = rows
      .map((r) => `${r.nama}\t${window.location.origin}/t/${r.token}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (rows.length === 0) return null;

  return (
    <Button variant="secondary" type="button" onClick={copy}>
      {copied ? "Tersalin ✓" : `Salin Semua Link (${rows.length})`}
    </Button>
  );
}
