/**
 * One-off script: copy local SQLite data → production Neon Postgres.
 * Converts file-based portrait/comic URLs to data URIs.
 * Skips the "When Opera Toaster Tried to Serenade the Sommelier" comic image.
 *
 * Usage: DATABASE_URL="postgres://..." npx tsx prisma/seed-production.ts
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const SKIP_COMIC_TITLE =
  "When Opera Toaster Tried to Serenade the Sommelier, and the Wine Bar Went Up in Smoke";

const local = new Database("prisma/dev.db", { readonly: true });
const remote = new PrismaClient();
const publicDir = path.join(process.cwd(), "public");

function fileToDataUri(urlPath: string | null): string | null {
  if (!urlPath) return null;
  if (urlPath.startsWith("data:")) return urlPath;

  const filePath = path.join(publicDir, urlPath);
  if (!existsSync(filePath)) {
    console.warn(`  ⚠ File not found: ${filePath}`);
    return null;
  }

  const buf = readFileSync(filePath);
  if (buf.length < 100) {
    console.warn(`  ⚠ File too small (${buf.length} bytes), skipping: ${filePath}`);
    return null;
  }

  const ext = path.extname(urlPath).toLowerCase();
  const mime =
    ext === ".svg" ? "image/svg+xml" : ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function main() {
  // 1. Agents
  const agents = local
    .prepare("SELECT * FROM Agent")
    .all() as Record<string, unknown>[];
  console.log(`Seeding ${agents.length} agents...`);

  for (const a of agents) {
    const existing = await remote.agent.findUnique({ where: { id: a.id as string } });
    if (existing) {
      console.log(`  ⏭ ${a.name} (already exists)`);
      continue;
    }

    const portraitDataUri = fileToDataUri(a.portraitUrl as string | null);

    await remote.agent.create({
      data: {
        id: a.id as string,
        name: a.name as string,
        description: a.description as string,
        vibeTags: JSON.parse(a.vibeTags as string),
        personalityTags: JSON.parse(a.personalityTags as string),
        weirdHook: (a.weirdHook as string) ?? null,
        portraitUrl: portraitDataUri,
        portraitPrompt: (a.portraitPrompt as string) ?? null,
        portraitStatus: portraitDataUri ? "ready" : "failed",
        sourceType: a.sourceType as string,
        visibility: a.visibility as string,
        createdAt: new Date(a.createdAt as string),
        updatedAt: new Date(a.updatedAt as string),
      },
    });
    console.log(`  ✓ ${a.name}${portraitDataUri ? "" : " (no portrait)"}`);
  }

  // 2. Matches
  const matches = local
    .prepare("SELECT * FROM Match")
    .all() as Record<string, unknown>[];
  console.log(`\nSeeding ${matches.length} matches...`);

  for (const m of matches) {
    const existing = await remote.match.findUnique({ where: { id: m.id as string } });
    if (existing) {
      console.log(`  ⏭ ${m.id} (already exists)`);
      continue;
    }

    await remote.match.create({
      data: {
        id: m.id as string,
        agentAId: m.agentAId as string,
        agentBId: m.agentBId as string,
        selectionMode: m.selectionMode as string,
        chemistryScore: m.chemistryScore as number | null,
        contrastScore: m.contrastScore as number | null,
        storyabilityScore: m.storyabilityScore as number | null,
        recommendationReason: (m.recommendationReason as string) ?? null,
        createdAt: new Date(m.createdAt as string),
        updatedAt: new Date(m.updatedAt as string),
      },
    });
    console.log(`  ✓ ${m.id}`);
  }

  // 3. Episodes
  const episodes = local
    .prepare("SELECT * FROM Episode")
    .all() as Record<string, unknown>[];
  console.log(`\nSeeding ${episodes.length} episodes...`);

  for (const e of episodes) {
    const title = e.title as string;
    const existing = await remote.episode.findUnique({ where: { id: e.id as string } });
    if (existing) {
      console.log(`  ⏭ ${title} (already exists)`);
      continue;
    }

    const skipComic = title === SKIP_COMIC_TITLE;
    const comicDataUri = skipComic
      ? null
      : fileToDataUri(e.comicUrl as string | null);

    await remote.episode.create({
      data: {
        id: e.id as string,
        matchId: e.matchId as string,
        title,
        tone: e.tone as string,
        setting: e.setting as string,
        beats: JSON.parse(e.beats as string),
        ending: e.ending as string,
        shareSummary: e.shareSummary as string,
        status: e.status as string,
        comicUrl: comicDataUri,
        comicStatus: skipComic ? "pending" : (comicDataUri ? "ready" : "failed"),
        createdAt: new Date(e.createdAt as string),
        updatedAt: new Date(e.updatedAt as string),
      },
    });
    console.log(
      `  ✓ ${title}${skipComic ? " (comic skipped)" : comicDataUri ? "" : " (no comic)"}`,
    );
  }

  console.log("\n✅ Done!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    local.close();
    remote.$disconnect();
  });
