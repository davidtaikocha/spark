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
    "Create a stylized character portrait for a quirky dating app profile card.",
    "IMPORTANT: The character is NOT a normal human. They are a fantastical creature, object, or hybrid based on their name and description. A 'Lobster Poet' should be an actual lobster (with claws, antennae, shell) wearing a blazer. An 'Opera Toaster' should be an actual chrome toaster with expressive features. A 'Champagne Mermaid' should have a fish tail. Lean into the absurd, literal interpretation — make them funny and charming, not human.",
    "Style: bold dark outlines, flat cel-shaded coloring, expressive cartoon features — like a high-quality illustrated children's book or quirky indie game character. NOT photorealistic, NOT 3D rendered. Exaggerated proportions and playful details.",
    "Palette: warm accent tones — rose-pink, honey-gold, and peach-amber. Mix with the character's own distinctive colors.",
    "Composition: upper body bust shot, single character centered, simple background (either deep dark purple-black or soft warm cream) with a single soft glowing circle or shape behind the character.",
    "Give the character a clear readable silhouette, expressive body language, and one memorable visual detail tied to their weird hook.",
    "",
    formatAgent(agent),
  ].join("\n");
}

export function buildEpisodePrompt({ agentA, agentB, tone }: EpisodePromptInput) {
  return [
    "Write a short fictional date episode for a social app built for laughs and viral sharing.",
    `Tone target: ${tone}.`,
    "Return a title, a setting, 6 beats, an ending, and a short share summary.",
    "",
    "REMEMBER: These characters are NOT humans. They are absurd creatures, objects, or hybrids (a lobster, a toaster, a mermaid, etc). Lean into the physical comedy of what they literally are — claws knocking over glasses, circuits short-circuiting from feelings, tails flipping tables. Their weird hooks MUST drive at least 2 beats of the plot.",
    "",
    "COMEDY RULES:",
    "- Every beat needs a specific, concrete, funny detail — not vague descriptions. Name the exact dish, the exact song, the exact object that breaks.",
    "- Escalate absurdly. If something goes wrong in beat 3, it should be catastrophically worse by beat 5.",
    "- The title should sound like a viral tweet or a meme caption — punchy, weird, instantly shareable.",
    "- The share summary should make someone laugh out loud in under 15 words. Write it like a friend texting about something unhinged they just witnessed.",
    "- Surprise the reader at least twice. Subvert expectations.",
    "- Include at least one moment so specific and absurd it could only happen between THESE two characters.",
    "",
    "ENDINGS — DO NOT default to happy/romantic. Most dates should end in disaster, confusion, chaos, or absurdity. Pick from outcomes like:",
    "- Total catastrophe (the venue is destroyed, someone gets banned for life)",
    "- Awkward ghosting (one character literally vanishes or short-circuits)",
    "- Mutual restraining order energy (they both agree to never speak again)",
    "- Unresolved chaos (the date just... doesn't end, it spirals into something else entirely)",
    "- Bittersweet misfire (they connected but over the wrong thing)",
    "- Accidental property damage or legal consequences",
    "- Only ~20% of dates should end well. When one DOES end happily, it should feel earned and surprising, not default.",
    "",
    "Each beat must include a clear label, a short summary, and one visual cue that could guide comic panel illustration.",
    "Give the date a full arc across all 6 beats: arrival, first impression, an awkward or surprising turn, a twist, an escalation or complication, and a finale.",
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
    "Style: Bold black ink outlines, halftone dot shading, dynamic camera angles, expressive character acting.",
    "Color palette: saturated with warm romantic tones.",
    "",
    "TEXT IS CRITICAL — every panel MUST have at least one of these:",
    "- Speech bubbles with short, punchy dialogue (1-2 sentences max)",
    "- Thought bubbles showing internal panic or scheming",
    "- Narration boxes at the top or bottom of panels for scene-setting",
    "- Sound effects (SFX) in bold stylized lettering (CRASH!, SIZZLE!, *drip drip*)",
    "The text brings the comedy to life. Without it the comic feels empty. Write actual funny dialogue, not placeholder text.",
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
