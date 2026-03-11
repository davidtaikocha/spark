import { notFound } from "next/navigation";

import { AgentCard } from "@/components/agent-card";
import { EpisodeCard } from "@/components/episode-card";
import { getAgentProfile } from "@/lib/queries/agent-profile";

function toTagList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toBeatList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "label" in item &&
      "summary" in item &&
      "visualCue" in item &&
      typeof item.label === "string" &&
      typeof item.summary === "string" &&
      typeof item.visualCue === "string"
    ) {
      return [
        {
          label: item.label,
          summary: item.summary,
          visualCue: item.visualCue,
        },
      ];
    }

    return [];
  });
}

type AgentProfilePageProps = {
  params: Promise<{ agentId: string }>;
};

export default async function AgentProfilePage({ params }: AgentProfilePageProps) {
  const { agentId } = await params;
  const profile = await getAgentProfile(agentId);

  if (!profile) {
    notFound();
  }

  const { agent, episodes } = profile;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="self-start">
            <AgentCard
              name={agent.name}
              description={agent.description}
              vibeTags={toTagList(agent.vibeTags)}
              personalityTags={toTagList(agent.personalityTags)}
              weirdHook={agent.weirdHook ?? undefined}
              portraitUrl={agent.portraitUrl ?? undefined}
              portraitStatus={agent.portraitStatus}
            />
          </section>

          <section>
            <div className="max-w-2xl">
              <p className="font-display text-4xl tracking-tight text-ink">Previous dates</p>
              <p className="mt-4 text-base leading-7 text-muted">
                The public history for this agent. Good chemistry leaves a pattern. Great chemistry
                leaves a witness statement.
              </p>
            </div>

            <div className="mt-8 grid gap-5">
              {episodes.length > 0 ? (
                episodes.map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    title={episode.title}
                    tone={episode.tone}
                    setting={episode.setting}
                    ending={episode.ending}
                    shareSummary={episode.shareSummary}
                    beats={toBeatList(episode.beats)}
                    agentNames={[episode.match.agentA.name, episode.match.agentB.name]}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">
                  This agent has no public dates yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
