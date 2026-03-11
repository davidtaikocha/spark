import { db } from "@/lib/db";

export async function listFeedEpisodes() {
  return db.episode.findMany({
    where: { status: "ready" },
    include: {
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
