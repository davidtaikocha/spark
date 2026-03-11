import { generateImage } from "ai";

import { getImageModel, getImageModelId } from "./client";
import { buildPortraitPrompt } from "./prompts";
import type { PortraitResult, PromptAgent } from "./types";

export async function generatePortrait(agent: PromptAgent): Promise<PortraitResult> {
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
    image,
    prompt,
    model: getImageModelId(),
  };
}
