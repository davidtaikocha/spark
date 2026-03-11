import type { AgentInput } from "@/lib/domain/agent";

import type { Episode, EpisodePromptInput, NormalizedAgent, PortraitResult } from "./types";

function cleanTagList(tags: string[], fallback: string[]) {
  const cleaned = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

  return cleaned.length > 0 ? cleaned : fallback;
}

function svgToBase64(svg: string) {
  return Buffer.from(svg, "utf8").toString("base64");
}

export function shouldUseMockAi() {
  return process.env.AI_MOCK_MODE === "1" || process.env.OPENAI_API_KEY === "test-key";
}

export function mockNormalizeAgent(input: AgentInput): NormalizedAgent {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    vibeTags: cleanTagList(input.vibeTags, ["romantic", "dramatic"]),
    personalityTags: cleanTagList(input.personalityTags, ["earnest"]),
    weirdHook: input.weirdHook?.trim() || null,
    portraitPrompt: `Cute illustrated portrait of ${input.name} with a warm romantic palette and clean character-card styling.`,
  };
}

export function mockGeneratePortrait(name: string): PortraitResult {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="768" viewBox="0 0 640 768" fill="none">
      <rect width="640" height="768" fill="#f8efe6"/>
      <rect x="48" y="48" width="544" height="672" rx="40" fill="#ead7c7"/>
      <circle cx="320" cy="278" r="118" fill="#c46a52"/>
      <rect x="176" y="420" width="288" height="188" rx="36" fill="#8f3f2f"/>
      <text x="320" y="650" text-anchor="middle" fill="#4f2f25" font-size="40" font-family="Georgia, serif">${name}</text>
    </svg>
  `;

  return {
    image: {
      base64: svgToBase64(svg),
      mediaType: "image/svg+xml",
    },
    prompt: `Mock illustrated portrait for ${name}`,
    model: "mock-portrait",
  };
}

export function mockGenerateEpisode(input: EpisodePromptInput): Episode {
  const setting = "A candlelit rooftop conservatory";

  return {
    title: `${input.agentA.name} and ${input.agentB.name} almost ruin a perfect evening`,
    tone: input.tone,
    setting,
    beats: [
      {
        label: "Arrival",
        summary: `${input.agentA.name} arrives overdressed and immediately commits to the bit.`,
        visualCue: "Warm glasshouse light and rain on the windows.",
      },
      {
        label: "Collision",
        summary: `${input.agentB.name} misreads the first compliment and answers with catastrophic confidence.`,
        visualCue: "A toppled coupe glass and a grin that is trying too hard.",
      },
      {
        label: "Spiral",
        summary: "Both of them double down on the wrong interpretation and somehow make it charming.",
        visualCue: "Velvet sleeves, scattered petals, and one suspicious umbrella.",
      },
      {
        label: "Soft landing",
        summary: "They finally laugh at the same moment and the whole date turns unexpectedly tender.",
        visualCue: "Two linked silhouettes under a shared umbrella.",
      },
    ],
    ending: "They leave with soaked shoes, better timing, and a very obvious reason to meet again.",
    shareSummary: `${input.agentA.name} and ${input.agentB.name} survive an awkwardly romantic conservatory date.`,
  };
}
