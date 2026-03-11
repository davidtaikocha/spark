import { readFile } from "node:fs/promises";
import path from "node:path";

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const TARGET_SIZE = 512;

function isSvgContent(buf: Buffer): boolean {
  const head = buf.subarray(0, 256).toString("utf8").trimStart();
  return head.startsWith("<svg") || head.startsWith("<?xml");
}

function svgToPng(svgBuffer: Buffer): Buffer {
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: "width", value: TARGET_SIZE },
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}

async function rasterToPng(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: "inside" })
    .png()
    .toBuffer();
}

export async function portraitToPng(portraitSource: string): Promise<Buffer> {
  if (!portraitSource) {
    throw new Error("portraitToPng: empty portrait source");
  }

  if (portraitSource.startsWith("data:")) {
    const commaIndex = portraitSource.indexOf(",");
    const meta = portraitSource.slice(0, commaIndex);
    const base64 = portraitSource.slice(commaIndex + 1);
    const buf = Buffer.from(base64, "base64");

    if (meta.includes("image/svg")) {
      return svgToPng(buf);
    }

    return rasterToPng(buf);
  }

  // Public path like "/portraits/lobster-poet.svg"
  const filePath = path.join(process.cwd(), "public", portraitSource);
  const buf = await readFile(filePath);

  if (portraitSource.endsWith(".svg") || isSvgContent(buf)) {
    return svgToPng(buf);
  }

  return rasterToPng(buf);
}
