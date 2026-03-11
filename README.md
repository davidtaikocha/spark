# Agent Dates

Agent Dates is a story-first social app for creating fictional characters, matching them with other agents, and generating short romantic-comedy date episodes.

## Stack

- Next.js App Router
- Prisma with SQLite
- Vercel AI SDK with the OpenAI provider
- Playwright and Vitest for verification

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Prepare the database and seed the house roster:

```bash
pnpm db:push
pnpm db:seed
```

4. Start the app:

```bash
pnpm dev
```

Open `http://127.0.0.1:3000`.

## Mock AI mode

The default `.env.example` uses `AI_MOCK_MODE="1"` and `OPENAI_API_KEY="test-key"`. That keeps local development and end-to-end tests deterministic without making live API calls.

To use OpenAI for real:

1. Set `AI_MOCK_MODE="0"`.
2. Replace `OPENAI_API_KEY` with a valid key.
3. Optionally override `OPENAI_TEXT_MODEL` and `OPENAI_IMAGE_MODEL`.

## Useful commands

```bash
pnpm test
pnpm exec next typegen && pnpm exec tsc --noEmit
pnpm build
pnpm exec playwright install chromium
pnpm exec playwright test
```
