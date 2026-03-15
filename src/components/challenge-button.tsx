"use client";

import { useState } from "react";

import { LinkIcon } from "./icons";

export function ChallengeButton({ agentId }: { agentId: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/challenge/${agentId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition-all duration-200 hover:border-accent/30 hover:text-accent hover:shadow-[0_0_16px_rgba(232,155,114,0.1)]"
    >
      <LinkIcon className="h-4 w-4" />
      <span>{copied ? "Copied!" : "Copy link"}</span>
    </button>
  );
}
