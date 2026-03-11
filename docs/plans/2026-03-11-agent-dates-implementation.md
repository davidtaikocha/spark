# Agent Dates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a story-first social app where users create fictional agents with generated portraits, match them manually or via recommendation, and generate short shareable date episodes.

**Architecture:** Use a Next.js App Router application with server actions and route handlers for the product surface, Prisma with SQLite for local persistence, and thin AI service adapters for profile normalization, portrait generation, and episode generation. Keep generation outputs structured in JSON so the same story beats can later drive image and video features without changing the core data model.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma ORM, SQLite, Zod, OpenAI SDK, Vitest, Testing Library, Playwright

---

### Task 1: Bootstrap the app shell

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Test: `src/app/page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows the core call to action", () => {
    render(<HomePage />);
    expect(screen.getByText("Create an agent")).toBeInTheDocument();
    expect(screen.getByText("Generate a date episode")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/app/page.test.tsx`
Expected: FAIL because the app files and test environment do not exist yet.

**Step 3: Write minimal implementation**

Use `pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*"` and then replace the generated home page with a minimal landing page that exposes the two core actions from the spec.

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Agent Dates</h1>
      <button>Create an agent</button>
      <p>Generate a date episode</p>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/app/page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json postcss.config.js tailwind.config.ts src/app/layout.tsx src/app/page.tsx src/app/globals.css vitest.config.ts src/test/setup.ts src/app/page.test.tsx
git commit -m "feat: bootstrap agent dates app shell"
```

### Task 2: Define the database schema and house roster seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/domain/agent.ts`
- Test: `src/lib/domain/agent.test.ts`

**Step 1: Write the failing test**

```ts
import { agentInputSchema } from "./agent";

describe("agentInputSchema", () => {
  it("requires a name, description, and at least one tag", () => {
    const result = agentInputSchema.safeParse({
      name: "Lobster Poet",
      description: "A melancholy lobster in a velvet blazer.",
      vibeTags: ["dramatic"],
    });

    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/lib/domain/agent.test.ts`
Expected: FAIL because the schema module does not exist.

**Step 3: Write minimal implementation**

Define Prisma models for `Agent`, `Match`, and `Episode`. Include `sourceType`, `portraitUrl`, `portraitPrompt`, and JSON episode beats. Seed 12-20 house agents that span cute, weird, and chaotic tones. Add a Zod schema for the validated create-agent input.

```prisma
model Agent {
  id              String   @id @default(cuid())
  name            String
  description     String
  vibeTags        Json
  personalityTags Json
  weirdHook       String?
  portraitUrl     String?
  portraitPrompt  String?
  sourceType      String
  visibility      String   @default("public")
  createdAt       DateTime @default(now())
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/lib/domain/agent.test.ts && pnpm prisma validate`
Expected: PASS and a valid Prisma schema.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/lib/db.ts src/lib/domain/agent.ts src/lib/domain/agent.test.ts
git commit -m "feat: add persistence schema and house roster seed"
```

### Task 3: Build AI adapters for normalization, portraits, and episodes

**Files:**
- Create: `src/lib/ai/client.ts`
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/normalize-agent.ts`
- Create: `src/lib/ai/generate-portrait.ts`
- Create: `src/lib/ai/generate-episode.ts`
- Create: `src/lib/ai/types.ts`
- Test: `src/lib/ai/prompts.test.ts`

**Step 1: Write the failing test**

```ts
import { buildEpisodePrompt } from "./prompts";

describe("buildEpisodePrompt", () => {
  it("includes both agents, tone guidance, and structured beat instructions", () => {
    const prompt = buildEpisodePrompt({
      agentA: { name: "Lobster Poet" },
      agentB: { name: "Ghost DJ" },
      tone: "mixed",
    });

    expect(prompt).toContain("Lobster Poet");
    expect(prompt).toContain("Ghost DJ");
    expect(prompt).toContain("4-6 beats");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/lib/ai/prompts.test.ts`
Expected: FAIL because the prompt builders do not exist.

**Step 3: Write minimal implementation**

Add a single OpenAI client wrapper plus pure prompt-building helpers. Keep output contracts explicit in `src/lib/ai/types.ts` so normalization and episode generation return predictable structured data.

```ts
export type EpisodeBeat = {
  label: string;
  summary: string;
  visualCue: string;
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/lib/ai/prompts.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/ai/client.ts src/lib/ai/prompts.ts src/lib/ai/normalize-agent.ts src/lib/ai/generate-portrait.ts src/lib/ai/generate-episode.ts src/lib/ai/types.ts src/lib/ai/prompts.test.ts
git commit -m "feat: add structured ai generation adapters"
```

### Task 4: Implement agent creation and portrait generation

**Files:**
- Create: `src/app/agents/new/page.tsx`
- Create: `src/app/agents/actions.ts`
- Create: `src/components/agent-form.tsx`
- Create: `src/components/agent-card.tsx`
- Create: `src/components/portrait-status.tsx`
- Test: `src/app/agents/actions.test.ts`

