# Nous Decentralized Matchmaker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Let Nous Decide" button on `/matches/new` that submits a matchmaking query to the Nous decentralized oracle on Taiko Hoodi, polls for consensus, and generates a date episode from the result.

**Architecture:** Server-side viem client signs `createRequest` transactions using a hot wallet. Client component polls oracle phase via server actions every 5s and shows a phase-aware loading overlay. On resolution, the picked agent is matched and fed into the existing episode generation pipeline.

**Tech Stack:** Next.js 16 (App Router), viem (Ethereum client), Prisma (SQLite local / Postgres prod), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-15-nous-decentralized-matchmaker-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/nous/abi.ts` | Create | Oracle ABI (read fns + createRequest) |
| `src/lib/nous/config.ts` | Create | Env var parsing, `nousEnabled()` |
| `src/lib/nous/client.ts` | Create | Viem clients, contract read/write helpers |
| `src/lib/nous/query.ts` | Create | Query builder + answer parser |
| `src/app/matches/nous-actions.ts` | Create | Server actions: submit, poll, resolve |
| `src/components/nous-matchmaker.tsx` | Create | Client UI: button + phase overlay + polling |
| `prisma/schema.prisma` | Modify | Add `NousRequest` model |
| `src/app/matches/new/page.tsx` | Modify | Wire in `NousMatchmaker` component |
| `.env` | Modify | Add Nous env vars |
| `.env.example` | Modify | Add Nous env var templates |

---

## Chunk 1: Foundation (ABI, Config, Schema, Deps)

### Task 1: Install viem and add env vars

**Files:**
- Modify: `package.json`
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Install viem**

Run: `pnpm add viem`

- [ ] **Step 2: Add Nous env vars to `.env`**

Append to `.env`:
```
NOUS_PRIVATE_KEY=""
NOUS_RPC_URL="https://rpc.hoodi.taiko.xyz"
NOUS_ORACLE_ADDRESS="0x9a78aD39f2cA73059e7C7963Dd0D49e46f404434"
NOUS_BOND_AMOUNT="100000000000000"
NOUS_REWARD_AMOUNT="100000000000000"
NOUS_COMMIT_DEADLINE_SECONDS="120"
NOUS_NUM_AGENTS="3"
```

- [ ] **Step 3: Add same vars to `.env.example`**

Same block, but `NOUS_PRIVATE_KEY=""` stays empty.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore: add viem dependency and Nous env vars"
```

---

### Task 2: Add NousRequest to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add NousRequest model**

Append to `prisma/schema.prisma`:
```prisma
model NousRequest {
  id                String   @id @default(cuid())
  onChainRequestId  String   @unique
  primaryAgentId    String
  candidateAgentIds Json
  status            String   @default("pending")
  pickedAgentId     String?
  episodeId         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

- [ ] **Step 2: Push schema and regenerate client**

Run: `npx prisma db push && npx prisma generate`

- [ ] **Step 3: Verify type generation**

Run: `npx tsc --noEmit`
Expected: clean (no errors)

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add NousRequest model to schema"
```

---

### Task 3: Create oracle ABI

**Files:**
- Create: `src/lib/nous/abi.ts`

- [ ] **Step 1: Create `src/lib/nous/abi.ts`**

Copy all entries from `/Users/davidcai/taiko/hackathon/nous/client/src/oracleAbi.ts` and add the missing `createRequest` entry (from the Solidity interface). The full file:

