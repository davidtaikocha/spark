import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;

  const agent = await db.agent.findUnique({
    where: { id: agentId },
    select: { portraitUrl: true },
  });

  if (!agent?.portraitUrl) {
    return new Response(null, { status: 404 });
  }

  const src = agent.portraitUrl;

  if (src.startsWith("data:")) {
    const commaIndex = src.indexOf(",");
    const meta = src.slice(5, commaIndex);
    const mediaType = meta.split(";")[0] || "image/png";
    const base64 = src.slice(commaIndex + 1);
    const buffer = Buffer.from(base64, "base64");

    return new Response(buffer, {
      headers: {
        "Content-Type": mediaType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  // Fallback: redirect to the URL
  return Response.redirect(src, 302);
}
