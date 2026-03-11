import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ episodeId: string }> },
) {
  const { episodeId } = await context.params;

  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    select: { comicUrl: true },
  });

  if (!episode?.comicUrl) {
    return new Response(null, { status: 404 });
  }

  const src = episode.comicUrl;

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

  return Response.redirect(src, 302);
}
