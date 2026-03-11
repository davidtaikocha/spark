import { generateEpisodeForMatch } from "@/app/episodes/actions";
import { db } from "@/lib/db";
import { scoreMatch } from "@/lib/matching/score-match";

function toTagList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function getRecommendedMatches(agentId?: string) {
  const agents = await db.agent.findMany({
    where: {
      visibility: "public",
    },
    orderBy: [
      { sourceType: "asc" },
      { createdAt: "asc" },
    ],
    take: 24,
  });

  const primaryAgent = agentId
    ? agents.find((agent) => agent.id === agentId) ?? null
    : agents[0] ?? null;

  if (!primaryAgent) {
    return {
      primaryAgent: null,
      recommendations: [],
    };
  }

  const recommendations = agents
    .filter((agent) => agent.id !== primaryAgent.id)
    .map((agent) => {
      const score = scoreMatch(
        {
          name: primaryAgent.name,
          vibeTags: toTagList(primaryAgent.vibeTags),
          personalityTags: toTagList(primaryAgent.personalityTags),
          weirdHook: primaryAgent.weirdHook,
        },
        {
          name: agent.name,
          vibeTags: toTagList(agent.vibeTags),
          personalityTags: toTagList(agent.personalityTags),
          weirdHook: agent.weirdHook,
        },
      );

      return {
        agentId: agent.id,
        name: agent.name,
        description: agent.description,
        chemistryScore: score.chemistryScore,
        contrastScore: score.contrastScore,
        storyabilityScore: score.storyabilityScore,
        reason: score.reason,
      };
    })
    .sort((left, right) => right.storyabilityScore - left.storyabilityScore)
    .slice(0, 6);

  return {
    primaryAgent: {
      id: primaryAgent.id,
      name: primaryAgent.name,
      description: primaryAgent.description,
      vibeTags: toTagList(primaryAgent.vibeTags),
      personalityTags: toTagList(primaryAgent.personalityTags),
      weirdHook: primaryAgent.weirdHook ?? undefined,
      portraitUrl: primaryAgent.portraitUrl ?? undefined,
      portraitStatus: primaryAgent.portraitStatus,
    },
    recommendations,
  };
}

type CreateEpisodeFromRecommendationInput = {
  agentAId: string;
  agentBId: string;
  reason: string;
  chemistryScore: number;
  contrastScore: number;
  storyabilityScore: number;
};

export async function createEpisodeFromRecommendation(input: CreateEpisodeFromRecommendationInput) {
  const match = await db.match.create({
    data: {
      agentAId: input.agentAId,
      agentBId: input.agentBId,
      selectionMode: "recommended",
      recommendationReason: input.reason,
      chemistryScore: input.chemistryScore,
      contrastScore: input.contrastScore,
      storyabilityScore: input.storyabilityScore,
    },
  });

  const episode = await generateEpisodeForMatch(match.id);

  return {
    episodeId: episode.id,
  };
}
