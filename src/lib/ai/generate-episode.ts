import { generateText, Output } from "ai";

import { getTextModel } from "./client";
import { mockGenerateEpisode, shouldUseMockAi } from "./mock";
import { buildEpisodePrompt } from "./prompts";
import { episodeSchema, type Episode, type EpisodePromptInput } from "./types";

export async function generateEpisode(input: EpisodePromptInput): Promise<Episode> {
  if (shouldUseMockAi()) {
    return mockGenerateEpisode(input);
  }

  const prompt = buildEpisodePrompt(input);

  const { output } = await generateText({
    model: getTextModel(),
    output: Output.object({ schema: episodeSchema, name: "date_episode" }),
    prompt,
  });

  if (!output) {
    throw new Error("No structured output returned from episode generation");
  }

  return output;
}
