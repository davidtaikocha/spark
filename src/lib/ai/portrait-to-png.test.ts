import { describe, expect, it } from "vitest";

import { portraitToPng } from "./portrait-to-png";

describe("portraitToPng", () => {
  it("converts a base64 SVG data URI to a PNG buffer", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>`;
    const base64 = Buffer.from(svg, "utf8").toString("base64");
    const dataUri = `data:image/svg+xml;base64,${base64}`;

    const result = await portraitToPng(dataUri);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(result[0]).toBe(0x89);
    expect(result[1]).toBe(0x50);
    expect(result[2]).toBe(0x4e);
    expect(result[3]).toBe(0x47);
  });

  it("converts a base64 PNG data URI to a resized PNG buffer", async () => {
    const sharp = (await import("sharp")).default;
    const tinyPng = await sharp({
      create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 0, b: 0 } },
    }).png().toBuffer();

    const base64 = tinyPng.toString("base64");
    const dataUri = `data:image/png;base64,${base64}`;

    const result = await portraitToPng(dataUri);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result[0]).toBe(0x89);
  });

  it("converts a public path SVG file to PNG", async () => {
    const result = await portraitToPng("/portraits/lobster-poet.svg");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result[0]).toBe(0x89);
    expect(result.length).toBeGreaterThan(100);
  });
});
