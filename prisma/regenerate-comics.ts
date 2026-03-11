/**
 * Regenerate comic images for all episodes using the real OpenAI API.
 * Uses curl since Node 25's undici has connect timeout issues with api.openai.com.
 * Usage: npx tsx prisma/regenerate-comics.ts
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

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

function callOpenAIImageApi(prompt: string): string {
  const body = JSON.stringify({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1536",
  });

  const tmpBodyFile = "/tmp/openai-comic-body.json";
  writeFileSync(tmpBodyFile, body);

  const result = execSync(
    `curl -s --connect-timeout 30 --max-time 300 -X POST https://api.openai.com/v1/images/generations ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer ${OPENAI_API_KEY}" ` +
      `-d @${tmpBodyFile}`,
    { maxBuffer: 50 * 1024 * 1024, timeout: 300_000 },
  );

  const data = JSON.parse(result.toString());
  if (data.error) {
    throw new Error(`OpenAI API error: ${JSON.stringify(data.error)}`);
  }

  return data.data[0].b64_json;
}

async function main() {
  const episodes = await db.episode.findMany({
    include: {
      match: { include: { agentA: true, agentB: true } },
    },
  });

  console.log(`Found ${episodes.length} episode(s).\n`);

  for (const ep of episodes) {
    console.log(`[${ep.id}] "${ep.title}"`);

    const beats = ep.beats as Array<{ label: string; summary: string; visualCue: string }>;
    const { agentA, agentB } = ep.match;

    const beatLines = beats.map((b, i) => `Panel ${i + 1} (${b.label}): ${b.summary} Visual: ${b.visualCue}`);

    const prompt = [
      "Create a single American comic book page illustrating a romantic comedy date.",
      "",
      "Style: Bold black ink outlines, halftone dot shading, dynamic camera angles, expressive character acting, and speech/thought bubbles where appropriate.",
      "Color palette: saturated with warm romantic tones.",
      "",
      "IMPORTANT: The characters are NOT normal humans. They are fantastical creatures, objects, or hybrids based on their names and descriptions. Draw them as their literal concept — a lobster should have claws and a shell, a ghost should be translucent and glowing, a toaster should be a chrome appliance with expressive features, a mermaid should have a fish tail. Make them funny, charming, and visually distinct from each other. They should interact physically in every panel.",
      "",
      `Characters:`,
      `- Character A: ${agentA.name} — ${agentA.description}`,
      `  Weird hook: ${agentA.weirdHook ?? "none"}`,
      `- Character B: ${agentB.name} — ${agentB.description}`,
      `  Weird hook: ${agentB.weirdHook ?? "none"}`,
      "",
      `Setting: ${ep.setting}`,
      "",
      ...beatLines,
      "",
      `Title banner at the top: "${ep.title}"`,
    ].join("\n");

    console.log("  Generating comic...");

    try {
      const b64 = callOpenAIImageApi(prompt);

      const slug = slugify(ep.title);
      const filePath = resolve(process.cwd(), "public", "comics", `${slug}.png`);
      writeFileSync(filePath, Buffer.from(b64, "base64"));

      const publicPath = `/comics/${slug}.png`;
      await db.episode.update({
        where: { id: ep.id },
        data: {
          comicUrl: publicPath,
          comicStatus: "ready",
        },
      });

      console.log(`  Done! -> ${publicPath}\n`);
    } catch (err) {
      console.error(`  FAILED:`, err);
      await db.episode.update({
        where: { id: ep.id },
        data: { comicStatus: "failed" },
      });
    }
  }

  await db.$disconnect();
}

main();
