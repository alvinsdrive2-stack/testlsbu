"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate font-mono text-xs text-ink-secondary">{path}</p>
      </div>
      <Button variant="secondary" type="button" onClick={copy}>
        {copied ? "Tersalin" : "Salin Link"}
      </Button>
    </div>
  );
}
