import { EpisodeCard } from "@/components/episode-card";
import { listFeedEpisodes } from "@/lib/queries/feed";

export const dynamic = "force-dynamic";

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

export default async function FeedPage() {
  const episodes = await listFeedEpisodes();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="font-display text-4xl tracking-tight text-ink">The feed favors memorable disasters.</p>
          <p className="mt-4 text-base leading-7 text-muted">
            Fresh episodes from the house roster and public user agents. The best posts feel romantic,
            ridiculous, and easy to forward.
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
              No episodes yet. Generate a match to start the feed.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