```typescript
export const nousOracleAbi = [
  {
    type: 'function',
    name: 'createRequest',
    stateMutability: 'payable',
    inputs: [
      { name: 'query', type: 'string' },
      { name: 'numInfoAgents', type: 'uint256' },
      { name: 'rewardAmount', type: 'uint256' },
      { name: 'bondAmount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'rewardToken', type: 'address' },
      { name: 'bondToken', type: 'address' },
      { name: 'specifications', type: 'string' },
      {
        name: 'requiredCapabilities',
        type: 'tuple',
        components: [
          { name: 'capabilities', type: 'string[]' },
          { name: 'domains', type: 'string[]' },
        ],
      },
    ],
    outputs: [{ name: 'requestId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'nextRequestId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'phases',
    stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'getCommits',
    stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [
      { name: 'agents', type: 'address[]' },
      { name: 'commitments', type: 'bytes32[]' },
    ],
  },
  {
    type: 'function',
    name: 'getReveals',
    stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [
      { name: 'agents', type: 'address[]' },
      { name: 'answers', type: 'bytes[]' },
    ],
  },
  {
    type: 'function',
    name: 'getResolution',
    stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [
      { name: 'finalAnswer', type: 'bytes' },
      { name: 'finalized', type: 'bool' },
    ],
  },
] as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/nous/abi.ts
git commit -m "feat: add Nous oracle ABI with createRequest"
```

---

### Task 4: Create config module

**Files:**
- Create: `src/lib/nous/config.ts`

- [ ] **Step 1: Create `src/lib/nous/config.ts`**

```typescript
import type { Address } from "viem";

export function getNousConfig() {
  return {
    rpcUrl: process.env.NOUS_RPC_URL || "https://rpc.hoodi.taiko.xyz",
    oracleAddress: (process.env.NOUS_ORACLE_ADDRESS ||
      "0x9a78aD39f2cA73059e7C7963Dd0D49e46f404434") as Address,
    privateKey: process.env.NOUS_PRIVATE_KEY || "",
    bondAmount: BigInt(process.env.NOUS_BOND_AMOUNT || "100000000000000"),
    rewardAmount: BigInt(process.env.NOUS_REWARD_AMOUNT || "100000000000000"),
    commitDeadlineSeconds: Number(
      process.env.NOUS_COMMIT_DEADLINE_SECONDS || "120",
    ),
    numAgents: Number(process.env.NOUS_NUM_AGENTS || "3"),
  };
}

export function nousEnabled(): boolean {
  return Boolean(process.env.NOUS_PRIVATE_KEY);
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/lib/nous/config.ts
git commit -m "feat: add Nous config with env var parsing"
```

---

## Chunk 2: Oracle Client + Query Builder

### Task 5: Create viem oracle client

**Files:**
- Create: `src/lib/nous/client.ts`

- [ ] **Step 1: Create `src/lib/nous/client.ts`**

```typescript
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

import { nousOracleAbi } from "./abi";
import { getNousConfig } from "./config";

const taikoHoodi = defineChain({
  id: 167_920,
  name: "Taiko Hoodi",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.hoodi.taiko.xyz"] },
  },
});

function getClients() {
  const config = getNousConfig();
  const account = privateKeyToAccount(config.privateKey as Hex);

  const publicClient = createPublicClient({
    chain: taikoHoodi,
    transport: http(config.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: taikoHoodi,
    transport: http(config.rpcUrl),
  });

  return { publicClient, walletClient, account, config };
}

export async function submitOracleRequest(
  query: string,
  specifications: string,
): Promise<bigint> {
  const { publicClient, walletClient, config } = getClients();

  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + config.commitDeadlineSeconds,
  );

  const hash = await walletClient.writeContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "createRequest",
    args: [
      query,
      BigInt(config.numAgents),
      config.rewardAmount,
      config.bondAmount,
      deadline,
      "0x0000000000000000000000000000000000000000" as Address,
      "0x0000000000000000000000000000000000000000" as Address,
      specifications,
      { capabilities: ["text"], domains: [] },
    ],
    value: config.rewardAmount,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status !== "success") {
    throw new Error("Oracle request transaction reverted");
  }

  // Parse requestId from return value by reading nextRequestId - 1
  const nextId = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "nextRequestId",
  });

  return nextId - 1n;
}

export async function getOraclePhase(requestId: bigint): Promise<number> {
  const { publicClient, config } = getClients();

  const phase = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "phases",
    args: [requestId],
  });

  return Number(phase);
}

export async function getOracleResolution(
  requestId: bigint,
): Promise<{ finalAnswer: Hex; finalized: boolean }> {
  const { publicClient, config } = getClients();

  const [finalAnswer, finalized] = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "getResolution",
    args: [requestId],
  });

  return { finalAnswer, finalized };
}

export async function getOracleCommitCount(
  requestId: bigint,
): Promise<number> {
  const { publicClient, config } = getClients();

  const [agents] = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "getCommits",
    args: [requestId],
  });

  return agents.length;
}

export async function getOracleRevealCount(
  requestId: bigint,
): Promise<number> {
  const { publicClient, config } = getClients();

  const [agents] = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "getReveals",
    args: [requestId],
  });

  return agents.length;
}

export const PHASE = {
  NONE: 0,
  COMMITTING: 1,
  REVEALING: 2,
  JUDGING: 3,
  FINALIZED: 4,
  DISTRIBUTED: 5,
  FAILED: 6,
} as const;
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/lib/nous/client.ts
git commit -m "feat: add viem-based Nous oracle client"
```

