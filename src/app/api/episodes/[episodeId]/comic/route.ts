import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { generateComicPage } from "@/lib/ai/generate-comic";
import { portraitToPng } from "@/lib/ai/portrait-to-png";
import { db } from "@/lib/db";

function toTagList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function completeComicGeneration(episodeId: string) {
  const episode = await db.episode.findUniqueOrThrow({
    where: { id: episodeId },
    include: {
      match: {
        include: {
          agentA: true,
          agentB: true,
        },
      },
    },
  });

  try {
    const [agentAPng, agentBPng] = await Promise.all([
      portraitToPng(episode.match.agentA.portraitUrl ?? ""),
      portraitToPng(episode.match.agentB.portraitUrl ?? ""),
    ]);

    const comic = await generateComicPage(
      {
        title: episode.title,
        setting: episode.setting,
        beats: episode.beats as Array<{ label: string; summary: string; visualCue: string }>,
        agentA: {
          name: episode.match.agentA.name,
          description: episode.match.agentA.description,
          vibeTags: toTagList(episode.match.agentA.vibeTags),
          personalityTags: toTagList(episode.match.agentA.personalityTags),
          weirdHook: episode.match.agentA.weirdHook,
        },
        agentB: {
          name: episode.match.agentB.name,
          description: episode.match.agentB.description,
          vibeTags: toTagList(episode.match.agentB.vibeTags),
          personalityTags: toTagList(episode.match.agentB.personalityTags),
          weirdHook: episode.match.agentB.weirdHook,
        },
      },
      { agentA: agentAPng, agentB: agentBPng },
    );

    const slug = episode.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const fileName = `${slug}.png`;
    const comicsDir = path.join(process.cwd(), "public", "comics");
    mkdirSync(comicsDir, { recursive: true });
    writeFileSync(path.join(comicsDir, fileName), Buffer.from(comic.image.base64, "base64"));

    return await db.episode.update({
      where: { id: episodeId },
      data: {
        comicUrl: `/comics/${fileName}`,
        comicStatus: "ready",
      },
    });
  } catch (error) {
    await db.episode.update({
      where: { id: episodeId },
      data: { comicStatus: "failed" },
    });

    throw error;
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ episodeId: string }> },
) {
  const { episodeId } = await context.params;

  const episode = await completeComicGeneration(episodeId);

  return NextResponse.json({
    id: episode.id,
    comicStatus: episode.comicStatus,
  });
}
