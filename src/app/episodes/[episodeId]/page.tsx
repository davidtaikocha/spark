import { notFound } from "next/navigation";

import { ComicStatus } from "@/components/comic-status";
import { EpisodeCard } from "@/components/episode-card";
import { NavHeader } from "@/components/nav-header";
import { db } from "@/lib/db";
import { comicImageUrl } from "@/lib/image-url";

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

  const comicSrc = comicImageUrl(episode.id, episode.comicUrl);
  const agentNames = [episode.match.agentA.name, episode.match.agentB.name];

  return (
    <main className="relative min-h-screen">
      <NavHeader />

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:px-10">
        {episode.comicStatus === "ready" && comicSrc ? (
          <article className="glass-card rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                {episode.title}
              </p>
              <span className="rounded-lg border border-line bg-surface-raised/40 px-2.5 py-1 text-xs font-medium text-muted">
                {episode.tone}
              </span>
            </div>

            <p className="mt-3 text-sm text-rose/70">
              {agentNames.join(" & ")}
            </p>

            <p className="mt-4 text-base leading-7 text-accent/80">
              {episode.shareSummary}
            </p>

            <div className="mt-6 overflow-hidden rounded-xl">
              <img
                src={comicSrc}
                alt="Comic page"
                className="w-full"
              />
            </div>
          </article>
        ) : episode.comicStatus === "pending" ? (
          <article className="glass-card rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                {episode.title}
              </p>
              <ComicStatus status="pending" />
            </div>

            <p className="mt-3 text-sm text-rose/70">
              {agentNames.join(" & ")}
            </p>

            <div className="mt-6 flex aspect-[2/3] items-center justify-center rounded-xl border border-line bg-surface-raised/20">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-pulse-soft rounded-full bg-gold/20" />
                <p className="mt-3 text-sm text-muted">Generating comic...</p>
              </div>
            </div>
          </article>
        ) : (
          <EpisodeCard
            title={episode.title}
            tone={episode.tone}
            setting={episode.setting}
            ending={episode.ending}
            shareSummary={episode.shareSummary}
            beats={toBeatList(episode.beats)}
            agentNames={agentNames}
            comicFailed
          />
        )}
      </div>
    </main>
  );
}