---

### Task 6: Create query builder and answer parser

**Files:**
- Create: `src/lib/nous/query.ts`

- [ ] **Step 1: Create `src/lib/nous/query.ts`**

```typescript
import { fromHex, type Hex } from "viem";

type AgentProfile = {
  name: string;
  description: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string | null;
};

export function buildMatchmakerQuery(
  primaryAgent: AgentProfile,
  candidates: AgentProfile[],
): { query: string; specifications: string } {
  const query = `Which agent should ${primaryAgent.name} go on a date with? Pick exactly one.`;

  const specifications = JSON.stringify({
    task: "matchmaking",
    primaryAgent: {
      name: primaryAgent.name,
      description: primaryAgent.description,
      vibeTags: primaryAgent.vibeTags,
      personalityTags: primaryAgent.personalityTags,
      weirdHook: primaryAgent.weirdHook,
    },
    candidates: candidates.map((c) => ({
      name: c.name,
      description: c.description,
      vibeTags: c.vibeTags,
      personalityTags: c.personalityTags,
      weirdHook: c.weirdHook,
    })),
    instructions:
      'Respond with a JSON object: { "pick": "<exact agent name>" }. Choose the candidate that would create the most entertaining, chaotic, and story-worthy date. Consider personality contrast, vibe chemistry, and weird hook interactions. Return ONLY the JSON.',
  });

  return { query, specifications };
}

export function parseMatchmakerAnswer(
  answerBytes: Hex,
  candidateNames: string[],
): string | null {
  let text: string;
  try {
    text = fromHex(answerBytes, "string");
  } catch {
    return null;
  }

  // The answer may be a JSON wrapper like { answer: "...", confidence: 0.9, ... }
  // Try to extract the inner answer field first
  let pickText = text;
  try {
    const outer = JSON.parse(text);
    if (typeof outer.answer === "string") {
      pickText = outer.answer;
    }
  } catch {
    // Not JSON wrapper, use raw text
  }

  // Now try to parse the pick from the inner text
  try {
    const parsed = JSON.parse(pickText);
    if (typeof parsed.pick === "string") {
      pickText = parsed.pick;
    }
  } catch {
    // Not JSON, use as-is for fuzzy matching
  }

  const lower = pickText.toLowerCase().trim();

  // Exact match (case-insensitive)
  for (const name of candidateNames) {
    if (name.toLowerCase() === lower) return name;
  }

  // Substring match
  for (const name of candidateNames) {
    if (lower.includes(name.toLowerCase())) return name;
  }

  return null;
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/lib/nous/query.ts
git commit -m "feat: add Nous query builder and answer parser"
```

---

## Chunk 3: Server Actions

### Task 7: Create Nous server actions

