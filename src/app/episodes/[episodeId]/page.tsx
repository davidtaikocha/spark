import { notFound } from "next/navigation";

import { EpisodeCard } from "@/components/episode-card";
import { db } from "@/lib/db";

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

type EpisodePageProps = {
  params: Promise<{ episodeId: string }>;
};

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { episodeId } = await params;

  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    include: {
      match: {
        include: {
          agentA: true,
          agentB: true,
        },
      },
    },
  });

  if (!episode) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:px-10">
        <EpisodeCard
          title={episode.title}
          tone={episode.tone}
          setting={episode.setting}
          ending={episode.ending}
          shareSummary={episode.shareSummary}
          beats={toBeatList(episode.beats)}
          agentNames={[episode.match.agentA.name, episode.match.agentB.name]}
        />
      </div>
    </main>
  );
}
