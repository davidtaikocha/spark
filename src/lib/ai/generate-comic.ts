import { generateImage } from "ai";

import { getImageModel, getImageModelId } from "./client";
import { mockGenerateComicPage, shouldUseMockAi } from "./mock";
import { buildComicPrompt } from "./prompts";
import type { ComicPromptInput, ComicResult } from "./types";

export async function generateComicPage(
  input: ComicPromptInput,
  portraits: { agentA: Buffer; agentB: Buffer },
): Promise<ComicResult> {
  if (shouldUseMockAi()) {
    return mockGenerateComicPage(input);
  }

  const prompt = buildComicPrompt(input);
  const { image } = await generateImage({
    model: getImageModel(),
    prompt: {
      images: [portraits.agentA, portraits.agentB],
      text: prompt,
    },
    size: "1024x1536" as `${number}x${number}`,
  });

  return {
    image: {
      base64: image.base64,
      mediaType: image.mediaType,
    },
    prompt,
    model: getImageModelId(),
  };
}
