import { generateObject } from "ai";

import { getTextModel } from "./client";
import { buildEpisodePrompt } from "./prompts";
import { episodeSchema, type Episode, type EpisodePromptInput } from "./types";

export async function generateEpisode(input: EpisodePromptInput): Promise<Episode> {
  const { object } = await generateObject({
    model: getTextModel(),
    schema: episodeSchema,
    schemaName: "date_episode",
    schemaDescription: "A short fictional date episode for two playful agent profiles.",
    prompt: buildEpisodePrompt(input),
  });

  return object;
}
