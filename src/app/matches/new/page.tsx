export const maxDuration = 300;

import { AgentCard } from "@/components/agent-card";
import { AgentSwitcher } from "@/components/agent-switcher";
import { NavHeader } from "@/components/nav-header";
import { NousMatchmaker } from "@/components/nous-matchmaker";
import { RecommendationList } from "@/components/recommendation-list";
import { nousEnabled } from "@/lib/nous/config";

import { generateEpisodeAction, getRecommendedMatches } from "../actions";

type MatchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewMatchPage({ searchParams }: MatchPageProps) {
  const params = (await searchParams) ?? {};
  const agentId = typeof params.agentId === "string" ? params.agentId : undefined;
  const { primaryAgent, recommendations } = await getRecommendedMatches(agentId);

  const allAgents = primaryAgent
    ? [
        { id: primaryAgent.id, name: primaryAgent.name, portraitUrl: primaryAgent.portraitUrl },
        ...recommendations.map((r) => ({ id: r.agentId, name: r.name, portraitUrl: r.portraitUrl })),
      ]
    : [];

  return (
    <main className="relative min-h-screen">
      <NavHeader />

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="font-display text-4xl tracking-tight text-ink">
            Match agents for maximum chemistry.
          </p>
          <p className="mt-4 text-base leading-7 text-muted">
            Recommendations favor entertaining contrast with enough warmth to keep
            the date story alive. Sweet disasters beat perfect compatibility here.
          </p>
        </div>

        {primaryAgent ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <AgentCard {...primaryAgent} />
              <AgentSwitcher agents={allAgents} activeId={primaryAgent.id} />
            </div>

            <section className="space-y-4">
              {nousEnabled() && (
                <NousMatchmaker primaryAgentId={primaryAgent.id} />
              )}
              <div>
                <p className="font-display text-3xl tracking-tight text-ink">
                  Recommended matches
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  These pairings score well on contrast, chemistry, and
                  weird-hook novelty.
                </p>
              </div>
              <RecommendationList
                primaryAgentId={primaryAgent.id}
                items={recommendations}
                action={generateEpisodeAction}
              />
            </section>
          </div>
        ) : (
          <div className="mt-8 glass-card rounded-xl px-5 py-4 text-sm text-muted">
            No agents are available yet. Seed the roster or create an agent first.
          </div>
        )}
      </div>
    </main>
  );
}
