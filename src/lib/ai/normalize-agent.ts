import { generateText, Output } from "ai";

import type { AgentInput } from "@/lib/domain/agent";

import { getTextModel } from "./client";
import { mockNormalizeAgent, shouldUseMockAi } from "./mock";
import { buildNormalizationPrompt } from "./prompts";
import { normalizedAgentSchema, type NormalizedAgent } from "./types";

export async function normalizeAgent(input: AgentInput): Promise<NormalizedAgent> {
  if (shouldUseMockAi()) {
    return mockNormalizeAgent(input);
  }

  const prompt = buildNormalizationPrompt(input);

  const { output } = await generateText({
    model: getTextModel(),
    output: Output.object({ schema: normalizedAgentSchema, name: "normalized_agent" }),
    prompt,
  });

  if (!output) {
    throw new Error("No structured output returned from agent normalization");
  }

  return output;
}
