import { db } from "@/lib/db";
import { portraitImageUrl } from "@/lib/image-url";

export async function getAgentProfile(agentId: string) {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    return null;
  }

  const episodes = await db.episode.findMany({
    where: {
      status: "ready",
      match: {
        OR: [{ agentAId: agentId }, { agentBId: agentId }],
      },
    },
    include: {
      match: {
        include: {
          agentA: true,
          agentB: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return {
    agent: { ...agent, portraitUrl: portraitImageUrl(agent.id, agent.portraitUrl) },
    episodes,
  };
}