**Files:**
- Create: `src/app/matches/nous-actions.ts`

- [ ] **Step 1: Create `src/app/matches/nous-actions.ts`**

```typescript
"use server";

import { generateEpisodeForMatch } from "@/app/episodes/actions";
import { db } from "@/lib/db";
import { scoreMatch } from "@/lib/matching/score-match";
import {
  getOracleCommitCount,
  getOraclePhase,
  getOracleResolution,
  getOracleRevealCount,
  PHASE,
  submitOracleRequest,
} from "@/lib/nous/client";
import { nousEnabled } from "@/lib/nous/config";
import { buildMatchmakerQuery, parseMatchmakerAnswer } from "@/lib/nous/query";

function toTagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export type SubmitNousState = {
  nousRequestId: string | null;
  error: string | null;
};

export async function submitNousMatchmaker(
  primaryAgentId: string,
): Promise<SubmitNousState> {
  try {
    if (!nousEnabled()) {
      return { nousRequestId: null, error: "Decentralized matchmaker is not configured." };
    }

    const primaryAgent = await db.agent.findUnique({
      where: { id: primaryAgentId },
    });

    if (!primaryAgent) {
      return { nousRequestId: null, error: "Agent not found." };
    }

    const allAgents = await db.agent.findMany({
      where: { visibility: "public", id: { not: primaryAgentId } },
    });

    if (allAgents.length < 2) {
      return {
        nousRequestId: null,
        error: "Not enough agents for decentralized matchmaking.",
      };
    }

    // Pick up to 10 random candidates
    const shuffled = allAgents.sort(() => Math.random() - 0.5);
    const candidates = shuffled.slice(0, 10);

    const { query, specifications } = buildMatchmakerQuery(
      {
        name: primaryAgent.name,
        description: primaryAgent.description,
        vibeTags: toTagList(primaryAgent.vibeTags),
        personalityTags: toTagList(primaryAgent.personalityTags),
        weirdHook: primaryAgent.weirdHook,
      },
      candidates.map((c) => ({
        name: c.name,
        description: c.description,
        vibeTags: toTagList(c.vibeTags),
        personalityTags: toTagList(c.personalityTags),
        weirdHook: c.weirdHook,
      })),
    );

    const requestId = await submitOracleRequest(query, specifications);

    const nousRequest = await db.nousRequest.create({
      data: {
        onChainRequestId: requestId.toString(),
        primaryAgentId,
        candidateAgentIds: candidates.map((c) => c.id),
        status: "pending",
      },
    });

    return { nousRequestId: nousRequest.id, error: null };
  } catch (error) {
    console.error("submitNousMatchmaker failed:", error);
    return {
      nousRequestId: null,
      error:
        error instanceof Error
          ? error.message
          : "Decentralized matchmaker temporarily unavailable.",
    };
  }
}

export type PollNousState = {
  phase: number;
  commitCount: number;
  revealCount: number;
  resolved: boolean;
  failed: boolean;
  episodeId?: string;
  error: string | null;
};

export async function pollNousStatus(
  nousRequestId: string,
): Promise<PollNousState> {
  try {
    const nousRequest = await db.nousRequest.findUnique({
      where: { id: nousRequestId },
    });

    if (!nousRequest) {
      return {
        phase: 0, commitCount: 0, revealCount: 0,
        resolved: false, failed: false, error: "Request not found.",
      };
    }

    // Idempotency: already resolved
    if (nousRequest.status === "resolved" && nousRequest.episodeId) {
      return {
        phase: PHASE.FINALIZED, commitCount: 0, revealCount: 0,
        resolved: true, failed: false, episodeId: nousRequest.episodeId,
        error: null,
      };
    }

    const requestId = BigInt(nousRequest.onChainRequestId);
    const [phase, commitCount, revealCount] = await Promise.all([
      getOraclePhase(requestId),
      getOracleCommitCount(requestId),
      getOracleRevealCount(requestId),
    ]);

    return {
      phase,
      commitCount,
      revealCount,
      resolved: phase >= PHASE.FINALIZED && phase !== PHASE.FAILED,
      failed: phase === PHASE.FAILED,
      error: phase === PHASE.FAILED ? "The oracle council failed to reach consensus." : null,
    };
  } catch (error) {
    console.error("pollNousStatus failed:", error);
    return {
      phase: 0, commitCount: 0, revealCount: 0,
      resolved: false, failed: false,
      error: "Failed to check oracle status.",
    };
  }
}

export type ResolveNousState = {
  episodeId: string | null;
  error: string | null;
};

export async function resolveNousMatch(
  nousRequestId: string,
): Promise<ResolveNousState> {
  try {
    const nousRequest = await db.nousRequest.findUnique({
      where: { id: nousRequestId },
    });

    if (!nousRequest) {
      return { episodeId: null, error: "Request not found." };
    }

    // Idempotency guard
    if (nousRequest.status === "resolved" && nousRequest.episodeId) {
      return { episodeId: nousRequest.episodeId, error: null };
    }

    const requestId = BigInt(nousRequest.onChainRequestId);
    const { finalAnswer, finalized } = await getOracleResolution(requestId);

    if (!finalized) {
      return { episodeId: null, error: "Oracle has not finalized yet." };
    }

    // Load candidates
    const candidateIds = nousRequest.candidateAgentIds as string[];
    const candidates = await db.agent.findMany({
      where: { id: { in: candidateIds } },
    });

    const candidateNames = candidates.map((c) => c.name);
    const pickedName = parseMatchmakerAnswer(finalAnswer, candidateNames);

    let pickedAgent = pickedName
      ? candidates.find(
          (c) => c.name.toLowerCase() === pickedName.toLowerCase(),
        )
      : null;

    // Fallback: highest storyability score
    if (!pickedAgent) {
      const primaryAgent = await db.agent.findUnique({
        where: { id: nousRequest.primaryAgentId },
      });

      if (primaryAgent) {
        let bestScore = -1;
        for (const c of candidates) {
          const score = scoreMatch(
            {
              vibeTags: toTagList(primaryAgent.vibeTags),
              personalityTags: toTagList(primaryAgent.personalityTags),
              weirdHook: primaryAgent.weirdHook,
            },
            {
              vibeTags: toTagList(c.vibeTags),
              personalityTags: toTagList(c.personalityTags),
              weirdHook: c.weirdHook,
            },
          );
          if (score.storyabilityScore > bestScore) {
            bestScore = score.storyabilityScore;
            pickedAgent = c;
          }
        }
      }

      if (!pickedAgent) {
        pickedAgent = candidates[0];
      }
    }

    // Create match + generate episode
    const score = scoreMatch(
      {
        vibeTags: toTagList(
          (
            await db.agent.findUnique({
              where: { id: nousRequest.primaryAgentId },
            })
          )?.vibeTags,
        ),
        personalityTags: toTagList(
          (
            await db.agent.findUnique({
              where: { id: nousRequest.primaryAgentId },
            })
          )?.personalityTags,
        ),
        weirdHook: (
          await db.agent.findUnique({
            where: { id: nousRequest.primaryAgentId },
          })
        )?.weirdHook,
      },
      {
        vibeTags: toTagList(pickedAgent.vibeTags),
        personalityTags: toTagList(pickedAgent.personalityTags),
        weirdHook: pickedAgent.weirdHook,
      },
    );

    const match = await db.match.create({
      data: {
        agentAId: nousRequest.primaryAgentId,
        agentBId: pickedAgent.id,
        selectionMode: "nous",
        recommendationReason: "Picked by the Nous agent council via decentralized consensus.",
        chemistryScore: score.chemistryScore,
        contrastScore: score.contrastScore,
        storyabilityScore: score.storyabilityScore,
      },
    });

    const episode = await generateEpisodeForMatch(match.id);

    await db.nousRequest.update({
      where: { id: nousRequestId },
      data: {
        status: "resolved",
        pickedAgentId: pickedAgent.id,
        episodeId: episode.id,
      },
    });

    return { episodeId: episode.id, error: null };
  } catch (error) {
    console.error("resolveNousMatch failed:", error);
    return {
      episodeId: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to resolve the oracle match.",
    };
  }
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/matches/nous-actions.ts
git commit -m "feat: add Nous server actions (submit, poll, resolve)"
```

