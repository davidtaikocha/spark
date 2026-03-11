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

  const promptText = buildComicPrompt(input);
  const referenceImages = [portraits.agentA, portraits.agentB].filter(
    (buf) => buf.length > 0,
  );

  const prompt =
    referenceImages.length > 0
      ? { text: promptText, images: referenceImages }
      : promptText;

  const { image } = await generateImage({
    model: getImageModel(),
    prompt,
    size: "1024x1536",
  });

  return {
    image: { base64: image.base64, mediaType: image.mediaType ?? "image/png" },
    prompt: promptText,
    model: getImageModelId(),
  };
}