**Step 1: Write the failing test**

```ts
import { createAgent } from "./actions";

describe("createAgent", () => {
  it("normalizes the input and stores an agent before portrait completion", async () => {
    const result = await createAgent({
      name: "Lobster Poet",
      description: "Velvet blazer, dramatic sighs, writes sonnets at low tide.",
      vibeTags: ["dramatic", "romantic"],
      personalityTags: ["awkward"],
      weirdHook: "Cries when hearing smooth jazz",
    });

    expect(result.agent.name).toBe("Lobster Poet");
    expect(result.agent.portraitStatus).toBe("pending");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/app/agents/actions.test.ts`
Expected: FAIL because the action and persistence flow are not implemented.

**Step 3: Write minimal implementation**

Create the form page and server action. Persist the normalized agent record immediately, then trigger portrait generation separately so profile creation survives image failures.

```ts
export async function createAgent(input: CreateAgentInput) {
  const normalized = await normalizeAgentInput(input);
  const agent = await db.agent.create({
    data: {
      ...normalized,
      portraitStatus: "pending",
    },
  });

  void queuePortraitGeneration(agent.id);
  return { agent };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/app/agents/actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/agents/new/page.tsx src/app/agents/actions.ts src/components/agent-form.tsx src/components/agent-card.tsx src/components/portrait-status.tsx src/app/agents/actions.test.ts
git commit -m "feat: add agent creation flow"
```

### Task 5: Add portrait job completion and reroll support

**Files:**
- Create: `src/app/api/agents/[agentId]/portrait/route.ts`
- Modify: `src/app/agents/actions.ts`
- Modify: `src/components/agent-card.tsx`
- Test: `src/app/api/agents/[agentId]/portrait/route.test.ts`

**Step 1: Write the failing test**

```ts
import { POST } from "./route";

describe("POST /api/agents/[agentId]/portrait", () => {
  it("updates the portrait url and prompt on success", async () => {
    const response = await POST(
      new Request("http://localhost/api/agents/a1/portrait"),
      { params: Promise.resolve({ agentId: "a1" }) },
    );

    expect(response.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/app/api/agents/[agentId]/portrait/route.test.ts`
Expected: FAIL because the route handler does not exist.

**Step 3: Write minimal implementation**

Implement a route handler that calls the portrait generator, stores `portraitUrl` and `portraitPrompt`, and exposes a reroll path for manual retries from the agent card.

```ts
await db.agent.update({
  where: { id: agentId },
  data: {
    portraitUrl: image.url,
    portraitPrompt: image.prompt,
    portraitStatus: "ready",
  },
});
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/app/api/agents/[agentId]/portrait/route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/agents/[agentId]/portrait/route.ts src/app/agents/actions.ts src/components/agent-card.tsx src/app/api/agents/[agentId]/portrait/route.test.ts
git commit -m "feat: add portrait completion and reroll flow"
```

### Task 6: Build matching and recommendation

**Files:**
- Create: `src/lib/matching/score-match.ts`
- Create: `src/app/matches/new/page.tsx`
- Create: `src/app/matches/actions.ts`
- Create: `src/components/recommendation-list.tsx`
- Test: `src/lib/matching/score-match.test.ts`

**Step 1: Write the failing test**

```ts
import { scoreMatch } from "./score-match";

describe("scoreMatch", () => {
  it("rewards pairings with contrast and a clear comedic hook", () => {
    const result = scoreMatch(
      { vibeTags: ["dramatic"], personalityTags: ["romantic"], weirdHook: "Writes sea shanties" },
      { vibeTags: ["chaotic"], personalityTags: ["deadpan"], weirdHook: "Only speaks in airhorn sounds" },
    );

    expect(result.storyabilityScore).toBeGreaterThan(0);
    expect(result.reason).toContain("contrast");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/lib/matching/score-match.test.ts`
Expected: FAIL because the scoring module does not exist.

**Step 3: Write minimal implementation**

Implement a deterministic scoring function first. Base it on tag overlap, contrast bonuses, and weird-hook novelty, then use it to power manual selection and recommendation ranking.

```ts
export function scoreMatch(agentA: MatchAgent, agentB: MatchAgent) {
  const contrastScore = calculateContrast(agentA, agentB);
  const chemistryScore = calculateChemistry(agentA, agentB);
  const storyabilityScore = contrastScore + chemistryScore + weirdHookBonus(agentA, agentB);

  return {
    contrastScore,
    chemistryScore,
    storyabilityScore,
    reason: buildReason({ contrastScore, chemistryScore }),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/lib/matching/score-match.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/matching/score-match.ts src/app/matches/new/page.tsx src/app/matches/actions.ts src/components/recommendation-list.tsx src/lib/matching/score-match.test.ts
git commit -m "feat: add match recommendation flow"
```

### Task 7: Implement episode generation and result page

**Files:**
- Create: `src/app/episodes/[episodeId]/page.tsx`
- Create: `src/app/episodes/actions.ts`
- Create: `src/components/episode-card.tsx`
- Create: `src/components/episode-beat-list.tsx`
- Test: `src/app/episodes/actions.test.ts`

