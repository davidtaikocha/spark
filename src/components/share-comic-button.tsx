"use client";

import { useCallback, useState } from "react";

type ShareComicButtonProps = {
  imageUrl: string;
};

export function ShareComicButton({ imageUrl }: ShareComicButtonProps) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "failed">(
    "idle",
  );

  const copyImage = useCallback(async () => {
    if (state === "copying" || state === "copied") return;

    setState("copying");

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const pngBlob =
        blob.type === "image/png" ? blob : await convertToPng(blob);

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);

      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("failed");
      setTimeout(() => setState("idle"), 2200);
    }
  }, [imageUrl, state]);

  const idle = state === "idle";
  const copied = state === "copied";
  const failed = state === "failed";

  return (
    <button
      type="button"
      onClick={copyImage}
      disabled={state === "copying"}
      aria-label={copied ? "Image copied" : "Share comic image"}
      className={`group/share relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold tracking-wide transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none ${
        copied
          ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_24px_rgb(16,185,129,0.15)]"
          : failed
            ? "border border-rose/30 bg-rose/10 text-rose"
            : "border border-rose/20 bg-gradient-to-r from-rose/15 via-rose/10 to-accent/15 text-ink hover:border-rose/40 hover:from-rose/25 hover:via-rose/15 hover:to-accent/25 hover:shadow-[0_0_32px_rgb(var(--rose)/0.15)]"
      }`}
    >
      {/* Shimmer effect on idle */}
      {idle && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      )}

      {/* Icon container */}
      <span className="relative h-4.5 w-4.5">
        {/* Share/copy icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 h-4.5 w-4.5 transition-all duration-300 ${
            idle
              ? "translate-y-0 scale-100 opacity-100 text-rose group-hover/share:text-ink"
              : "-translate-y-3 scale-75 opacity-0"
          }`}
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>

        {/* Checkmark */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 h-4.5 w-4.5 text-emerald-400 transition-all duration-300 ${
            copied
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-75 opacity-0"
          }`}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>

        {/* X icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 h-4.5 w-4.5 text-rose transition-all duration-300 ${
            failed
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-75 opacity-0"
          }`}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>

      {/* Label */}
      <span>
        {state === "copying"
          ? "Copying\u2026"
          : copied
            ? "Copied to clipboard!"
            : failed
              ? "Couldn\u2019t copy"
              : "Share image"}
      </span>
    </button>
  );
}

async function convertToPng(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}
