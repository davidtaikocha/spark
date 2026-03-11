/**
 * Regenerate portraits for all agents using the real OpenAI API (gpt-image-1).
 * Uses curl since Node 25's undici has connect timeout issues with api.openai.com.
 * Usage: npx tsx prisma/regenerate-portraits.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env manually
const envPath = resolve(process.cwd(), ".env");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  let value = trimmed.slice(eqIndex + 1);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
console.log("OPENAI_API_KEY:", OPENAI_API_KEY.slice(0, 20) + "...\n");

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function formatTags(tags: unknown) {
  if (!Array.isArray(tags) || tags.length === 0) return "none";
  return tags.join(", ");
}

function buildPrompt(agent: { name: string; description: string; vibeTags: unknown; personalityTags: unknown; weirdHook: string | null }) {
  return [
    "Create a stylized character portrait for a quirky dating app profile card.",
    "IMPORTANT: The character is NOT a normal human. They are a fantastical creature, object, or hybrid based on their name and description. A 'Lobster Poet' should be an actual lobster (with claws, antennae, shell) wearing a blazer. An 'Opera Toaster' should be an actual chrome toaster with expressive features. A 'Champagne Mermaid' should have a fish tail. Lean into the absurd, literal interpretation — make them funny and charming, not human.",
    "Style: bold dark outlines, flat cel-shaded coloring, expressive cartoon features — like a high-quality illustrated children's book or quirky indie game character. NOT photorealistic, NOT 3D rendered. Exaggerated proportions and playful details.",
    "Palette: warm accent tones — rose-pink, honey-gold, and peach-amber. Mix with the character's own distinctive colors.",
    "Composition: upper body bust shot, single character centered, simple background (either deep dark purple-black or soft warm cream) with a single soft glowing circle or shape behind the character.",
    "Give the character a clear readable silhouette, expressive body language, and one memorable visual detail tied to their weird hook.",
    "",
    `Name: ${agent.name}`,
    `Description: ${agent.description}`,
    `Vibe tags: ${formatTags(agent.vibeTags)}`,
    `Personality tags: ${formatTags(agent.personalityTags)}`,
    agent.weirdHook ? `Weird hook: ${agent.weirdHook}` : "",
  ].filter(Boolean).join("\n");
}

function callOpenAIImageApi(prompt: string): string {
  const body = JSON.stringify({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "medium",
  });

  const tmpBodyFile = "/tmp/openai-portrait-body.json";
  writeFileSync(tmpBodyFile, body);

  const result = execSync(
    `curl -s --connect-timeout 30 --max-time 180 -X POST https://api.openai.com/v1/images/generations ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer ${OPENAI_API_KEY}" ` +
      `-d @${tmpBodyFile}`,
    { maxBuffer: 50 * 1024 * 1024, timeout: 180_000 },
  );

  const data = JSON.parse(result.toString());
  if (data.error) {
    throw new Error(`OpenAI API error: ${JSON.stringify(data.error)}`);
  }

  return data.data[0].b64_json;
}

async function main() {
  const nameFilter = process.argv[2];
  const agents = await db.agent.findMany({
    where: nameFilter ? { name: nameFilter } : undefined,
    select: { id: true, name: true, description: true, vibeTags: true, personalityTags: true, weirdHook: true },
  });

  console.log(`Found ${agents.length} agent(s).\n`);

  for (const agent of agents) {
    console.log(`[${agent.name}]`);

    const prompt = buildPrompt(agent);
    console.log("  Generating portrait...");

    try {
      const b64 = callOpenAIImageApi(prompt);
      const slug = agent.name.toLowerCase().replace(/\s+/g, "-");
      const filePath = resolve(process.cwd(), "public", "portraits", `${slug}.png`);
      writeFileSync(filePath, Buffer.from(b64, "base64"));

      const publicPath = `/portraits/${slug}.png`;
      await db.agent.update({
        where: { id: agent.id },
        data: {
          portraitUrl: publicPath,
          portraitPrompt: prompt,
        },
      });

      console.log(`  Done! -> ${publicPath}\n`);
    } catch (err) {
      console.error(`  FAILED:`, err, "\n");
    }
  }

  await db.$disconnect();
}

main();