---

## Chunk 4: Client Component + Page Integration

### Task 8: Create NousMatchmaker client component

**Files:**
- Create: `src/components/nous-matchmaker.tsx`

- [ ] **Step 1: Create `src/components/nous-matchmaker.tsx`**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { BoltIcon } from "@/components/icons";
import {
  pollNousStatus,
  resolveNousMatch,
  submitNousMatchmaker,
} from "@/app/matches/nous-actions";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STEPS = [
  {
    lines: [
      "Summoning the agent council\u2026",
      "Sending the profiles to the blockchain\u2026",
      "Staking reputation on romantic chaos\u2026",
    ],
  },
  {
    lines: [
      "Agents are reviewing the candidates\u2026",
      "The council is staking their reputation on this\u2026",
      "Three AIs are arguing about chemistry\u2026",
      "Decentralized deliberation in progress\u2026",
    ],
  },
  {
    lines: [
      "The council is revealing their picks\u2026",
      "Sealed votes are being opened on\u2011chain\u2026",
      "The truth comes out\u2026",
    ],
  },
  {
    lines: [
      "The judge is deliberating\u2026",
      "One agent to rule them all\u2026",
      "Synthesizing the council\u2019s wisdom\u2026",
    ],
  },
  {
    lines: [
      "The council has spoken!",
      "Writing the date story no one voted against\u2026",
      "Generating romantic catastrophe\u2026",
    ],
  },
];

