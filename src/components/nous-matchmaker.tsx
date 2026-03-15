"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  pollNousStatus,
  resolveNousMatch,
  submitNousMatchmaker,
} from "@/app/matches/nous-actions";
import { BoltIcon } from "@/components/icons";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STEPS = [
  {
    lines: [
      "Summoning the agent council\u2026",
      "Sending the profiles to the blockchain\u2026",
      "Staking reputation on romantic chaos\u2026",
    ],
  },
  {
    lines: [
      "Agents are reviewing the candidates\u2026",
      "The council is staking their reputation on this\u2026",
      "Three AIs are arguing about chemistry\u2026",
      "Decentralized deliberation in progress\u2026",
    ],
  },
  {
    lines: [
      "The council is revealing their picks\u2026",
      "Sealed votes are being opened on\u2011chain\u2026",
      "The truth comes out\u2026",
    ],
  },
  {
    lines: [
      "The judge is deliberating\u2026",
      "One agent to rule them all\u2026",
      "Synthesizing the council\u2019s wisdom\u2026",
    ],
  },
  {
    lines: [
      "The council has spoken!",
      "Consensus achieved on\u2011chain\u2026",
      "The oracle reveals its pick\u2026",
    ],
  },
  {
    lines: [
      "Writing the date story no one voted against\u2026",
      "Generating romantic catastrophe\u2026",
      "Crafting a tale of algorithmic destiny\u2026",
      "The AI muses are writing\u2026",
    ],
  },
];

// Map oracle phase (0-6) → step index (0-5)
function phaseToStep(phase: number): number {
  if (phase <= 0) return 0;
  if (phase === 1) return 1;
  if (phase === 2) return 2;
  if (phase === 3) return 3;
  return 4;
}
// Step 5 is used for episode generation after oracle resolves

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function NousOverlay({
  stepIndex,
  elapsed,
}: {
  stepIndex: number;
  elapsed: number;
}) {
  const pickedLines = useRef(STEPS.map((s) => pick(s.lines)));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.06] blur-[120px]" />
        <div className="absolute left-1/2 top-[45%] h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.04] blur-[100px]" />
      </div>

      {/* Grain */}
      <div className="grain-overlay" />

      {/* Content */}
      <div className="relative flex flex-col items-center">
        {/* Blockchain-themed icon */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border border-gold/10 animate-pulse-soft" />
          <div className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-gold/20 to-accent/10 blur-xl animate-pulse-soft" />
          <BoltIcon className="relative h-10 w-10 text-gold/80" />
        </div>

        {/* Step text with crossfade */}
        <div className="relative mt-10 h-6 w-80">
          {pickedLines.current.map((line, i) => (
            <p
              key={i}
              className={`absolute inset-x-0 text-center font-display text-sm tracking-wide transition-all duration-700 ${
                i === stepIndex
                  ? "translate-y-0 opacity-100 text-ink/60"
                  : i < stepIndex
                    ? "-translate-y-3 opacity-0"
                    : "translate-y-3 opacity-0"
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Progress dots */}
        <div className="mt-5 flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-700 ${
                i <= stepIndex ? "w-4 bg-gold/50" : "w-1 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Timer */}
        <p className="mt-6 text-xs tabular-nums text-muted/40">
          {formatElapsed(elapsed)}
        </p>
      </div>
    </div>
  );
}

export function NousMatchmaker({
  primaryAgentId,
}: {
  primaryAgentId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    "idle" | "submitting" | "polling" | "resolving" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [nousRequestId, setNousRequestId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  async function handleSubmit() {
    setState("submitting");
    setStepIndex(0);
    setElapsed(0);
    setError(null);

    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    const result = await submitNousMatchmaker(primaryAgentId);

    if (result.error || !result.nousRequestId) {
      cleanup();
      setError(result.error || "Failed to submit.");
      setState("error");
      return;
    }

    setNousRequestId(result.nousRequestId);
    setState("polling");
    setStepIndex(1);

    // Start polling
    pollRef.current = setInterval(async () => {
      const status = await pollNousStatus(result.nousRequestId!);

      if (status.failed) {
        cleanup();
        setError(status.error || "The oracle council failed to reach consensus.");
        setState("error");
        return;
      }

      setStepIndex(phaseToStep(status.phase));

      if (status.resolved) {
        // Stop polling but keep timer running during episode generation
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setState("resolving");
        setStepIndex(4);

        // Brief pause on "council has spoken", then advance to episode generation step
        setTimeout(() => setStepIndex(5), 2000);

        // If already resolved with episodeId (idempotency)
        if (status.episodeId) {
          router.push(`/episodes/${status.episodeId}`);
          return;
        }

        try {
          const resolution = await resolveNousMatch(result.nousRequestId!);
          cleanup();

          if (resolution.error || !resolution.episodeId) {
            setError(resolution.error || "Failed to resolve match.");
            setState("error");
            return;
          }

          router.push(`/episodes/${resolution.episodeId}`);
        } catch (e) {
          cleanup();
          setError(
            e instanceof Error ? e.message : "Failed to resolve match.",
          );
          setState("error");
        }
      }
    }, 5000);

    // 5 minute timeout
    setTimeout(() => {
      if (stateRef.current === "polling") {
        cleanup();
        setError("The oracle is taking too long. Try again later.");
        setState("error");
      }
    }, 300_000);
  }

  const isActive =
    state === "submitting" || state === "polling" || state === "resolving";

  return (
    <>
      {isActive && <NousOverlay stepIndex={stepIndex} elapsed={elapsed} />}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-accent/10">
            <BoltIcon className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="font-display text-lg text-ink">
              Fate by Consensus
            </p>
            <p className="text-xs text-muted">
              Powered by Nous Oracle on Taiko
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted">
          Let a council of AI agents on the blockchain pick the perfect
          (terrible) match through cryptoeconomic consensus.
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-rose/20 bg-rose/5 px-3 py-2 text-xs text-rose">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isActive}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-gold/80 to-accent px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(201,168,108,0.3)] disabled:cursor-wait disabled:opacity-50"
        >
          {isActive ? "The council is deliberating\u2026" : "Let Nous Decide"}
        </button>
      </div>
    </>
  );
}
