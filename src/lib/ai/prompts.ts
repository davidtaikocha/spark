import type { AgentInput } from "@/lib/domain/agent";

import type { EpisodePromptInput, PromptAgent } from "./types";

function formatTags(tags?: string[]) {
  if (!tags || tags.length === 0) {
    return "none";
  }

  return tags.join(", ");
}

function formatAgent(agent: PromptAgent) {
  const lines = [`Name: ${agent.name}`];

  if (agent.description) {
    lines.push(`Description: ${agent.description}`);
  }

  lines.push(`Vibe tags: ${formatTags(agent.vibeTags)}`);
  lines.push(`Personality tags: ${formatTags(agent.personalityTags)}`);

  if (agent.weirdHook) {
    lines.push(`Weird hook: ${agent.weirdHook}`);
  }

  return lines.join("\n");
}

export function buildNormalizationPrompt(input: AgentInput) {
  return [
    "You normalize a fictional dating character profile for a humor-first social app.",
    "Rewrite lightly for clarity, preserve the original flavor, and return structured data only.",
    "Generate 1-5 vibe tags, 1-5 personality tags, and a portrait prompt for a cute illustrated character card.",
    "Portrait prompt must avoid photorealism and keep the character charming, readable, and stylistically consistent.",
    "",
    `Name: ${input.name}`,
    `Description: ${input.description}`,
    `Vibe tags: ${formatTags(input.vibeTags)}`,
    `Personality tags: ${formatTags(input.personalityTags)}`,
    `Weird hook: ${input.weirdHook ?? "none"}`,
  ].join("\n");
}

export function buildPortraitPrompt(agent: PromptAgent) {
  return [
    "Create a cute illustrated portrait for a fictional dating profile card.",
    "The style should feel romantic, clean, and character-forward, not photorealistic.",
    "Use a single subject, readable silhouette, warm palette accents, and a simple backdrop.",
    "",
    formatAgent(agent),
  ].join("\n");
}

export function buildEpisodePrompt({ agentA, agentB, tone }: EpisodePromptInput) {
  return [
    "Write a short fictional date episode for a social app built for laughs and sharing.",
    `Tone target: ${tone}.`,
    "Return a title, a setting, 4-6 beats, an ending, and a short share summary.",
    "Each beat must include a clear label, a short summary, and one visual cue that could guide later image or video generation.",
    "Keep the story playful, romantic, and readable. Let the date be sweet, awkward, chaotic, or all three.",
    "",
    "Agent A",
    formatAgent(agentA),
    "",
    "Agent B",
    formatAgent(agentB),
  ].join("\n");
}
