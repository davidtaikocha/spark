import { createOpenAI } from "@ai-sdk/openai";

const defaultTextModel = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
const defaultImageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

/**
 * Node 25's undici has a hardcoded 10s connect timeout which is too short
 * for OpenAI API calls (especially image generation). Use a custom
 * dispatcher with a 120s connect timeout. On older Node versions (Vercel
 * serverless), this isn't needed.
 */
function makeCustomFetch(): typeof fetch | undefined {
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major < 25) return undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Agent } = require("undici");
    const dispatcher = new Agent({ connect: { timeout: 120_000 } });
    return (url: Parameters<typeof fetch>[0], options?: Parameters<typeof fetch>[1]) =>
      fetch(url, { ...options, dispatcher } as RequestInit);
  } catch {
    return undefined;
  }
}

const customFetch = makeCustomFetch();

const openai = createOpenAI({
  ...(customFetch ? { fetch: customFetch } : {}),
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
