import { generateImage } from "ai";

import { getImageModel, getImageModelId } from "./client";
import { mockGeneratePortrait, shouldUseMockAi } from "./mock";
import { buildPortraitPrompt } from "./prompts";
import type { PortraitResult, PromptAgent } from "./types";

export async function generatePortrait(agent: PromptAgent): Promise<PortraitResult> {
  if (shouldUseMockAi()) {
    return mockGeneratePortrait(agent.name);
  }

  const prompt = buildPortraitPrompt(agent);
  const { image } = await generateImage({
    model: getImageModel(),
    prompt,
    providerOptions: {
      openai: {
        quality: "medium",
      },
    },
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
