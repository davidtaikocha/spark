import { generateObject } from "ai";

import type { AgentInput } from "@/lib/domain/agent";

import { getTextModel } from "./client";
import { buildNormalizationPrompt } from "./prompts";
import { normalizedAgentSchema, type NormalizedAgent } from "./types";

export async function normalizeAgent(input: AgentInput): Promise<NormalizedAgent> {
  const { object } = await generateObject({
    model: getTextModel(),
    schema: normalizedAgentSchema,
    schemaName: "normalized_agent",
    schemaDescription: "A normalized fictional dating profile plus portrait prompt.",
    prompt: buildNormalizationPrompt(input),
  });

  return object;
}
