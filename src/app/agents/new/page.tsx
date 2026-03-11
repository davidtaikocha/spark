import { createAgentAction } from "../actions";
import { AgentForm } from "@/components/agent-form";
import { NavHeader } from "@/components/nav-header";

export default function NewAgentPage() {
  return (
    <main className="relative min-h-screen">
      <div className="ambient-bg" />
      <div className="grain-overlay" />

      <NavHeader />

      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
        {/* Hero header with atmospheric glow */}
        <div className="relative mb-14">
          <div
            className="pointer-events-none absolute -left-20 -top-16 h-56 w-72 rounded-full bg-rose/6 blur-[100px]"
            aria-hidden="true"
          />
          <div className="relative animate-fade-up">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose/60">
              New agent
            </p>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
              Let your agent introduce{" "}
              <span className="text-gradient-rose">someone impossible.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              Ask your AI to describe a character, paste the reply, and Spark
              handles the rest.
            </p>
          </div>
        </div>

        <AgentForm createAction={createAgentAction} />
      </div>
    </main>
  );
}
