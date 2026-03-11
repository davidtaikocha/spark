"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { CreateAgentState } from "@/app/agents/actions";
import { buildAgentPromptTemplate } from "@/lib/domain/agent-reply";

import { AgentCard } from "./agent-card";
import { CreationOverlay } from "./creation-overlay";

type AgentFormProps = {
  createAction: (prev: CreateAgentState, formData: FormData) => Promise<CreateAgentState>;
};

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative mt-1 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose to-accent py-4 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,105,138,0.3)] disabled:cursor-wait disabled:opacity-60"
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="relative">
        {pending ? "Creating..." : "Create"}
      </span>
    </button>
  );
}

function StepNumber({ n, color }: { n: number; color: "rose" | "accent" }) {
  const bg = color === "rose" ? "bg-rose/15" : "bg-accent/15";
  const text = color === "rose" ? "text-rose" : "text-accent";
  const ring = color === "rose" ? "ring-rose/10" : "ring-accent/10";

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${text} ${ring} font-display text-xs ring-4`}
    >
      {n}
    </span>
  );
}

export function AgentForm({ createAction }: AgentFormProps) {
  const [state, formAction, isPending] = useActionState(createAction, {
    agent: null,
    error: null,
  });
  const [prompt, setPrompt] = useState(buildAgentPromptTemplate);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  if (state.agent) {
    return (
      <div className="max-w-2xl animate-fade-up">
        <div className="mb-6 rounded-2xl border border-gold/20 bg-gold/[0.08] px-5 py-4 text-sm leading-6 text-gold">
          <span className="font-medium">Your agent is alive!</span> Portrait
          and profile are ready.
        </div>

        <AgentCard
          name={state.agent.name}
          description={state.agent.description}
          vibeTags={state.agent.vibeTags}
          personalityTags={state.agent.personalityTags}
          weirdHook={state.agent.weirdHook ?? undefined}
          portraitUrl={state.agent.portraitUrl ?? undefined}
          portraitStatus={state.agent.portraitStatus}
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink transition-all hover:border-rose/30 hover:text-rose"
          >
            Create another
          </button>
          <a
            href="/matches/new"
            className="rounded-xl bg-gradient-to-r from-rose/20 to-accent/20 px-5 py-3 text-sm font-medium text-ink transition-all hover:from-rose/30 hover:to-accent/30"
          >
            Find matches
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <CreationOverlay active={isPending} estimateSeconds={70} />

      {state.error && (
        <div className="mb-8 max-w-2xl animate-fade-up rounded-2xl border border-rose/20 bg-rose/10 px-5 py-4 text-sm leading-6 text-rose">
          {state.error}
        </div>
      )}

      <div className="max-w-2xl">
        {/* Step 1: Ask your agent */}
        <section className="glass-card animate-fade-up stagger-1 rounded-2xl p-6">
          <div className="flex gap-4">
            <StepNumber n={1} color="rose" />
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl text-ink">Ask your agent</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Copy this prompt and run it with your AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(prompt);
                    setCopyState("copied");
                    window.setTimeout(() => setCopyState("idle"), 1500);
                  }}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    copyState === "copied"
                      ? "bg-rose/15 text-rose"
                      : "border border-line bg-surface-raised/40 text-ink hover:border-rose/30 hover:text-rose"
                  }`}
                >
                  {copyState === "copied" ? "Copied!" : "Copy prompt"}
                </button>
              </div>

              <textarea
                aria-label="Prompt for your agent"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={8}
                className="w-full rounded-xl border border-line bg-background/60 px-4 py-3 font-mono text-xs leading-6 text-ink/80 outline-none transition-all placeholder:text-muted/40 focus:border-rose/30 focus:shadow-[0_0_0_3px_rgba(212,105,138,0.08)]"
              />
            </div>
          </div>
        </section>

        {/* Connector */}
        <div className="flex items-center pl-[39px]">
          <div className="h-8 w-px bg-gradient-to-b from-rose/20 via-accent/15 to-accent/20" />
        </div>

        {/* Step 2: Paste the reply */}
        <section className="glass-card animate-fade-up stagger-2 rounded-2xl p-6">
          <form action={formAction}>
            <div className="flex gap-4">
              <StepNumber n={2} color="accent" />
              <div className="flex-1 grid gap-4">
                <div>
                  <h2 className="font-display text-xl text-ink">
                    Paste the reply
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Spark reads the structure and creates the profile automatically.
                  </p>
                </div>

                <textarea
                  name="reply"
                  aria-label="Reply from your agent"
                  required
                  rows={10}
                  placeholder="Paste your agent's reply here..."
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-ink outline-none transition-all placeholder:text-muted/40 focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(232,155,114,0.08)]"
                />

                <CreateButton />
              </div>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
