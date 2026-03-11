# Episode Comic Page Generation

Generate a single American comic book–style image for each episode, composing all 6 beats into a dynamic panel layout. The comic is the primary episode experience; text beats are a fallback.

## Data Model

Add two fields to the `Episode` Prisma model:

```prisma
comicUrl      String?              // base64 data URI of generated comic page
comicStatus   String  @default("pending")  // "pending" | "ready" | "failed"
```

Run `prisma migrate dev` to apply. The existing `status` field continues to track the text content independently.

**Size concern**: Comic images at 1024×1536 can be 2–5 MB base64. To avoid loading large blobs on the feed page, `comicUrl` should only be selected on the episode detail page. The feed query selects `comicStatus` (for showing a badge or thumbnail indicator) but NOT `comicUrl`.

## Generation Flow

### Trigger

After `generateEpisodeForMatch()` creates the Episode record with text content (`status: "ready"`), it fires `queueComicGeneration(episodeId)`. This follows the same fire-and-forget pattern as `queuePortraitGeneration` — calling the generation function directly via `void completeComicGeneration(episodeId).catch(() => undefined)`, NOT via `fetch()`.

### Generation Function

`completeComicGeneration(episodeId)` in `src/app/episodes/actions.ts`:

1. Fetch Episode with Match, AgentA, AgentB.
2. Load both agent portraits:
   - User-generated agents: `Agent.portraitUrl` (base64 data URI).
   - House agents: `Agent.portraitUrl` stores a public path like `/portraits/lobster-poet.svg`.
3. Convert portraits to PNG buffers using `resvg-js` for SVGs, `sharp` for raster formats.
4. Call `generateComicPage(input, portraits)`.
5. On success: set `comicUrl` to `data:image/png;base64,<result>`, `comicStatus` to `"ready"`.
6. On failure: set `comicStatus` to `"failed"`.

### API Route

`POST /api/episodes/[episodeId]/comic/route.ts` — thin wrapper that calls `completeComicGeneration`. Exists so comic generation can be retried externally if needed.

### Portrait Conversion

Create `src/lib/ai/portrait-to-png.ts`:

```ts
export async function portraitToPng(
  portraitSource: string // base64 data URI or public path
): Promise<Buffer>
```

- If input starts with `data:image/svg` → decode base64, render with `@resvg/resvg-js`, output PNG.
- If input starts with `data:` (non-SVG, e.g. `data:image/png`) → decode base64, pipe through `sharp().resize(512, 512, { fit: "inside" }).png()`.
- If input starts with `/` → resolve as `path.join(process.cwd(), "public", portraitSource)`, read the file. If SVG, use `resvg-js`; otherwise use `sharp`.
- Target output: 512×512 PNG (resize to fit, preserve aspect ratio).

### AI Function

Create `src/lib/ai/generate-comic.ts`:

```ts
export async function generateComicPage(
  input: ComicPromptInput,
  portraits: { agentA: Buffer; agentB: Buffer }
): Promise<ComicResult>
```

- Uses `generateImage()` from the `"ai"` package with the image model from `client.ts`.
- Passes portrait PNGs as reference images using the object-form prompt:
  ```ts
  const result = await generateImage({
    model: getImageModel(),
    prompt: {
      images: [portraits.agentA, portraits.agentB],
      text: buildComicPrompt(input),
    },
    size: "1024x1536",
  });
  ```
- Returns `{ image: { base64, mediaType }, prompt, model }`.
- Falls back to `mockGenerateComicPage()` when `shouldUseMockAi()` is true.

## Prompt Design

### Text Prompt Structure

The prompt sent to `gpt-image-1` alongside the two portrait reference images:

```
Create a single American comic book page illustrating a romantic comedy date.

Style: Bold black ink outlines, halftone dot shading, dynamic camera angles,
expressive character acting, and speech/thought bubbles where appropriate.
Color palette: saturated with warm romantic tones.

Panel layout (dynamic arrangement):
- Top row: ONE wide establishing panel (spans full width)
- Middle rows: tighter panels in a 2×2 grid
- Bottom row: ONE wide finale panel (spans full width)

Characters:
- Character A: {agentA.name} — {agentA.description}
  (matches the FIRST reference image)
- Character B: {agentB.name} — {agentB.description}
  (matches the SECOND reference image)

Setting: {episode.setting}

Panel 1 (wide — opening): {beat[0].summary}. Visual: {beat[0].visualCue}
Panel 2: {beat[1].summary}. Visual: {beat[1].visualCue}
...
Panel N (wide — finale): {beat[last].summary}. Visual: {beat[last].visualCue}

Title banner at the top: "{episode.title}"
```

The prompt builder dynamically iterates all beats (6–8), marking the first as "wide — opening" and the last as "wide — finale". Middle beats are regular panels. If there are 7 or 8 beats, the middle section gets more panels in the grid — the prompt describes this as "arranged in rows of 2".

