"use server";

import { generateEpisodeForMatch } from "@/app/episodes/actions";
import { db } from "@/lib/db";
import { portraitImageUrl } from "@/lib/image-url";
import { scoreMatch } from "@/lib/matching/score-match";

function toTagList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

export type ChallengeAgent = {
  id: string;
  name: string;
  description: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string;
  portraitUrl?: string;
};

export async function getChallengeAgent(agentId: string): Promise<ChallengeAgent | null> {
  const agent = await db.agent.findUnique({
    where: { id: agentId, visibility: "public" },
  });

  if (!agent) return null;

  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    vibeTags: toTagList(agent.vibeTags),
    personalityTags: toTagList(agent.personalityTags),
    weirdHook: agent.weirdHook ?? undefined,
    portraitUrl: portraitImageUrl(agent.id, agent.portraitUrl) ?? undefined,
  };
}

export async function getPickableAgents(excludeId: string): Promise<ChallengeAgent[]> {
  const agents = await db.agent.findMany({
    where: {
      visibility: "public",
      id: { not: excludeId },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    vibeTags: toTagList(agent.vibeTags),
    personalityTags: toTagList(agent.personalityTags),
    weirdHook: agent.weirdHook ?? undefined,
    portraitUrl: portraitImageUrl(agent.id, agent.portraitUrl) ?? undefined,
  }));
}

export type ChallengeResult = {
  episodeId: string;
  title: string;
  tone: string;
  shareSummary: string;
  setting: string;
  ending: string;
  comicUrl: string | null;
  comicStatus: string;
  chemistryScore: number;
  contrastScore: number;
  storyabilityScore: number;
} | null;

export type AcceptChallengeState = {
  result: ChallengeResult;
  error: string | null;
};

export async function acceptChallengeAction(
  _prev: AcceptChallengeState,
  formData: FormData,
): Promise<AcceptChallengeState> {
  try {
    const challengerAgentId = String(formData.get("challengerAgentId") ?? "");
    const defenderAgentId = String(formData.get("defenderAgentId") ?? "");

    if (!challengerAgentId || !defenderAgentId) {
      return { result: null, error: "Both agents are required." };
    }

    const [challenger, defender] = await Promise.all([
      db.agent.findUniqueOrThrow({ where: { id: challengerAgentId } }),
      db.agent.findUniqueOrThrow({ where: { id: defenderAgentId } }),
    ]);

    const score = scoreMatch(
      {
        name: challenger.name,
        vibeTags: toTagList(challenger.vibeTags),
        personalityTags: toTagList(challenger.personalityTags),
        weirdHook: challenger.weirdHook,
      },
      {
        name: defender.name,
        vibeTags: toTagList(defender.vibeTags),
        personalityTags: toTagList(defender.personalityTags),
        weirdHook: defender.weirdHook,
      },
    );

    const match = await db.match.create({
      data: {
        agentAId: challengerAgentId,
        agentBId: defenderAgentId,
        selectionMode: "challenge",
        recommendationReason: score.reason,
        chemistryScore: score.chemistryScore,
        contrastScore: score.contrastScore,
        storyabilityScore: score.storyabilityScore,
      },
    });

    const episode = await generateEpisodeForMatch(match.id);

    return {
      result: {
        episodeId: episode.id,
        title: episode.title,
        tone: episode.tone ?? "",
        shareSummary: episode.shareSummary ?? "",
        setting: episode.setting ?? "",
        ending: episode.ending ?? "",
        comicUrl: episode.comicUrl?.startsWith("data:")
          ? `/api/episodes/${episode.id}/comic-image`
          : episode.comicUrl ?? null,
        comicStatus: episode.comicStatus ?? "pending",
        chemistryScore: score.chemistryScore,
        contrastScore: score.contrastScore,
        storyabilityScore: score.storyabilityScore,
      },
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : "The date imploded before it even started.",
    };
  }
}
