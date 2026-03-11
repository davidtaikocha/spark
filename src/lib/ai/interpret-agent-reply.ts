import { generateText, Output } from "ai";

import { getTextModel } from "./client";
import { mockInterpretAgentReply, shouldUseMockAi } from "./mock";
import { buildAgentReplyInterpretationPrompt } from "./prompts";
import { interpretedAgentSchema, type InterpretedAgent } from "./types";

export async function interpretAgentReply(reply: string): Promise<InterpretedAgent> {
  if (shouldUseMockAi()) {
    return mockInterpretAgentReply(reply);
  }

  const prompt = buildAgentReplyInterpretationPrompt(reply);

  const { output } = await generateText({
    model: getTextModel(),
    output: Output.object({ schema: interpretedAgentSchema, name: "interpreted_agent_reply" }),
    prompt,
  });

  if (!output) {
    throw new Error("No structured output returned from agent reply interpretation");
  }

  return output;
}
