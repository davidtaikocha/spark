# Episode Comic Page Generation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate an American comic book–style image for each episode that composes all beats into a single dynamic panel layout, making the comic the primary episode experience with text beats as a fallback.

**Architecture:** Async generation (fire-and-forget) matching the portrait generation pattern. Episode text is created first (`status: "ready"`), then comic image generation is queued (`comicStatus: "pending" → "ready" | "failed"`). Portraits are converted to PNG and passed as reference images to the image model.

**Tech Stack:** Prisma (SQLite), Vercel AI SDK (`ai` package), `@ai-sdk/openai` (gpt-image-1), `sharp` (raster resize), `@resvg/resvg-js` (SVG rasterization), Next.js server actions + API routes, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-03-11-episode-comic-generation-design.md`

---

## Chunk 1: Foundation — Schema, Dependencies, Types

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install sharp and resvg-js**

```bash
pnpm add sharp @resvg/resvg-js
pnpm add -D @types/sharp
```

- [ ] **Step 2: Verify install succeeded**

Run: `pnpm exec tsc --noEmit 2>&1 | tail -5`
Expected: No errors (clean output)

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add sharp and resvg-js for comic image generation"
```

---

### Task 2: Add comicUrl and comicStatus to Episode schema

**Files:**
- Modify: `prisma/schema.prisma:44-57`

- [ ] **Step 1: Add fields to Episode model**

In `prisma/schema.prisma`, add two fields to the `Episode` model after the `status` field (line 53):

```prisma
model Episode {
  id           String   @id @default(cuid())
  matchId      String
  title        String
  tone         String
  setting      String
  beats        Json
  ending       String
  shareSummary String
  status       String
  comicUrl     String?
  comicStatus  String   @default("pending")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  match        Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-episode-comic-fields
```

Expected: Migration created and applied successfully.

- [ ] **Step 3: Verify Prisma client regenerated**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add comicUrl and comicStatus fields to Episode model"
```

---

### Task 3: Add ComicPromptInput and ComicResult types

**Files:**
- Modify: `src/lib/ai/types.ts`

- [ ] **Step 1: Add types at end of file**

Append to `src/lib/ai/types.ts` after the `PortraitResult` type (after line 64):

```ts
export type ComicPromptInput = {
  title: string;
  setting: string;
  beats: EpisodeBeat[];
  agentA: PromptAgent;
  agentB: PromptAgent;
};