### Prompt Builder

Add `buildComicPrompt()` to `src/lib/ai/prompts.ts`. Input type:

```ts
export type ComicPromptInput = {
  title: string;
  setting: string;
  beats: EpisodeBeat[];
  agentA: PromptAgent;
  agentB: PromptAgent;
};
```

## Types

Add to `src/lib/ai/types.ts`:

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

## Mock Mode

Add `mockGenerateComicPage()` to `src/lib/ai/mock.ts`. Returns a placeholder SVG with:
- A 640×900 canvas (matching the 2:3 aspect ratio of the real output).
- 6 rectangles arranged in the dynamic layout (wide top, 2×2 middle, wide bottom).
- Agent names and beat labels as text in each panel.
- Encoded as base64 SVG, same pattern as `mockGeneratePortrait`.

## Episode Page UI

### Episode Detail Page (`src/app/episodes/[episodeId]/page.tsx`)

Behavior by `comicStatus`:

- **`"ready"`**: Display the comic image full-width inside the episode card. Show title, agent names, and share summary around it. No text beats.
- **`"pending"`**: Show an animated loading skeleton sized to the 2:3 comic aspect ratio, with a "Generating comic..." label. No text beats visible. The page auto-refreshes to check for completion.
- **`"failed"`**: Fall back to the existing text beat timeline (`EpisodeBeatList`). Show a subtle muted note: "Comic generation unavailable."

### Feed Page (`src/app/feed/page.tsx`)

The `EpisodeCard` component gains optional `comicStatus` prop:
- If `comicStatus === "ready"`, show a small comic icon/badge indicating a comic is available. The full image is only loaded on the detail page.
- If absent or not ready, show the current text-based card layout (unchanged).

### Comic Status Component

Create `src/components/comic-status.tsx` — a small status badge (similar to `portrait-status.tsx`) showing pending/failed state. Used on the episode detail page during generation.

## Dependencies

```bash
pnpm add sharp @resvg/resvg-js
pnpm add -D @types/sharp
```

- `sharp`: Raster image resizing and format conversion (PNG/JPEG sources).
- `@resvg/resvg-js`: SVG-to-PNG rendering with bundled renderer (no system `librsvg` dependency). Handles the house agent SVG portraits reliably across all environments.

## Testing

### Unit Tests

- `src/lib/ai/generate-comic.test.ts` — test that `generateComicPage` calls mock in mock mode and returns expected shape.
- `src/lib/ai/portrait-to-png.test.ts` — test conversion of data URI (SVG and PNG) and public file paths.
- `src/app/episodes/actions.test.ts` — update existing test: `generateEpisodeForMatch` now also calls `queueComicGeneration`. Mock the queue function to verify it's called with the episode ID.

### E2E Test

Update `tests/e2e/create-agent-and-generate-episode.spec.ts`:
- In mock mode, `completeComicGeneration` runs synchronously (fire-and-forget but resolves fast with mock data).
- The episode page will show the mock comic image when `comicStatus === "ready"`.
- Update assertion: instead of checking for "Ending" text, check for the comic image element (e.g. `img[alt="Comic page"]`) OR check for the loading state text "Generating comic...".
- Keep a fallback assertion for the text beats in case comic status is "failed".

## File Summary

New files:
- `src/lib/ai/generate-comic.ts` — AI generation function + mock fallback
- `src/lib/ai/portrait-to-png.ts` — portrait-to-PNG conversion utility
- `src/app/api/episodes/[episodeId]/comic/route.ts` — retry endpoint
- `src/components/comic-status.tsx` — pending/failed status badge
- `src/lib/ai/generate-comic.test.ts` — unit tests for comic generation
- `src/lib/ai/portrait-to-png.test.ts` — unit tests for portrait conversion
- `prisma/migrations/...` — schema migration

Modified files:
- `prisma/schema.prisma` — add `comicUrl`, `comicStatus` to Episode
- `src/lib/ai/types.ts` — add `ComicPromptInput`, `ComicResult`
- `src/lib/ai/prompts.ts` — add `buildComicPrompt()`
- `src/lib/ai/mock.ts` — add `mockGenerateComicPage()`
- `src/app/episodes/actions.ts` — add `queueComicGeneration`, `completeComicGeneration`
- `src/app/episodes/actions.test.ts` — verify comic queue is called
- `src/app/episodes/[episodeId]/page.tsx` — comic-first display logic
- `src/components/episode-card.tsx` — optional `comicStatus` badge
- `src/lib/queries/feed.ts` — include `comicStatus` (not `comicUrl`) in feed query
- `tests/e2e/create-agent-and-generate-episode.spec.ts` — update assertions for comic-first UI
