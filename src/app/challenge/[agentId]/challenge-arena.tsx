"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { BoltIcon, HeartIcon, SwordIcon } from "@/components/icons";
import { CreationOverlay, EPISODE_STEPS } from "@/components/creation-overlay";
import {
  acceptChallengeAction,
  type AcceptChallengeState,
  type ChallengeAgent,
} from "@/app/challenge/actions";
import { scoreMatch } from "@/lib/matching/score-match";

function PortraitSlot({
  agent,
  side,
  empty,
  onClick,
}: {
  agent?: ChallengeAgent;
  side: "left" | "right";
  empty?: boolean;
  onClick?: () => void;
}) {
  const isLeft = side === "left";

  return (
    <div
      className={`relative flex flex-col items-center ${
        isLeft ? "animate-clash-left" : agent ? "animate-clash-right" : ""
      }`}
    >
      {/* Portrait frame */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
          empty
            ? "animate-slot-pulse border-rose/20 cursor-pointer hover:border-rose/40"
            : isLeft
              ? "challenger-glow border-rose/30"
              : "defender-glow border-accent/30"
        }`}
        style={{ width: "min(280px, 38vw)", aspectRatio: "3 / 4" }}
        onClick={empty ? onClick : undefined}
      >
        {agent?.portraitUrl ? (
          <>
            <img
              src={agent.portraitUrl}
              alt={agent.name}
              className="h-full w-full object-cover object-top"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t ${
                isLeft
                  ? "from-[rgba(13,9,15,0.9)] via-[rgba(13,9,15,0.2)] to-[rgba(212,105,138,0.05)]"
                  : "from-[rgba(13,9,15,0.9)] via-[rgba(13,9,15,0.2)] to-[rgba(232,155,114,0.05)]"
              }`}
            />
          </>
        ) : agent ? (
          <div
            className={`flex h-full w-full items-center justify-center ${
              isLeft
                ? "bg-gradient-to-br from-rose/10 via-surface to-surface-raised"
                : "bg-gradient-to-br from-accent/10 via-surface to-surface-raised"
            }`}
          >
            <span className="font-display text-7xl text-ink/10">
              {agent.name.slice(0, 1)}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface via-surface to-surface-raised/60">
            <div className="rounded-full border border-rose/20 p-4">
              <SwordIcon className="h-8 w-8 text-rose/30" />
            </div>
            <p className="text-sm font-medium text-rose/40">Pick your champion</p>
          </div>
        )}

        {/* Agent info overlay */}
        {agent && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p
              className={`text-xs font-medium uppercase tracking-widest ${
                isLeft ? "text-rose/60" : "text-accent/60"
              }`}
            >
              {isLeft ? "Challenger" : "Your champion"}
            </p>
            <p className="mt-1 font-display text-2xl tracking-tight text-ink sm:text-3xl">
              {agent.name}
            </p>
            {agent.weirdHook && (
              <p className="mt-1.5 text-xs leading-5 text-ink/50 line-clamp-2">
                {agent.weirdHook}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tags below portrait */}
      {agent && (
        <div className="mt-3 flex max-w-[280px] flex-wrap justify-center gap-1.5">
          {agent.vibeTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                isLeft
                  ? "bg-rose/10 text-rose/70"
                  : "bg-accent/10 text-accent/70"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VsBadge() {
  return (
    <div className="animate-vs-slam relative flex items-center justify-center">
      {/* Outer ring */}
      <div className="absolute h-20 w-20 rounded-full border border-rose/10 animate-pulse-soft" />
      <div className="absolute h-28 w-28 rounded-full border border-accent/5" />

      {/* Energy crackle lines */}
      <div className="animate-crackle absolute -left-12 top-1/2 h-px w-12 bg-gradient-to-r from-transparent to-rose/40" />
      <div className="animate-crackle absolute -right-12 top-1/2 h-px w-12 bg-gradient-to-l from-transparent to-accent/40" style={{ animationDelay: "0.2s" }} />

      {/* Core */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose/20 via-surface-raised to-accent/20 border border-white/10">
        <span className="vs-glow font-display text-2xl font-bold tracking-tight text-ink">
          VS
        </span>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  max,
  color,
  delay,
}: {
  label: string;
  value: number;
  max: number;
  color: "rose" | "accent" | "gold";
  delay: string;
}) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  const colorMap = {
    rose: { bar: "from-rose/60 to-rose/30", text: "text-rose" },
    accent: { bar: "from-accent/60 to-accent/30", text: "text-accent" },
    gold: { bar: "from-gold/60 to-gold/30", text: "text-gold" },
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted">
          {label}
        </span>
        <span className={`text-sm font-bold tabular-nums ${colorMap[color].text}`}>
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full origin-left animate-score-fill rounded-full bg-gradient-to-r ${colorMap[color].bar}`}
          style={{ width: `${pct}%`, animationDelay: delay }}
        />
      </div>
    </div>
  );
}

function AgentPicker({
  agents,
  selectedId,
  onSelect,
}: {
  agents: ChallengeAgent[];
  selectedId: string | null;
  onSelect: (agent: ChallengeAgent) => void;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 8;
  const totalPages = Math.ceil(agents.length / pageSize);
  const pageAgents = agents.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SwordIcon className="h-4 w-4 text-accent" />
          <p className="text-xs font-medium uppercase tracking-widest text-accent/80">
            Choose your champion
          </p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[10px] tabular-nums text-muted/60">
              {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {pageAgents.map((agent) => {
          const isSelected = agent.id === selectedId;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(agent)}
              className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                isSelected
                  ? "border-accent/50 bg-accent/10 shadow-[0_0_24px_rgba(232,155,114,0.15)]"
                  : "border-line bg-surface/60 hover:border-line-hover hover:bg-surface-raised/40"
              }`}
            >
              <div className="aspect-square overflow-hidden">
                {agent.portraitUrl ? (
                  <img
                    src={agent.portraitUrl}
                    alt={agent.name}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/5 to-surface-raised">
                    <span className="font-display text-4xl text-accent/20">
                      {agent.name.slice(0, 1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="font-display text-sm tracking-tight text-ink line-clamp-1">
                  {agent.name}
                </p>
                <p className="mt-0.5 text-[10px] text-muted line-clamp-1">
                  {agent.weirdHook || agent.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                  <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                    <path d="M3 8.5l3.5 3.5 6.5-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/agents/new"
          className="text-xs font-medium text-muted transition-colors hover:text-accent"
        >
          Or create a brand new agent &rarr;
        </Link>
      </div>
    </div>
  );
}

function ChallengeResultCard({
  result,
  challengerName,
  defenderName,
}: {
  result: NonNullable<AcceptChallengeState["result"]>;
  challengerName: string;
  defenderName: string;
}) {
  const [copied, setCopied] = useState(false);

  function copyShareText() {
    const text = `${challengerName} vs ${defenderName}: "${result.title}" — ${result.shareSummary}\n\nGenerated on Spark`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="animate-reveal-up">
      <div className="glass-card rounded-2xl p-6">
        {/* Header with spark icon */}
        <div className="flex items-center gap-2.5">
          <BoltIcon className="h-5 w-5 text-gold" />
          <p className="text-xs font-medium uppercase tracking-widest text-gold/80">
            Challenge result
          </p>
        </div>

        <p className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {result.title}
        </p>

        <p className="mt-2 text-sm text-rose/70">
          {challengerName} & {defenderName}
        </p>

        <p className="mt-4 text-base leading-7 text-accent/80">
          {result.shareSummary}
        </p>

        {/* Scores row */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          <ScoreBar label="Chemistry" value={result.chemistryScore} max={15} color="rose" delay="0.2s" />
          <ScoreBar label="Contrast" value={result.contrastScore} max={15} color="accent" delay="0.4s" />
          <ScoreBar label="Storyability" value={result.storyabilityScore} max={30} color="gold" delay="0.6s" />
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/episodes/${result.episodeId}`}
            className="rounded-xl bg-gradient-to-r from-rose to-accent px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_32px_rgba(212,105,138,0.35)]"
          >
            Read the full episode &rarr;
          </Link>
          <button
            type="button"
            onClick={copyShareText}
            className="rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink transition-all duration-200 hover:border-line-hover hover:text-white"
          >
            {copied ? "Copied!" : "Share result"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChallengeArena({
  challenger,
  pickableAgents,
}: {
  challenger: ChallengeAgent;
  pickableAgents: ChallengeAgent[];
}) {
  const [defender, setDefender] = useState<ChallengeAgent | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [state, formAction, isPending] = useActionState(acceptChallengeAction, {
    result: null,
    error: null,
  });

  const previewScore = defender
    ? scoreMatch(
        { vibeTags: challenger.vibeTags, personalityTags: challenger.personalityTags, weirdHook: challenger.weirdHook },
        { vibeTags: defender.vibeTags, personalityTags: defender.personalityTags, weirdHook: defender.weirdHook },
      )
    : null;

  return (
    <>
      <CreationOverlay active={isPending} steps={EPISODE_STEPS} estimateSeconds={90} />

      {/* Arena background */}
      <div className="pointer-events-none absolute inset-0 arena-diagonal" aria-hidden="true" />

      {/* Central streak */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/3 h-px arena-streak" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
        {/* Arena header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-rose/20 bg-rose/5 px-4 py-1.5">
            <SwordIcon className="h-3.5 w-3.5 text-rose" />
            <span className="text-xs font-medium uppercase tracking-widest text-rose/80">
              Challenge Arena
            </span>
          </div>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            A date has been{" "}
            <span className="text-gradient-rose">demanded.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted">
            {challenger.name} has thrown down the gauntlet. Pick your champion
            and watch the romantic chaos unfold.
          </p>
        </div>

        {/* VS Arena */}
        <div className="mt-12 flex items-center justify-center gap-4 sm:gap-8 lg:gap-12">
          <PortraitSlot agent={challenger} side="left" />
          <VsBadge />
          <PortraitSlot
            agent={defender ?? undefined}
            side="right"
            empty={!defender}
            onClick={() => setShowPicker(true)}
          />
        </div>

        {/* Score preview */}
        {previewScore && !state.result && (
          <div className="mx-auto mt-8 max-w-md animate-fade-up">
            <div className="glass-card rounded-xl p-5">
              <div className="grid grid-cols-3 gap-4">
                <ScoreBar label="Chemistry" value={previewScore.chemistryScore} max={15} color="rose" delay="0s" />
                <ScoreBar label="Contrast" value={previewScore.contrastScore} max={15} color="accent" delay="0.1s" />
                <ScoreBar label="Storyability" value={previewScore.storyabilityScore} max={30} color="gold" delay="0.2s" />
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-muted">
                {previewScore.reason}
              </p>
            </div>
          </div>
        )}

        {/* Generate button */}
        {defender && !state.result && (
          <div className="mt-8 text-center animate-fade-up stagger-1">
            <form action={formAction}>
              <input type="hidden" name="challengerAgentId" value={challenger.id} />
              <input type="hidden" name="defenderAgentId" value={defender.id} />
              <button
                type="submit"
                disabled={isPending}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-rose to-accent px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,105,138,0.4)] disabled:opacity-50"
              >
                <BoltIcon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                Send them on a date
              </button>
            </form>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="mx-auto mt-6 max-w-md animate-fade-up">
            <div className="rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-center text-sm text-rose">
              {state.error}
            </div>
          </div>
        )}

        {/* Agent picker */}
        {(!defender || showPicker) && !state.result && (
          <div className="mx-auto mt-12 max-w-3xl animate-fade-up">
            <AgentPicker
              agents={pickableAgents}
              selectedId={defender?.id ?? null}
              onSelect={(agent) => {
                setDefender(agent);
                setShowPicker(false);
              }}
            />
          </div>
        )}

        {/* Change champion link */}
        {defender && !showPicker && !state.result && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-xs font-medium text-muted transition-colors hover:text-accent"
            >
              Change your champion
            </button>
          </div>
        )}

        {/* Result */}
        {state.result && defender && (
          <div className="mx-auto mt-12 max-w-2xl">
            <ChallengeResultCard
              result={state.result}
              challengerName={challenger.name}
              defenderName={defender.name}
            />
          </div>
        )}
      </div>
    </>
  );
}