export type ComicResult = {
  image: {
    base64: string;
    mediaType: string;
  };
  prompt: string;
  model: string;
};
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/types.ts
git commit -m "feat: add ComicPromptInput and ComicResult types"
```

---

## Chunk 2: Portrait Conversion Utility

### Task 4: Write portraitToPng with tests

**Files:**
- Create: `src/lib/ai/portrait-to-png.ts`
- Create: `src/lib/ai/portrait-to-png.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/ai/portrait-to-png.test.ts`:

```ts
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
    // Create a tiny 1x1 red PNG via sharp for test input
    const sharp = (await import("sharp")).default;
    const tinyPng = await sharp({
      create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 0, b: 0 } },
    }).png().toBuffer();

    const base64 = tinyPng.toString("base64");
    const dataUri = `data:image/png;base64,${base64}`;

    const result = await portraitToPng(dataUri);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result[0]).toBe(0x89); // PNG magic byte
  });

  it("converts a public path SVG file to PNG", async () => {
    // Uses an actual SVG from the public directory
    const result = await portraitToPng("/portraits/lobster-poet.svg");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result[0]).toBe(0x89); // PNG magic byte
    expect(result.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/ai/portrait-to-png.test.ts 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement portraitToPng**

Create `src/lib/ai/portrait-to-png.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/ai/portrait-to-png.test.ts 2>&1 | tail -10`
Expected: All 3 tests PASS

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/portrait-to-png.ts src/lib/ai/portrait-to-png.test.ts
git commit -m "feat: add portraitToPng utility for comic image generation"
```

---

## Chunk 3: Comic Prompt Builder, Mock, and Generation Function

### Task 5: Add buildComicPrompt with test

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.test.ts`

- [ ] **Step 1: Write failing test**

In `src/lib/ai/prompts.test.ts`, merge `buildComicPrompt` into the existing import on line 1 (change `import { buildEpisodePrompt } from "./prompts"` to `import { buildComicPrompt, buildEpisodePrompt } from "./prompts"`). Then append a new describe block:

```ts
describe("buildComicPrompt", () => {
  it("includes agent names, setting, beat summaries, and panel layout", () => {
    const prompt = buildComicPrompt({
      title: "Rooftop Disaster",
      setting: "A rooftop greenhouse",
      agentA: { name: "Lobster Poet" },
      agentB: { name: "Ghost DJ" },
      beats: [
        { label: "Arrival", summary: "They arrive overdressed.", visualCue: "Rain on glass." },
        { label: "Spark", summary: "A tray tips.", visualCue: "Petals falling." },
        { label: "Turn", summary: "Joke lands badly.", visualCue: "Crooked candle." },
        { label: "Connect", summary: "A confession.", visualCue: "Wide eyes." },
        { label: "Escalate", summary: "Double down.", visualCue: "Laughter." },
        { label: "Finale", summary: "They laugh together.", visualCue: "Linked umbrellas." },
      ],
    });

    expect(prompt).toContain("Lobster Poet");
    expect(prompt).toContain("Ghost DJ");
    expect(prompt).toContain("A rooftop greenhouse");
    expect(prompt).toContain("Rooftop Disaster");
    expect(prompt).toContain("comic book");
    expect(prompt).toContain("wide — opening");
    expect(prompt).toContain("wide — finale");
    expect(prompt).toContain("They arrive overdressed.");
    expect(prompt).toContain("They laugh together.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ai/prompts.test.ts 2>&1 | tail -10`
Expected: FAIL — `buildComicPrompt` is not exported

- [ ] **Step 3: Implement buildComicPrompt**

Add to the end of `src/lib/ai/prompts.ts` (add the import for `ComicPromptInput` and `EpisodeBeat` from `./types` at the top):

```ts
import type { ComicPromptInput, EpisodeBeat, EpisodePromptInput, PromptAgent } from "./types";
```

Then add the function at the bottom:

```ts
function formatBeatPanel(beat: EpisodeBeat, index: number, total: number) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const panelLabel = isFirst
    ? `Panel ${index + 1} (wide — opening)`
    : isLast
      ? `Panel ${index + 1} (wide — finale)`
      : `Panel ${index + 1}`;

  return `${panelLabel}: ${beat.summary} Visual: ${beat.visualCue}`;
}

export function buildComicPrompt({ title, setting, beats, agentA, agentB }: ComicPromptInput) {
  const panelLines = beats.map((beat, i) => formatBeatPanel(beat, i, beats.length));
  const middleCount = beats.length - 2;

  return [
    "Create a single American comic book page illustrating a romantic comedy date.",
    "",
    "Style: Bold black ink outlines, halftone dot shading, dynamic camera angles, expressive character acting, and speech/thought bubbles where appropriate.",
    "Color palette: saturated with warm romantic tones.",
    "",
    "Panel layout (dynamic arrangement):",
    "- Top row: ONE wide establishing panel (spans full width)",
    `- Middle rows: ${middleCount} tighter panels arranged in rows of 2`,
    "- Bottom row: ONE wide finale panel (spans full width)",
    "",
    "Characters:",
    `- Character A: ${agentA.name}${agentA.description ? ` — ${agentA.description}` : ""}`,
    "  (matches the FIRST reference image)",
    `- Character B: ${agentB.name}${agentB.description ? ` — ${agentB.description}` : ""}`,
    "  (matches the SECOND reference image)",
    "",
    `Setting: ${setting}`,
    "",
    ...panelLines,
    "",
    `Title banner at the top: "${title}"`,
  ].join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ai/prompts.test.ts 2>&1 | tail -10`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat: add buildComicPrompt for comic page generation"
```

---

### Task 6: Add mockGenerateComicPage

**Files:**
- Modify: `src/lib/ai/mock.ts`

- [ ] **Step 1: Add mock function**

Add to the end of `src/lib/ai/mock.ts`. Add `ComicPromptInput` and `ComicResult` to the imports from `./types`:

```ts
import type {
  ComicPromptInput,
  ComicResult,
  Episode,
  EpisodePromptInput,
  InterpretedAgent,
  NormalizedAgent,
  PortraitResult,
} from "./types";
```

Then add the function:

```ts
export function mockGenerateComicPage(input: ComicPromptInput): ComicResult {
  const panelColors = ["#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51", "#264653", "#6d6875"];
  const panelCount = input.beats.length;

  const panelRects = input.beats.map((beat, i) => {
    const isFirst = i === 0;
    const isLast = i === panelCount - 1;
    const color = panelColors[i % panelColors.length];

    if (isFirst) {
      return `<rect x="20" y="60" width="600" height="120" rx="6" fill="${color}"/>
        <text x="320" y="110" text-anchor="middle" fill="white" font-size="14" font-family="Georgia, serif">${beat.label}</text>
        <text x="320" y="130" text-anchor="middle" fill="white" font-size="11" font-family="Georgia, serif">${input.agentA.name} arrives</text>`;
    }

    if (isLast) {
      const y = 200 + Math.ceil((panelCount - 2) / 2) * 160;
      return `<rect x="20" y="${y}" width="600" height="120" rx="6" fill="${color}"/>
        <text x="320" y="${y + 50}" text-anchor="middle" fill="white" font-size="14" font-family="Georgia, serif">${beat.label}</text>
        <text x="320" y="${y + 70}" text-anchor="middle" fill="white" font-size="11" font-family="Georgia, serif">Finale</text>`;
    }

    const middleIndex = i - 1;
    const row = Math.floor(middleIndex / 2);
    const col = middleIndex % 2;
    const x = 20 + col * 310;
    const y = 200 + row * 160;

    return `<rect x="${x}" y="${y}" width="290" height="140" rx="6" fill="${color}"/>
      <text x="${x + 145}" y="${y + 60}" text-anchor="middle" fill="white" font-size="14" font-family="Georgia, serif">${beat.label}</text>
      <text x="${x + 145}" y="${y + 80}" text-anchor="middle" fill="white" font-size="10" font-family="Georgia, serif">${beat.summary.slice(0, 40)}</text>`;
  });

  const totalHeight = 60 + 120 + 20 + Math.ceil((panelCount - 2) / 2) * 160 + 120 + 40;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${totalHeight}" viewBox="0 0 640 ${totalHeight}" fill="none">
    <rect width="640" height="${totalHeight}" fill="#1a1328"/>
    <text x="320" y="35" text-anchor="middle" fill="#f0e6dc" font-size="18" font-family="Georgia, serif">${input.title}</text>
    ${panelRects.join("\n    ")}
  </svg>`;

  return {
    image: {
      base64: Buffer.from(svg, "utf8").toString("base64"),
      mediaType: "image/svg+xml",
    },
    prompt: `Mock comic page for ${input.agentA.name} and ${input.agentB.name}`,
    model: "mock-comic",
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/mock.ts
git commit -m "feat: add mockGenerateComicPage for development mode"
```

---

### Task 7: Add generateComicPage with test

**Files:**
- Create: `src/lib/ai/generate-comic.ts`
- Create: `src/lib/ai/generate-comic.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/ai/generate-comic.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { generateComicPage } from "./generate-comic";

describe("generateComicPage", () => {
  it("returns a comic result with base64 image in mock mode", async () => {
    const portraits = {
      agentA: Buffer.from("fake-png-a"),
      agentB: Buffer.from("fake-png-b"),
    };

    const result = await generateComicPage(
      {
        title: "A Rooftop Disaster",
        setting: "A rooftop greenhouse",
        agentA: { name: "Lobster Poet" },
        agentB: { name: "Ghost DJ" },
        beats: [
          { label: "Arrival", summary: "They arrive overdressed.", visualCue: "Rain on glass." },
          { label: "Spark", summary: "A tray tips.", visualCue: "Petals." },
          { label: "Turn", summary: "Joke lands badly.", visualCue: "Candle." },
          { label: "Connect", summary: "A confession.", visualCue: "Eyes." },
          { label: "Escalate", summary: "Double down.", visualCue: "Laughter." },
          { label: "Finale", summary: "They laugh.", visualCue: "Umbrellas." },
        ],
      },
      portraits,
    );

    expect(result.image.base64.length).toBeGreaterThan(0);
    expect(result.image.mediaType).toBe("image/svg+xml");
    expect(result.model).toBe("mock-comic");
    expect(result.prompt).toContain("Lobster Poet");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ai/generate-comic.test.ts 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement generateComicPage**

Create `src/lib/ai/generate-comic.ts`:

```ts
import { generateImage } from "ai";

import { getImageModel, getImageModelId } from "./client";
import { mockGenerateComicPage, shouldUseMockAi } from "./mock";
import { buildComicPrompt } from "./prompts";
import type { ComicPromptInput, ComicResult } from "./types";

export async function generateComicPage(
  input: ComicPromptInput,
  portraits: { agentA: Buffer; agentB: Buffer },
): Promise<ComicResult> {
  if (shouldUseMockAi()) {
    return mockGenerateComicPage(input);
  }

  const prompt = buildComicPrompt(input);
  const { image } = await generateImage({
    model: getImageModel(),
    prompt: {
      images: [portraits.agentA, portraits.agentB],
      text: prompt,
    },
    size: "1024x1536" as `${number}x${number}`,
  });

  return {
    image: {
      base64: image.base64,
      mediaType: image.mediaType,
    },
    prompt,
    model: getImageModelId(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ai/generate-comic.test.ts 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/generate-comic.ts src/lib/ai/generate-comic.test.ts
git commit -m "feat: add generateComicPage function with mock fallback"
```

---

## Chunk 4: Generation Flow, API Route, and Action Updates

**Important ordering:** Task 8 creates the API route file first (with `completeComicGeneration`), then Task 9 updates `actions.ts` to import from it. This ensures the import target exists before the importing file is modified.

### Task 8: Add API route with completeComicGeneration

**Files:**
- Create: `src/app/api/episodes/[episodeId]/comic/route.ts`

Note: `completeComicGeneration` lives here (not in actions.ts) to avoid it being exposed as a public server action. This matches the pattern of `completePortraitGeneration` in `src/app/api/agents/[agentId]/portrait/route.ts`.

- [ ] **Step 1: Create the route with completeComicGeneration**

Create `src/app/api/episodes/[episodeId]/comic/route.ts`:

```ts
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

    await db.episode.update({
      where: { id: episodeId },
      data: {
        comicUrl: `data:${comic.image.mediaType};base64,${comic.image.base64}`,
        comicStatus: "ready",
      },
    });
  } catch {
    await db.episode.update({
      where: { id: episodeId },
      data: { comicStatus: "failed" },
    });
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ episodeId: string }> },
) {
  const { episodeId } = await context.params;

  await completeComicGeneration(episodeId);

  const episode = await db.episode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { id: true, comicStatus: true },
  });

  return NextResponse.json({
    id: episode.id,
    comicStatus: episode.comicStatus,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/episodes/[episodeId]/comic/route.ts
git commit -m "feat: add comic generation route with completeComicGeneration"
```

---

### Task 9: Queue comic generation from episodes/actions.ts

**Files:**
- Modify: `src/app/episodes/actions.ts`
- Modify: `src/app/episodes/actions.test.ts`

- [ ] **Step 1: Write the updated test**

Rewrite `src/app/episodes/actions.test.ts` to mock `completeComicGeneration` from the route module and verify `comicStatus: "pending"` is set on create:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUniqueOrThrow, mockCreate, mockGenerateEpisode, mockCompleteComicGeneration } = vi.hoisted(() => ({
  mockFindUniqueOrThrow: vi.fn(),
  mockCreate: vi.fn(),
  mockGenerateEpisode: vi.fn(),
  mockCompleteComicGeneration: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    match: {
      findUniqueOrThrow: mockFindUniqueOrThrow,
    },
    episode: {
      create: mockCreate,
    },
  },
}));

vi.mock("@/lib/ai/generate-episode", () => ({
  generateEpisode: mockGenerateEpisode,
}));

vi.mock("@/app/api/episodes/[episodeId]/comic/route", () => ({
  completeComicGeneration: mockCompleteComicGeneration,
}));

import { generateEpisodeForMatch } from "./actions";

describe("generateEpisodeForMatch", () => {
  beforeEach(() => {
    mockFindUniqueOrThrow.mockReset();
    mockCreate.mockReset();
    mockGenerateEpisode.mockReset();
    mockCompleteComicGeneration.mockReset();
    mockCompleteComicGeneration.mockResolvedValue(undefined);
  });

  it("stores a structured episode with 6 beats and queues comic generation", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({
      id: "match_123",
      agentA: {
        name: "Lobster Poet",
        description: "Velvet blazer, dramatic sighs, writes sonnets at low tide.",
        vibeTags: ["dramatic", "romantic"],
        personalityTags: ["awkward", "earnest"],
        weirdHook: "Cries when hearing smooth jazz",
      },
      agentB: {
        name: "Ghost DJ",
        description: "A nightclub apparition with perfect posture and terrible timing.",
        vibeTags: ["chaotic"],
        personalityTags: ["deadpan"],
        weirdHook: "Only speaks in airhorn sounds",
      },
    });

    mockGenerateEpisode.mockResolvedValue({
      title: "A Rooftop Disaster in Two Parts",
      tone: "mixed",
      setting: "A rooftop greenhouse",
      beats: [
        { label: "Setup", summary: "They arrive overdressed.", visualCue: "Moonlight on glass." },
        { label: "Spark", summary: "The florist tray tips.", visualCue: "Falling petals." },
        { label: "Spiral", summary: "The joke lands badly.", visualCue: "A crooked candle." },
        { label: "Confession", summary: "An accidental truth slips out.", visualCue: "Wide eyes." },
        { label: "Recovery", summary: "They lean into the awkwardness.", visualCue: "Shared laughter." },
        { label: "Pivot", summary: "They both start laughing.", visualCue: "Linked umbrellas." },
      ],
      ending: "They leave soaked but charmed.",
      shareSummary: "Lobster Poet and Ghost DJ survived a rooftop greenhouse date.",
    });

    mockCreate.mockResolvedValue({
      id: "episode_123",
      beats: [{}, {}, {}, {}, {}, {}],
      shareSummary: "summary",
    });

    const episode = await generateEpisodeForMatch("match_123");

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        matchId: "match_123",
        title: "A Rooftop Disaster in Two Parts",
        tone: "mixed",
        status: "ready",
        comicStatus: "pending",
      }),
    });
    expect(episode.beats.length).toBeGreaterThanOrEqual(6);
    expect(episode.beats.length).toBeLessThanOrEqual(8);
    expect(episode.shareSummary.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/episodes/actions.test.ts 2>&1 | tail -15`
Expected: FAIL — `comicStatus: "pending"` not present in the create call

- [ ] **Step 3: Update generateEpisodeForMatch to set comicStatus and queue comic generation**

Modify `src/app/episodes/actions.ts`. Add import at the top:

```ts
import { completeComicGeneration } from "@/app/api/episodes/[episodeId]/comic/route";
```

Add `queueComicGeneration` function anywhere before `generateEpisodeForMatch`:

```ts
async function queueComicGeneration(episodeId: string) {
  void completeComicGeneration(episodeId).catch(() => undefined);
}
```

Update the `db.episode.create` call to include `comicStatus`:

```ts
const createdEpisode = await db.episode.create({
  data: {
    matchId,
    title: episode.title,
    tone: episode.tone,
    setting: episode.setting,
    beats: episode.beats,
    ending: episode.ending,
    shareSummary: episode.shareSummary,
    status: "ready",
    comicStatus: "pending",
  },
});
```

Add the queue call right after create, before the return:

```ts
await queueComicGeneration(createdEpisode.id);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/episodes/actions.test.ts 2>&1 | tail -15`
Expected: PASS

- [ ] **Step 5: Typecheck and full test suite**

Run: `npx tsc --noEmit && npx vitest run 2>&1 | tail -15`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add src/app/episodes/actions.ts src/app/episodes/actions.test.ts
git commit -m "feat: queue comic generation after episode creation"
```

---

## Chunk 5: Feed Query Update and UI Components

### Task 10: Update feed query to include comicStatus

**Files:**
- Modify: `src/lib/queries/feed.ts`

- [ ] **Step 1: Update query to select comicStatus but not comicUrl**

Replace the `listFeedEpisodes` function in `src/lib/queries/feed.ts`:

```ts
export async function listFeedEpisodes() {
  return db.episode.findMany({
    where: { status: "ready" },
    select: {
      id: true,
      matchId: true,
      title: true,
      tone: true,
      setting: true,
      beats: true,
      ending: true,
      shareSummary: true,
      status: true,
      comicStatus: true,
      createdAt: true,
      updatedAt: true,
      match: {
        include: {
          agentA: true,
          agentB: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
```

- [ ] **Step 2: Typecheck and run tests**

Run: `npx tsc --noEmit && npx vitest run 2>&1 | tail -15`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/feed.ts
git commit -m "feat: include comicStatus in feed query, exclude comicUrl for perf"
```

---

### Task 11: Create comic-status component

**Files:**
- Create: `src/components/comic-status.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/comic-status.tsx` (modeled on `portrait-status.tsx`):

```tsx
type ComicStatusProps = {
  status: "pending" | "ready" | "failed" | string;
};

const toneByStatus: Record<string, string> = {
  pending: "bg-gold/15 text-gold border-gold/20",
  ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  failed: "bg-rose/15 text-rose border-rose/20",
};

export function ComicStatus({ status }: ComicStatusProps) {
  const tone = toneByStatus[status] ?? toneByStatus.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "ready"
            ? "bg-emerald-400"
            : status === "failed"
              ? "bg-rose"
              : "bg-gold animate-pulse-soft"
        }`}
      />
      Comic {status}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/comic-status.tsx
git commit -m "feat: add ComicStatus badge component"
```

---

### Task 12: Update episode detail page for comic-first display

**Files:**
- Modify: `src/app/episodes/[episodeId]/page.tsx`

- [ ] **Step 1: Rewrite the episode page**

Replace `src/app/episodes/[episodeId]/page.tsx` with comic-first logic:

```tsx
import { notFound } from "next/navigation";

import { ComicStatus } from "@/components/comic-status";
import { EpisodeCard } from "@/components/episode-card";
import { NavHeader } from "@/components/nav-header";
import { db } from "@/lib/db";

function toBeatList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "label" in item &&
      "summary" in item &&
      "visualCue" in item &&
      typeof item.label === "string" &&
      typeof item.summary === "string" &&
      typeof item.visualCue === "string"
    ) {
      return [
        {
          label: item.label,
          summary: item.summary,
          visualCue: item.visualCue,
        },
      ];
    }

    return [];
  });
}

type EpisodePageProps = {
  params: Promise<{ episodeId: string }>;
};

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { episodeId } = await params;

  const episode = await db.episode.findUnique({
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

  if (!episode) {
    notFound();
  }

  const agentNames = [episode.match.agentA.name, episode.match.agentB.name];

  return (
    <main className="relative min-h-screen">
      <NavHeader />

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:px-10">
        {episode.comicStatus === "ready" && episode.comicUrl ? (
          <article className="glass-card rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                {episode.title}
              </p>
              <span className="rounded-lg border border-line bg-surface-raised/40 px-2.5 py-1 text-xs font-medium text-muted">
                {episode.tone}
              </span>
            </div>

            <p className="mt-3 text-sm text-rose/70">
              {agentNames.join(" & ")}
            </p>

            <p className="mt-4 text-base leading-7 text-accent/80">
              {episode.shareSummary}
            </p>

            <div className="mt-6 overflow-hidden rounded-xl">
              <img
                src={episode.comicUrl}
                alt="Comic page"
                className="w-full"
              />
            </div>
          </article>
        ) : episode.comicStatus === "pending" ? (
          <article className="glass-card rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
                {episode.title}
              </p>
              <ComicStatus status="pending" />
            </div>

            <p className="mt-3 text-sm text-rose/70">
              {agentNames.join(" & ")}
            </p>

            <div className="mt-6 flex aspect-[2/3] items-center justify-center rounded-xl border border-line bg-surface-raised/20">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-pulse-soft rounded-full bg-gold/20" />
                <p className="mt-3 text-sm text-muted">Generating comic...</p>
              </div>
            </div>
          </article>
        ) : (
          <EpisodeCard
            title={episode.title}
            tone={episode.tone}
            setting={episode.setting}
            ending={episode.ending}
            shareSummary={episode.shareSummary}
            beats={toBeatList(episode.beats)}
            agentNames={agentNames}
            comicFailed
          />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update EpisodeCard to show a "comic unavailable" note when comicFailed is true**

In `src/components/episode-card.tsx`, add an optional `comicFailed` prop to `EpisodeCardProps`:

```ts
type EpisodeCardProps = {
  title: string;
  tone: string;
  setting: string;
  ending: string;
  shareSummary: string;
  beats: EpisodeBeat[];
  agentNames?: string[];
  comicFailed?: boolean;
};
```

Add `comicFailed = false` to the destructured props. Add a subtle note before the setting block if `comicFailed`:

```tsx
{comicFailed ? (
  <p className="mt-4 text-xs text-muted/60">
    Comic generation unavailable — showing text version.
  </p>
) : null}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/episodes/[episodeId]/page.tsx src/components/episode-card.tsx
git commit -m "feat: comic-first episode detail page with fallback to text beats"
```

---

### Task 13: Update feed page EpisodeCard with comicStatus badge

**Files:**
- Modify: `src/app/feed/page.tsx`
- Modify: `src/components/episode-card.tsx`

- [ ] **Step 1: Add comicStatus prop to EpisodeCard**

In `src/components/episode-card.tsx`, add `comicStatus` to props:

```ts
type EpisodeCardProps = {
  title: string;
  tone: string;
  setting: string;
  ending: string;
  shareSummary: string;
  beats: EpisodeBeat[];
  agentNames?: string[];
  comicFailed?: boolean;
  comicStatus?: string;
};
```

Add `comicStatus` to destructured props. After the tone badge, conditionally show a comic badge:

```tsx
{comicStatus === "ready" ? (
  <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
    Comic
  </span>
) : null}
```

- [ ] **Step 2: Pass comicStatus from feed page**

In `src/app/feed/page.tsx`, the `EpisodeCard` rendering already maps episodes. Add `comicStatus` prop:

```tsx
<EpisodeCard
  key={episode.id}
  title={episode.title}
  tone={episode.tone}
  setting={episode.setting}
  ending={episode.ending}
  shareSummary={episode.shareSummary}
  beats={toBeatList(episode.beats)}
  agentNames={[episode.match.agentA.name, episode.match.agentB.name]}
  comicStatus={episode.comicStatus}
/>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/episode-card.tsx src/app/feed/page.tsx
git commit -m "feat: show comic badge on feed episode cards"
```

---

## Chunk 6: E2E Test Update and Final Verification

### Task 14: Update E2E test for comic-first UI

**Files:**
- Modify: `tests/e2e/create-agent-and-generate-episode.spec.ts`

- [ ] **Step 1: Update assertions**

In mock mode, the comic generates fast (fire-and-forget with mock). The episode page should show the comic image. Update the final assertions:

```ts
import { expect, test } from "@playwright/test";

test("user can create an agent and generate an episode", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Create an agent" }).click();
  await page
    .getByLabel("Prompt for your agent")
    .fill(`Create a fictional dating profile for Spark. Return a short reply with these exact labels:
Name:
Description:
Vibe tags:
Personality tags:
Weird hook:

Make the character vivid, playful, and specific.`);
  await page
    .getByLabel("Reply from your agent")
    .fill(`Name: Meteoric Matchmaker
Description: A velvet-clad comet person with perfect hair and disastrously intense eye contact.
Vibe tags: romantic, dramatic
Personality tags: earnest, chaotic
Weird hook: Leaves a glittering contrail in every doorway`);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("Agent saved. Portrait generation is queued")).toBeVisible();

  await page.goto("/matches/new");
  await page.getByRole("button", { name: "Generate date episode" }).first().click();

  await expect(page).toHaveURL(/\/episodes\//);

  // Comic-first: either the comic image loads or we see the pending/fallback state
  const comicImage = page.getByAltText("Comic page");
  const generatingText = page.getByText("Generating comic...");
  const endingText = page.getByText("Ending");

  // Wait for any of the three states to appear
  await expect(
    comicImage.or(generatingText).or(endingText)
  ).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 2: Run the full test suite to verify nothing is broken**

Run: `npx vitest run 2>&1 | tail -15`
Expected: All unit tests PASS

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/create-agent-and-generate-episode.spec.ts
git commit -m "test: update E2E test for comic-first episode display"
```

---

### Task 15: Final verification

- [ ] **Step 1: Run full unit test suite**

Run: `npx vitest run`
Expected: All tests pass (including new ones)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Dev server smoke test**

Run: `pnpm dev` and manually navigate to:
1. Create an agent at `/agents/new`
2. Generate a match at `/matches/new`
3. Verify the episode page shows the mock comic image
4. Verify the feed page shows the "Comic" badge
