import { db } from "@/lib/db";

export async function listFeedEpisodes() {
  return db.episode.findMany({
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
    take: 30,
  });
}
