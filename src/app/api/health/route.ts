import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const info: Record<string, unknown> = {
    dbUrl: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":***@")
      : "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    const count = await db.agent.count();
    info.status = "ok";
    info.agentCount = count;
  } catch (e: unknown) {
    info.status = "error";
    info.error = e instanceof Error ? e.message : String(e);
    info.stack = e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined;
  }

  return NextResponse.json(info);
}
