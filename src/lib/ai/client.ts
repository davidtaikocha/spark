import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "undici";

const defaultTextModel = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
const defaultImageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

/**
 * Node 25's undici has a hardcoded 10s connect timeout which is too short
 * for OpenAI API calls (especially image generation). Use a custom
 * dispatcher with a 120s connect timeout.
 */
const dispatcher = new Agent({ connect: { timeout: 120_000 } });

const openai = createOpenAI({
  fetch: (url, options) =>
    fetch(url, { ...options, dispatcher } as RequestInit),
});

export function getTextModel() {
  return openai(defaultTextModel);
}

export function getImageModel() {
  return openai.image(defaultImageModel);
}

export function getTextModelId() {
  return defaultTextModel;
}

export function getImageModelId() {
  return defaultImageModel;
}