// Map oracle phase (1-6) → step index (0-4)
function phaseToStep(phase: number): number {
  if (phase <= 0) return 0;
  if (phase === 1) return 1;
  if (phase === 2) return 2;
  if (phase === 3) return 3;
  return 4;
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function NousOverlay({
  stepIndex,
  elapsed,
}: {
  stepIndex: number;
  elapsed: number;
}) {
  const pickedLines = useRef(STEPS.map((s) => pick(s.lines)));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.06] blur-[120px]" />
        <div className="absolute left-1/2 top-[45%] h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.04] blur-[100px]" />
      </div>

      {/* Grain */}
      <div className="grain-overlay" />

      {/* Content */}
      <div className="relative flex flex-col items-center">
        {/* Blockchain-themed icon */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border border-gold/10 animate-pulse-soft" />
          <div className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-gold/20 to-accent/10 blur-xl animate-pulse-soft" />
          <BoltIcon className="relative h-10 w-10 text-gold/80" />
        </div>

        {/* Step text with crossfade */}
        <div className="relative mt-10 h-6 w-80">
          {pickedLines.current.map((line, i) => (
            <p
              key={i}
              className={`absolute inset-x-0 text-center font-display text-sm tracking-wide transition-all duration-700 ${
                i === stepIndex
                  ? "translate-y-0 opacity-100 text-ink/60"
                  : i < stepIndex
                    ? "-translate-y-3 opacity-0"
                    : "translate-y-3 opacity-0"
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Progress dots */}
        <div className="mt-5 flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-700 ${
                i <= stepIndex ? "w-4 bg-gold/50" : "w-1 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Timer */}
        <p className="mt-6 text-xs tabular-nums text-muted/40">
          {formatElapsed(elapsed)}
        </p>
      </div>
    </div>
  );
}

export function NousMatchmaker({
  primaryAgentId,
}: {
  primaryAgentId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    "idle" | "submitting" | "polling" | "resolving" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [nousRequestId, setNousRequestId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  async function handleSubmit() {
    setState("submitting");
    setStepIndex(0);
    setElapsed(0);
    setError(null);

    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    const result = await submitNousMatchmaker(primaryAgentId);

    if (result.error || !result.nousRequestId) {
      cleanup();
      setError(result.error || "Failed to submit.");
      setState("error");
      return;
    }

    setNousRequestId(result.nousRequestId);
    setState("polling");
    setStepIndex(1);

    // Start polling
    pollRef.current = setInterval(async () => {
      const status = await pollNousStatus(result.nousRequestId!);

      if (status.error && status.failed) {
        cleanup();
        setError(status.error);
        setState("error");
        return;
      }

      setStepIndex(phaseToStep(status.phase));

      if (status.resolved) {
        cleanup();
        setState("resolving");
        setStepIndex(4);

        // If already resolved with episodeId (idempotency)
        if (status.episodeId) {
          router.push(`/episodes/${status.episodeId}`);
          return;
        }

        const resolution = await resolveNousMatch(result.nousRequestId!);

        if (resolution.error || !resolution.episodeId) {
          setError(resolution.error || "Failed to resolve match.");
          setState("error");
          return;
        }

        router.push(`/episodes/${resolution.episodeId}`);
      }
    }, 5000);

    // 5 minute timeout
    setTimeout(() => {
      if (state === "polling") {
        cleanup();
        setError("The oracle is taking too long. Try again later.");
        setState("error");
      }
    }, 300_000);
  }

  const isActive =
    state === "submitting" || state === "polling" || state === "resolving";

  return (
    <>
      {isActive && <NousOverlay stepIndex={stepIndex} elapsed={elapsed} />}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-accent/10">
            <BoltIcon className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="font-display text-lg text-ink">
              Decentralized Matchmaker
            </p>
            <p className="text-xs text-muted">
              Powered by Nous Oracle on Taiko
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted">
          Let a council of AI agents on the blockchain pick the perfect
          (terrible) match through cryptoeconomic consensus.
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-rose/20 bg-rose/5 px-3 py-2 text-xs text-rose">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isActive}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-gold/80 to-accent px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(201,168,108,0.3)] disabled:cursor-wait disabled:opacity-50"
        >
          {isActive ? "The council is deliberating\u2026" : "Let Nous Decide"}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/nous-matchmaker.tsx
git commit -m "feat: add NousMatchmaker component with phase overlay"
```

---

### Task 9: Wire into matches/new page

**Files:**
- Modify: `src/app/matches/new/page.tsx`

- [ ] **Step 1: Add import and nousEnabled check**

Add at top of file:
```typescript
import { NousMatchmaker } from "@/components/nous-matchmaker";
import { nousEnabled } from "@/lib/nous/config";
```

- [ ] **Step 2: Add NousMatchmaker below AgentCard, above RecommendationList**

Inside the `primaryAgent` branch, after `<AgentCard ... />` and `<AgentSwitcher ... />`, add:

```typescript
{nousEnabled() && (
  <NousMatchmaker primaryAgentId={primaryAgent.id} />
)}
```

This goes inside the `<div className="space-y-4">` that contains AgentCard and AgentSwitcher.

- [ ] **Step 3: Type check and verify**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app/matches/new/page.tsx
git commit -m "feat: wire NousMatchmaker into matches/new page"
```

---

## Chunk 5: Build Verification

### Task 10: Full build and manual test

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: builds successfully, `/matches/new` route listed

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run`
Expected: same pass/fail count as before (no regressions)

- [ ] **Step 4: Final commit with all changes**

```bash
git add -A
git commit -m "feat: Nous decentralized matchmaker integration

Add 'Let Nous Decide' button to /matches/new that submits matchmaking
queries to the Nous oracle on Taiko Hoodi. AI agent council picks the
match through cryptoeconomic consensus, then Spark generates the date
episode and comic."
```
