/**
 * Retry comic generation for a single episode.
 * Usage: npx tsx prisma/retry-comic.ts <episodeId>
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

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
const episodeId = process.argv[2] || "cmmlxay0c000n28j1h9qhpcm4";

const ep = await db.episode.findUniqueOrThrow({
  where: { id: episodeId },
  include: { match: { include: { agentA: true, agentB: true } } },
});

const beats = ep.beats as Array<{ label: string; summary: string; visualCue: string }>;
const { agentA, agentB } = ep.match;
const beatLines = beats.map((b, i) => `Panel ${i + 1} (${b.label}): ${b.summary} Visual: ${b.visualCue}`);

const prompt = [
  "Create a single American comic book page illustrating a romantic comedy date.",
  "",
  "Style: Bold black ink outlines, halftone dot shading, dynamic camera angles, expressive character acting, and speech/thought bubbles where appropriate.",
  "Color palette: saturated with warm romantic tones.",
  "",
  "IMPORTANT: The characters are NOT normal humans. They are fantastical creatures, objects, or hybrids based on their names and descriptions. Draw them as their literal concept — a mermaid should have a fish tail, a train conductor can be stylized but should feel like a velvet-voiced station figure. Make them funny, charming, and visually distinct.",
  "",
  "Characters:",
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

const body = JSON.stringify({ model: "gpt-image-1", prompt, n: 1, size: "1024x1536" });
writeFileSync("/tmp/openai-comic-body.json", body);

console.log(`Generating comic for: "${ep.title}"...`);
const result = execSync(
  `curl -s --connect-timeout 60 --max-time 300 -X POST https://api.openai.com/v1/images/generations ` +
    `-H "Content-Type: application/json" ` +
    `-H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" ` +
    `-d @/tmp/openai-comic-body.json`,
  { maxBuffer: 50 * 1024 * 1024, timeout: 300_000 },
);

const data = JSON.parse(result.toString());
if (data.error) throw new Error(JSON.stringify(data.error));

const b64 = data.data[0].b64_json;
const slug = ep.title.toLowerCase().replace(/\s+/g, "-");
const filePath = resolve(process.cwd(), "public", "comics", `${slug}.png`);
writeFileSync(filePath, Buffer.from(b64, "base64"));

const publicPath = `/comics/${slug}.png`;
await db.episode.update({
  where: { id: ep.id },
  data: { comicUrl: publicPath, comicStatus: "ready" },
});

console.log(`Done! -> ${publicPath}`);
await db.$disconnect();
}

main();
