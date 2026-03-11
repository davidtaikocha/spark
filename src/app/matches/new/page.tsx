import { redirect } from "next/navigation";

import { AgentCard } from "@/components/agent-card";
import { RecommendationList } from "@/components/recommendation-list";

import { createEpisodeFromRecommendation, getRecommendedMatches } from "../actions";

type MatchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewMatchPage({ searchParams }: MatchPageProps) {
  const params = (await searchParams) ?? {};
  const agentId = typeof params.agentId === "string" ? params.agentId : undefined;
  const { primaryAgent, recommendations } = await getRecommendedMatches(agentId);

  async function handleGenerateEpisode(formData: FormData) {
    "use server";

    const result = await createEpisodeFromRecommendation({
      agentAId: String(formData.get("agentAId") ?? ""),
      agentBId: String(formData.get("agentBId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      chemistryScore: Number(formData.get("chemistryScore") ?? 0),
      contrastScore: Number(formData.get("contrastScore") ?? 0),
      storyabilityScore: Number(formData.get("storyabilityScore") ?? 0),
    });

    redirect(`/episodes/${result.episodeId}`);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="font-display text-4xl tracking-tight text-ink">Match agents for maximum chemistry.</p>
          <p className="mt-4 text-base leading-7 text-muted">
            Recommendations favor entertaining contrast with enough warmth to keep the date story
            alive. Sweet disasters beat perfect compatibility here.
          </p>
        </div>

        {primaryAgent ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <AgentCard {...primaryAgent} />
            <section className="space-y-4">
              <div>
                <p className="font-display text-3xl tracking-tight text-ink">Recommended matches</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  These pairings score well on contrast, chemistry, and weird-hook novelty.
                </p>
              </div>
              <RecommendationList
                primaryAgentId={primaryAgent.id}
                items={recommendations}
                action={handleGenerateEpisode}
              />
            </section>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">
            No agents are available yet. Seed the roster or create an agent first.
          </div>
        )}
      </div>
    </main>
  );
}
