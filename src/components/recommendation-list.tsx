"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import type { GenerateEpisodeState } from "@/app/matches/actions";

import { CreationOverlay, EPISODE_STEPS } from "./creation-overlay";
import { HeartIcon } from "./icons";

const PAGE_SIZE = 6;

type Recommendation = {
  agentId: string;
  name: string;
  description: string;
  portraitUrl?: string;
  chemistryScore: number;
  contrastScore: number;
  storyabilityScore: number;
  reason: string;
};

type RecommendationListProps = {
  primaryAgentId: string;
  items: Recommendation[];
  action: (prev: GenerateEpisodeState, formData: FormData) => Promise<GenerateEpisodeState>;
};

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gradient-to-r from-rose to-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(212,105,138,0.3)] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Generating..." : "Generate date episode"}
    </button>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface/40 text-muted transition-all duration-200 hover:border-rose/30 hover:text-rose disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPageChange(i)}
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-display text-xs transition-all duration-300 ${
            i === page
              ? "bg-gradient-to-r from-rose to-accent text-white shadow-[0_0_16px_rgba(212,105,138,0.25)]"
              : "border border-line bg-surface/40 text-muted hover:border-rose/20 hover:text-ink"
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        type="button"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface/40 text-muted transition-all duration-200 hover:border-rose/30 hover:text-rose disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RecommendationList({
  primaryAgentId,
  items,
  action,
}: RecommendationListProps) {
  const [state, formAction, isPending] = useActionState(action, {
    episode: null,
    error: null,
  });
  const [page, setPage] = useState(0);
  const router = useRouter();

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    if (state.episode) {
      router.push("/feed");
    }
  }, [state.episode, router]);

  return (
    <>
      <CreationOverlay active={isPending} steps={EPISODE_STEPS} estimateSeconds={90} />

      {state.error && (
        <div className="mb-4 animate-fade-up rounded-2xl border border-rose/20 bg-rose/10 px-5 py-4 text-sm leading-6 text-rose">
          {state.error}
        </div>
      )}

      <div className="grid gap-4">
        {pageItems.map((item) => (
          <article
            key={item.agentId}
            className="glass-card glass-card-hover animate-fade-up rounded-2xl p-5 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              {item.portraitUrl ? (
                <img
                  src={item.portraitUrl}
                  alt={`${item.name} portrait`}
                  className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover object-top"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-raised/40">
                  <span className="font-display text-2xl text-rose/30">
                    {item.name.slice(0, 1)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl text-ink">{item.name}</p>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-rose/15 px-3 py-1.5">
                    <HeartIcon className="h-3.5 w-3.5 text-rose" />
                    <span className="text-sm font-semibold text-rose">
                      {item.storyabilityScore}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-accent/70">{item.reason}</p>

            <form action={formAction} className="mt-5">
              <input type="hidden" name="agentAId" value={primaryAgentId} />
              <input type="hidden" name="agentBId" value={item.agentId} />
              <input type="hidden" name="reason" value={item.reason} />
              <input
                type="hidden"
                name="chemistryScore"
                value={String(item.chemistryScore)}
              />
              <input
                type="hidden"
                name="contrastScore"
                value={String(item.contrastScore)}
              />
              <input
                type="hidden"
                name="storyabilityScore"
                value={String(item.storyabilityScore)}
              />
              <GenerateButton />
            </form>
          </article>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}
