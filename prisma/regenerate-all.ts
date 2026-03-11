/**
 * Regenerate episode stories (via text API) + comic images (via image API)
 * for all seed episodes. Uses curl to avoid Node 25 undici timeout issues.
 * Usage: npx tsx prisma/regenerate-all.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env
for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  let val = trimmed.slice(eq + 1);
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  process.env[trimmed.slice(0, eq)] = val;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
console.log("API key:", OPENAI_API_KEY.slice(0, 20) + "...");
console.log("Text model:", TEXT_MODEL, "\n");

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

function formatTags(tags: unknown) {
  if (!Array.isArray(tags) || tags.length === 0) return "none";
  return tags.join(", ");
}

function formatAgent(agent: { name: string; description: string; vibeTags: unknown; personalityTags: unknown; weirdHook: string | null }) {
  const lines = [`Name: ${agent.name}`, `Description: ${agent.description}`];
  lines.push(`Vibe tags: ${formatTags(agent.vibeTags)}`);
  lines.push(`Personality tags: ${formatTags(agent.personalityTags)}`);
  if (agent.weirdHook) lines.push(`Weird hook: ${agent.weirdHook}`);
  return lines.join("\n");
}

function buildEpisodePrompt(agentA: any, agentB: any, tone: string) {
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

function callOpenAIText(prompt: string): any {
  const schema = {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      tone: { type: "string" as const },
      setting: { type: "string" as const },
      beats: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            label: { type: "string" as const },
            summary: { type: "string" as const },
            visualCue: { type: "string" as const },
          },
          required: ["label", "summary", "visualCue"],
          additionalProperties: false,
        },
      },
      ending: { type: "string" as const },
      shareSummary: { type: "string" as const },
    },
    required: ["title", "tone", "setting", "beats", "ending", "shareSummary"],
    additionalProperties: false,
  };

  const body = JSON.stringify({
    model: TEXT_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_schema", json_schema: { name: "date_episode", strict: true, schema } },
  });

  writeFileSync("/tmp/openai-text-body.json", body);

  const result = execSync(
    `curl -s --connect-timeout 30 --max-time 120 -X POST https://api.openai.com/v1/chat/completions ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer ${OPENAI_API_KEY}" ` +
      `-d @/tmp/openai-text-body.json`,
    { maxBuffer: 10 * 1024 * 1024, timeout: 120_000 },
  );

  const data = JSON.parse(result.toString());
  if (data.error) throw new Error(`OpenAI text error: ${JSON.stringify(data.error)}`);

  return JSON.parse(data.choices[0].message.content);
}

function callOpenAIImage(prompt: string): string {
  const body = JSON.stringify({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1536",
  });

  writeFileSync("/tmp/openai-comic-body.json", body);

  const result = execSync(
    `curl -s --connect-timeout 60 --max-time 300 -X POST https://api.openai.com/v1/images/generations ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer ${OPENAI_API_KEY}" ` +
      `-d @/tmp/openai-comic-body.json`,
    { maxBuffer: 50 * 1024 * 1024, timeout: 300_000 },
  );

  const data = JSON.parse(result.toString());
  if (data.error) throw new Error(`OpenAI image error: ${JSON.stringify(data.error)}`);

  return data.data[0].b64_json;
}

function buildComicPrompt(episode: any, agentA: any, agentB: any) {
  const beats = episode.beats as Array<{ label: string; summary: string; visualCue: string }>;
  const beatLines = beats.map((b, i) => `Panel ${i + 1} (${b.label}): ${b.summary} Visual: ${b.visualCue}`);

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
    "IMPORTANT: The characters are NOT normal humans. They are fantastical creatures, objects, or hybrids based on their names and descriptions. Draw them as their literal concept — a lobster should have claws and a shell, a ghost should be translucent and glowing, a toaster should be a chrome appliance with expressive features, a mermaid should have a fish tail. Make them funny, charming, and visually distinct. They should interact physically in every panel.",
    "",
    "Characters:",
    `- Character A: ${agentA.name} — ${agentA.description}`,
    `  Weird hook: ${agentA.weirdHook ?? "none"}`,
    `- Character B: ${agentB.name} — ${agentB.description}`,
    `  Weird hook: ${agentB.weirdHook ?? "none"}`,
    "",
    `Setting: ${episode.setting}`,
    "",
    ...beatLines,
    "",
    `Title banner at the top: "${episode.title}"`,
  ].join("\n");
}

async function main() {
  const episodes = await db.episode.findMany({
    include: { match: { include: { agentA: true, agentB: true } } },
  });

  console.log(`Found ${episodes.length} episode(s).\n`);

  for (const ep of episodes) {
    const { agentA, agentB } = ep.match;
    console.log(`=== ${agentA.name} & ${agentB.name} ===\n`);

    // Step 1: Regenerate story
    console.log("  [1/2] Generating story...");
    const prompt = buildEpisodePrompt(agentA, agentB, ep.tone);
    const story = callOpenAIText(prompt);
    console.log(`  Title: "${story.title}"`);
    console.log(`  Summary: ${story.shareSummary}\n`);

    // Delete old comic file if it exists
    const oldSlug = slugify(ep.title);
    const oldPath = resolve(process.cwd(), "public", "comics", `${oldSlug}.png`);
    try { require("node:fs").unlinkSync(oldPath); } catch {}

    // Update episode in DB with new story
    await db.episode.update({
      where: { id: ep.id },
      data: {
        title: story.title,
        tone: story.tone,
        setting: story.setting,
        beats: story.beats,
        ending: story.ending,
        shareSummary: story.shareSummary,
        comicStatus: "pending",
        comicUrl: null,
      },
    });

    // Step 2: Generate comic based on new story
    console.log("  [2/2] Generating comic...");
    try {
      const comicPrompt = buildComicPrompt(story, agentA, agentB);
      const b64 = callOpenAIImage(comicPrompt);

      const slug = slugify(story.title);
      const filePath = resolve(process.cwd(), "public", "comics", `${slug}.png`);
      writeFileSync(filePath, Buffer.from(b64, "base64"));

      const publicPath = `/comics/${slug}.png`;
      await db.episode.update({
        where: { id: ep.id },
        data: { comicUrl: publicPath, comicStatus: "ready" },
      });

      console.log(`  Comic -> ${publicPath}\n`);
    } catch (err) {
      console.error(`  Comic FAILED:`, err, "\n");
      await db.episode.update({
        where: { id: ep.id },
        data: { comicStatus: "failed" },
      });
    }
  }

  await db.$disconnect();
  console.log("All done!");
}

main();
