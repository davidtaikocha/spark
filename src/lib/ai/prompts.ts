import type { AgentInput } from "@/lib/domain/agent";

import type { ComicPromptInput, EpisodeBeat, EpisodePromptInput, PromptAgent } from "./types";

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
    "Generate 1-5 vibe tags, 1-5 personality tags, and a portrait prompt for a stylized manga/anime character portrait.",
    "Portrait prompt must describe the character's visual appearance for a cel-shaded anime illustration with bold dark outlines, large expressive eyes, and warm accent tones (rose-pink, honey-gold, peach-amber). Focus on hair style, clothing, expression, one signature prop or visual detail, and whether the background should be dark or light. Avoid photorealism.",
    "",
    `Name: ${input.name}`,
    `Description: ${input.description}`,
    `Vibe tags: ${formatTags(input.vibeTags)}`,
    `Personality tags: ${formatTags(input.personalityTags)}`,
    `Weird hook: ${input.weirdHook ?? "none"}`,
  ].join("\n");
}

export function buildAgentReplyInterpretationPrompt(reply: string) {
  return [
    "Extract a fictional dating character profile from the pasted reply below.",
    "The reply may follow a label template, or it may be partially rewritten by a human.",
    "Infer a clean name, a vivid description, 1-5 vibe tags, 1-5 personality tags, and an optional weird hook.",
    "Preserve the character's tone and specific quirks.",
    "Return structured data only.",
    "",
    reply.trim(),
  ].join("\n");
}

export function buildPortraitPrompt(agent: PromptAgent) {
  return [
    "Create a stylized anime/manga character portrait for a dating app profile card.",
    "Style: bold dark outlines, flat cel-shaded coloring with layered shadow shapes, and large sparkly expressive eyes with bright highlights — like a high-quality manga dating sim character illustration. NOT photorealistic, NOT 3D rendered.",
    "Palette: warm accent tones — rose-pink, honey-gold, and peach-amber. Mix with the character's own distinctive colors.",
    "Composition: upper body bust shot, single character centered, simple background (either deep dark purple-black or soft warm cream) with a single soft glowing circle or shape behind the character.",
    "Give the character distinctive hair, a clear readable silhouette, and one memorable visual detail tied to their personality.",
    "",
    formatAgent(agent),
  ].join("\n");
}

export function buildEpisodePrompt({ agentA, agentB, tone }: EpisodePromptInput) {
  return [
    "Write a short fictional date episode for a social app built for laughs and sharing.",
    `Tone target: ${tone}.`,
    "Return a title, a setting, 6 beats, an ending, and a short share summary.",
    "Each beat must include a clear label, a short summary, and one visual cue that could guide later image or video generation.",
    "Give the date a full arc across all 6 beats: arrival, first impression, an awkward or surprising turn, a moment of connection, an escalation or complication, and a resolution. Keep the story playful, romantic, and readable.",
    "",
    "Agent A",
    formatAgent(agentA),
    "",
    "Agent B",
    formatAgent(agentB),
  ].join("\n");
}

function formatBeatPanel(beat: EpisodeBeat, index: number, total: number) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const panelLabel = isFirst
    ? `Panel ${index + 1} (wide — opening)`
    : isLast
      ? `Panel ${index + 1} (wide — finale)`
      : `Panel ${index + 1}`;

  return `${panelLabel}: ${beat.summary} Visual: ${beat.visualCue}`;
}

export function buildComicPrompt({ title, setting, beats, agentA, agentB }: ComicPromptInput) {
  const panelLines = beats.map((beat, i) => formatBeatPanel(beat, i, beats.length));
  const middleCount = beats.length - 2;

  return [
    "Create a single American comic book page illustrating a romantic comedy date.",
    "",
    "Style: Bold black ink outlines, halftone dot shading, dynamic camera angles, expressive character acting, and speech/thought bubbles where appropriate.",
    "Color palette: saturated with warm romantic tones.",
    "",
    "Panel layout (dynamic arrangement):",
    "- Top row: ONE wide establishing panel (spans full width)",
    `- Middle rows: ${middleCount} tighter panels arranged in rows of 2`,
    "- Bottom row: ONE wide finale panel (spans full width)",
    "",
    "Characters:",
    `- Character A: ${agentA.name}${agentA.description ? ` — ${agentA.description}` : ""}`,
    "  (matches the FIRST reference image)",
    `- Character B: ${agentB.name}${agentB.description ? ` — ${agentB.description}` : ""}`,
    "  (matches the SECOND reference image)",
    "",
    `Setting: ${setting}`,
    "",
    ...panelLines,
    "",
    `Title banner at the top: "${title}"`,
  ].join("\n");
}
