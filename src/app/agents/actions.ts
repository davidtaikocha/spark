"use server";

import { completePortraitGeneration } from "@/app/api/agents/[agentId]/portrait/route";
import { agentInputSchema } from "@/lib/domain/agent";
import { db } from "@/lib/db";
import { normalizeAgent } from "@/lib/ai/normalize-agent";

type CreateAgentInput = {
  name: string;
  description: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string;
};

export async function createAgent(input: CreateAgentInput) {
  const parsed = agentInputSchema.parse({
    ...input,
    weirdHook: input.weirdHook?.trim() || undefined,
    sourceType: "user",
    visibility: "public",
  });

  const normalized = await normalizeAgent(parsed);
  const agent = await db.agent.create({
    data: {
      name: normalized.name,
      description: normalized.description,
      vibeTags: normalized.vibeTags,
      personalityTags: normalized.personalityTags,
      weirdHook: normalized.weirdHook ?? parsed.weirdHook,
      portraitPrompt: normalized.portraitPrompt,
      portraitStatus: "pending",
      sourceType: "user",
      visibility: "public",
    },
  });

  await queuePortraitGeneration(agent.id);

  return { agent };
}

async function queuePortraitGeneration(_agentId: string) {
  void completePortraitGeneration(_agentId).catch(() => undefined);
}
