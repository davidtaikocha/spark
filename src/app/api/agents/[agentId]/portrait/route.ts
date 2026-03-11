import { writeFileSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { generatePortrait } from "@/lib/ai/generate-portrait";
import { db } from "@/lib/db";

function toTagList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function completePortraitGeneration(agentId: string) {
  const agent = await db.agent.findUniqueOrThrow({
    where: { id: agentId },
  });

  try {
    const portrait = await generatePortrait({
      name: agent.name,
      description: agent.description,
      vibeTags: toTagList(agent.vibeTags),
      personalityTags: toTagList(agent.personalityTags),
      weirdHook: agent.weirdHook,
    });

    const slug = agent.name.toLowerCase().replace(/\s+/g, "-");
    const fileName = `${slug}.png`;
    const filePath = path.join(process.cwd(), "public", "portraits", fileName);
    writeFileSync(filePath, Buffer.from(portrait.image.base64, "base64"));

    return await db.agent.update({
      where: { id: agentId },
      data: {
        portraitPrompt: portrait.prompt,
        portraitStatus: "ready",
        portraitUrl: `/portraits/${fileName}`,
      },
    });
  } catch (error) {
    await db.agent.update({
      where: { id: agentId },
      data: {
        portraitStatus: "failed",
      },
    });

    throw error;
  }
}

export async function POST(_request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;

  const agent = await completePortraitGeneration(agentId);

  return NextResponse.json({
    id: agent.id,
    portraitStatus: agent.portraitStatus,
  });
}
