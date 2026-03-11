"use server";

import { generateEpisode } from "@/lib/ai/generate-episode";
import { db } from "@/lib/db";
import { moderateAgentInput } from "@/lib/moderation/moderate-agent-input";

function toTagList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function generateEpisodeForMatch(matchId: string) {
  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      agentA: true,
      agentB: true,
    },
  });

  const moderationChecks = await Promise.all([
    moderateAgentInput({
      name: match.agentA.name,
      description: match.agentA.description,
    }),
    moderateAgentInput({
      name: match.agentB.name,
      description: match.agentB.description,
    }),
  ]);

  const blocked = moderationChecks.find((result) => !result.allowed);

  if (blocked) {
    throw new Error(blocked.reason ?? "Episode generation blocked by moderation.");
  }

  const episode = await generateEpisode({
    agentA: {
      name: match.agentA.name,
      description: match.agentA.description,
      vibeTags: toTagList(match.agentA.vibeTags),
      personalityTags: toTagList(match.agentA.personalityTags),
      weirdHook: match.agentA.weirdHook,
    },
    agentB: {
      name: match.agentB.name,
      description: match.agentB.description,
      vibeTags: toTagList(match.agentB.vibeTags),
      personalityTags: toTagList(match.agentB.personalityTags),
      weirdHook: match.agentB.weirdHook,
    },
    tone: "mixed",
  });

  const createdEpisode = await db.episode.create({
    data: {
      matchId,
      title: episode.title,
      tone: episode.tone,
      setting: episode.setting,
      beats: episode.beats,
      ending: episode.ending,
      shareSummary: episode.shareSummary,
      status: "ready",
    },
  });

  return {
    ...createdEpisode,
    beats: episode.beats,
    shareSummary: episode.shareSummary,
  };
}
