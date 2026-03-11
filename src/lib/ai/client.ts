import { openai } from "@ai-sdk/openai";

const defaultTextModel = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
const defaultImageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

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
