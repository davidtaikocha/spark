/**
 * Sync remote Neon Postgres → local SQLite via psql JSON dump.
 * Bypasses proxy issues by using `env -i` to run psql in a clean environment.
 *
 * Usage: npx tsx scripts/sync-remote-to-local.ts
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const CONNSTR =
  "postgresql://neondb_owner:npg_pSoyVsci03NJ@ep-soft-bonus-ahnxyr1d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const PSQL = "/opt/homebrew/opt/libpq/bin/psql";

function queryRemote(sql: string): string {
  return execSync(
    `env -i HOME="$HOME" PATH="$PATH" ${PSQL} "${CONNSTR}" -t -A -c "${sql}"`,
    { maxBuffer: 200 * 1024 * 1024, timeout: 60_000 },
  ).toString();
}

function fetchJsonRows(table: string, columns: string[]): unknown[] {
  // Use COPY with CSV to avoid json_agg memory issues with large data URIs.
  // Fetch rows one-by-one via row_to_json to keep memory bounded.
  const sql = `SELECT row_to_json(t) FROM (SELECT ${columns.map((c) => `\\\"${c}\\\"`).join(", ")} FROM \\\"${table}\\\" ORDER BY \\\"createdAt\\\" ASC) t;`;
  const raw = queryRemote(sql).trim();
  if (!raw) return [];
  return raw.split("\n").map((line) => JSON.parse(line));
}

async function main() {
  console.log("Fetching agents from remote...");
  const agents = fetchJsonRows("Agent", [
    "id", "name", "description", "vibeTags", "personalityTags", "weirdHook",
    "portraitUrl", "portraitPrompt", "portraitStatus", "sourceType", "visibility",
    "createdAt", "updatedAt",
  ]) as Record<string, unknown>[];
  console.log(`  ${agents.length} agents`);

  console.log("Fetching matches from remote...");
  const matches = fetchJsonRows("Match", [
    "id", "agentAId", "agentBId", "selectionMode", "chemistryScore",
    "contrastScore", "storyabilityScore", "recommendationReason",
    "createdAt", "updatedAt",
  ]) as Record<string, unknown>[];
  console.log(`  ${matches.length} matches`);

  console.log("Fetching episodes from remote...");
  const episodes = fetchJsonRows("Episode", [
    "id", "matchId", "title", "tone", "setting", "beats", "ending",
    "shareSummary", "status", "comicUrl", "comicStatus", "createdAt", "updatedAt",
  ]) as Record<string, unknown>[];
  console.log(`  ${episodes.length} episodes`);

  console.log("\nLoading into local SQLite...");
  const local = new PrismaClient({ datasourceUrl: "file:./dev.db" });

  await local.episode.deleteMany();
  await local.match.deleteMany();
  await local.agent.deleteMany();

  for (const a of agents) {
    await local.agent.create({
      data: {
        id: a.id as string,
        name: a.name as string,
        description: a.description as string,
        vibeTags: a.vibeTags as object,
        personalityTags: a.personalityTags as object,
        weirdHook: (a.weirdHook as string) ?? null,
        portraitUrl: (a.portraitUrl as string) ?? null,
        portraitPrompt: (a.portraitPrompt as string) ?? null,
        portraitStatus: a.portraitStatus as string,
        sourceType: a.sourceType as string,
        visibility: a.visibility as string,
        createdAt: new Date(a.createdAt as string),
        updatedAt: new Date(a.updatedAt as string),
      },
    });
  }
  console.log(`  Inserted ${agents.length} agents`);

  for (const m of matches) {
    await local.match.create({
      data: {
        id: m.id as string,
        agentAId: m.agentAId as string,
        agentBId: m.agentBId as string,
        selectionMode: m.selectionMode as string,
        chemistryScore: (m.chemistryScore as number) ?? null,
        contrastScore: (m.contrastScore as number) ?? null,
        storyabilityScore: (m.storyabilityScore as number) ?? null,
        recommendationReason: (m.recommendationReason as string) ?? null,
        createdAt: new Date(m.createdAt as string),
        updatedAt: new Date(m.updatedAt as string),
      },
    });
  }
  console.log(`  Inserted ${matches.length} matches`);

  for (const e of episodes) {
    await local.episode.create({
      data: {
        id: e.id as string,
        matchId: e.matchId as string,
        title: e.title as string,
        tone: e.tone as string,
        setting: e.setting as string,
        beats: e.beats as object,
        ending: e.ending as string,
        shareSummary: e.shareSummary as string,
        status: e.status as string,
        comicUrl: (e.comicUrl as string) ?? null,
        comicStatus: e.comicStatus as string,
        createdAt: new Date(e.createdAt as string),
        updatedAt: new Date(e.updatedAt as string),
      },
    });
  }
  console.log(`  Inserted ${episodes.length} episodes`);

  await local.$disconnect();
  console.log("\nDone!");
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
