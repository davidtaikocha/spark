import { db } from "@/lib/db";
import { comicImageUrl, portraitImageUrl } from "@/lib/image-url";

export const FEED_PAGE_SIZE = 10;

export async function listFeedEpisodes(page = 1) {
  const skip = (page - 1) * FEED_PAGE_SIZE;

  const [rawEpisodes, total] = await Promise.all([
    db.episode.findMany({
      where: { status: "ready" },
      select: {
        id: true,
        matchId: true,
        title: true,
        tone: true,
        setting: true,
        beats: true,
        ending: true,
        shareSummary: true,
        status: true,
        comicStatus: true,
        comicUrl: true,
        createdAt: true,
        updatedAt: true,
        match: {
          include: {
            agentA: true,
            agentB: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: FEED_PAGE_SIZE,
    }),
    db.episode.count({ where: { status: "ready" } }),
  ]);

  const episodes = rawEpisodes.map((e) => ({
    ...e,
    comicUrl: comicImageUrl(e.id, e.comicUrl),
    match: {
      ...e.match,
      agentA: { ...e.match.agentA, portraitUrl: portraitImageUrl(e.match.agentA.id, e.match.agentA.portraitUrl) },
      agentB: { ...e.match.agentB, portraitUrl: portraitImageUrl(e.match.agentB.id, e.match.agentB.portraitUrl) },
    },
  }));

  return {
    episodes,
    total,
    page,
    totalPages: Math.ceil(total / FEED_PAGE_SIZE),
  };
}
