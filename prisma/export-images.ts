/**
 * Export portraits and comics from the DB to ./public as files,
 * then update DB records to use file paths instead of data URIs.
 * Usage: npx tsx prisma/export-images.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const publicDir = resolve(process.cwd(), "public");

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function saveDataUri(dataUri: string, filePath: string) {
  const commaIndex = dataUri.indexOf(",");
  const base64 = dataUri.slice(commaIndex + 1);
  writeFileSync(filePath, Buffer.from(base64, "base64"));
}

async function main() {
  // --- Portraits ---
  const agents = await db.agent.findMany({
    select: { id: true, name: true, portraitUrl: true },
  });

  console.log(`Exporting ${agents.length} portraits...\n`);

  for (const agent of agents) {
    if (!agent.portraitUrl?.startsWith("data:")) {
      console.log(`  ${agent.name}: already a file path, skipping`);
      continue;
    }

    const slug = slugify(agent.name);
    const fileName = `${slug}.png`;
    const filePath = resolve(publicDir, "portraits", fileName);
    const publicPath = `/portraits/${fileName}`;

    saveDataUri(agent.portraitUrl, filePath);

    await db.agent.update({
      where: { id: agent.id },
      data: { portraitUrl: publicPath },
    });

    const sizeMB = (Buffer.byteLength(agent.portraitUrl) / 1024 / 1024).toFixed(1);
    console.log(`  ${agent.name} -> ${publicPath} (${sizeMB} MB)`);
  }

  // --- Comics ---
  mkdirSync(resolve(publicDir, "comics"), { recursive: true });

  const episodes = await db.episode.findMany({
    select: { id: true, title: true, comicUrl: true, comicStatus: true },
  });

  console.log(`\nExporting ${episodes.length} comics...\n`);

  for (const ep of episodes) {
    if (!ep.comicUrl?.startsWith("data:")) {
      console.log(`  "${ep.title}": no data URI, skipping`);
      continue;
    }

    const slug = slugify(ep.title);
    const fileName = `${slug}.png`;
    const filePath = resolve(publicDir, "comics", fileName);
    const publicPath = `/comics/${fileName}`;

    saveDataUri(ep.comicUrl, filePath);

    await db.episode.update({
      where: { id: ep.id },
      data: { comicUrl: publicPath },
    });

    const sizeMB = (Buffer.byteLength(ep.comicUrl) / 1024 / 1024).toFixed(1);
    console.log(`  "${ep.title}" -> ${publicPath} (${sizeMB} MB)`);
  }

  await db.$disconnect();
  console.log("\nDone!");
}

main();