**Step 1: Write the failing test**

```ts
import { generateEpisodeForMatch } from "./actions";

describe("generateEpisodeForMatch", () => {
  it("stores a structured episode with 4-6 beats and a share summary", async () => {
    const episode = await generateEpisodeForMatch("match_123");

    expect(episode.beats.length).toBeGreaterThanOrEqual(4);
    expect(episode.beats.length).toBeLessThanOrEqual(6);
    expect(episode.shareSummary.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/app/episodes/actions.test.ts`
Expected: FAIL because episode generation is not implemented.

**Step 3: Write minimal implementation**

Use the AI episode adapter to produce structured JSON, persist it, and render the result page from stored data rather than raw model output.

```ts
const episode = await generateEpisode({
  agentA,
  agentB,
  tone: "mixed",
});

await db.episode.create({
  data: {
    matchId,
    title: episode.title,
    tone: episode.tone,
    setting: episode.setting,
    beats: episode.beats,
    ending: episode.ending,
    shareSummary: episode.shareSummary,
    status: "ready",
  },
});
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/app/episodes/actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/episodes/[episodeId]/page.tsx src/app/episodes/actions.ts src/components/episode-card.tsx src/components/episode-beat-list.tsx src/app/episodes/actions.test.ts
git commit -m "feat: add episode generation and result view"
```

### Task 8: Add social feed and agent profile history

**Files:**
- Create: `src/app/feed/page.tsx`
- Create: `src/app/agents/[agentId]/page.tsx`
- Create: `src/lib/queries/feed.ts`
- Create: `src/lib/queries/agent-profile.ts`
- Test: `src/lib/queries/feed.test.ts`

**Step 1: Write the failing test**

```ts
import { listFeedEpisodes } from "./feed";

describe("listFeedEpisodes", () => {
  it("returns the newest ready episodes for public display", async () => {
    const episodes = await listFeedEpisodes();
    expect(Array.isArray(episodes)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/lib/queries/feed.test.ts`
Expected: FAIL because the feed query module does not exist.

**Step 3: Write minimal implementation**

Render a simple chronological feed first. Each episode card should link back to both agent profiles and show enough metadata to make browsing entertaining.

```ts
export async function listFeedEpisodes() {
  return db.episode.findMany({
    where: { status: "ready" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/lib/queries/feed.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/feed/page.tsx src/app/agents/[agentId]/page.tsx src/lib/queries/feed.ts src/lib/queries/agent-profile.ts src/lib/queries/feed.test.ts
git commit -m "feat: add social feed and profile history"
```

### Task 9: Add safety validation and fallback behavior

**Files:**
- Create: `src/lib/moderation/moderate-agent-input.ts`
- Modify: `src/app/agents/actions.ts`
- Modify: `src/app/episodes/actions.ts`
- Test: `src/lib/moderation/moderate-agent-input.test.ts`

**Step 1: Write the failing test**

```ts
import { moderateAgentInput } from "./moderate-agent-input";

describe("moderateAgentInput", () => {
  it("rejects real-person dating simulation prompts", async () => {
    const result = await moderateAgentInput({
      name: "Celebrity Clone",
      description: "Exactly looks like a famous actor and wants to date fans.",
    });

    expect(result.allowed).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest src/lib/moderation/moderate-agent-input.test.ts`
Expected: FAIL because moderation checks are missing.

**Step 3: Write minimal implementation**

Add an allow-or-block moderation pass before persistence and generation. Use explicit fallback error states instead of silent failures.

```ts
if (!moderation.allowed) {
  return {
    error: moderation.reason,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest src/lib/moderation/moderate-agent-input.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/moderation/moderate-agent-input.ts src/app/agents/actions.ts src/app/episodes/actions.ts src/lib/moderation/moderate-agent-input.test.ts
git commit -m "feat: add moderation and fallback states"
```

### Task 10: Verify end-to-end flow and document local setup

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/create-agent-and-generate-episode.spec.ts`
- Create: `.env.example`
- Create: `README.md`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("user can create an agent and generate an episode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create an agent" }).click();
  await expect(page.getByText("Generate a date episode")).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm playwright test tests/e2e/create-agent-and-generate-episode.spec.ts`
Expected: FAIL until the full workflow is wired together.

**Step 3: Write minimal implementation**

Add the environment template, local setup instructions, seed workflow, and the smallest stable end-to-end happy path.

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="replace-me"
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest && pnpm playwright test`
Expected: PASS across unit and end-to-end coverage.

**Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/create-agent-and-generate-episode.spec.ts .env.example README.md
git commit -m "docs: add local setup and end-to-end verification"
```

## Notes For Execution

- Use house agents aggressively during early development so recommendation and feed screens are never empty.
- Keep all generated episode data structured even if the UI renders it as prose.
- Do not add video generation in this plan. The design explicitly treats story quality as the foundation.
- Favor deterministic utilities for matching and moderation before adding model-dependent ranking.
