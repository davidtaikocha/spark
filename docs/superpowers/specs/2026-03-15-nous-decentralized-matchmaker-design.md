# Nous Decentralized Matchmaker

## Overview

Add a "Let Nous Decide" feature to the `/matches/new` page. Instead of the deterministic scoring algorithm, a decentralized AI agent council (Nous Oracle on Taiko Hoodi) picks the match through a cryptoeconomically-secured consensus process. The result feeds into the existing episode + comic generation pipeline.

## Context

- **Nous Oracle**: ERC-8033 Agent Council Oracle deployed at `0x9a78aD39f2cA73059e7C7963Dd0D49e46f404434` on Taiko Hoodi (`https://rpc.hoodi.taiko.xyz`)
- **Protocol**: Commit-reveal voting with judge arbitration. Phases: Committing → Revealing → Judging → Finalized → Distributed → Failed
- **Integration**: Server-side wallet submits requests. User never touches a wallet.
- **Wallet funding**: Server wallet requires Taiko Hoodi testnet ETH for gas + reward amounts. Fund via faucet before first use.

## User Flow

1. User selects a primary agent on `/matches/new`
2. User clicks "Let Nous Decide" button (alongside existing recommendation list)
3. Loading overlay appears with oracle-phase-aware status messages
4. Behind the scenes:
   - Server picks 10 random candidate agents (or fewer if DB has < 10; minimum 2 required)
   - Server wallet calls `createRequest()` on the oracle contract
   - Client polls oracle phase every 5 seconds
   - On resolution: server decodes the picked agent, creates match, generates episode + comic
   - On failure (phase 6): client immediately shows error
5. User is redirected to the episode page

## Architecture

### New Files

#### `src/lib/nous/config.ts`
Environment variable parsing:
- `NOUS_RPC_URL` — Taiko Hoodi RPC endpoint (default: `https://rpc.hoodi.taiko.xyz`)
- `NOUS_ORACLE_ADDRESS` — Deployed oracle contract address
- `NOUS_PRIVATE_KEY` — Server wallet private key for signing transactions
- `NOUS_BOND_AMOUNT` — Bond amount in wei for each request (default: `"100000000000000"`)
- `NOUS_REWARD_AMOUNT` — Reward pool in wei (default: `"100000000000000"`)
- `NOUS_COMMIT_DEADLINE_SECONDS` — Commit phase duration in seconds (default: 120)
- `NOUS_NUM_AGENTS` — Number of info agents required (default: 3)
- `nousEnabled()` — Returns `true` only if `NOUS_PRIVATE_KEY` is set

#### `src/lib/nous/abi.ts`
Oracle ABI subset. Copy read functions from `/Users/davidcai/taiko/hackathon/nous/client/src/oracleAbi.ts`. **Note**: `createRequest` is missing from that file — hand-write it from the Solidity interface at `/Users/davidcai/taiko/hackathon/nous/src/IAgentCouncilOracle.sol`:

```typescript
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
}
```

#### `src/lib/nous/client.ts`
Viem-based oracle client:
- `createNousClients()` — Returns `{ publicClient, walletClient }` configured for Taiko Hoodi chain using server wallet private key
- `submitOracleRequest(query, specifications)` — Assembles all 9 `createRequest` parameters:
  - `query` and `specifications`: passed in
  - `numInfoAgents`: from config
  - `rewardAmount`, `bondAmount`: from config (as `bigint`)
  - `deadline`: `BigInt(Math.floor(Date.now() / 1000) + config.commitDeadlineSeconds)` — **absolute Unix timestamp**, not duration
  - `rewardToken`: `0x0000000000000000000000000000000000000000` (native ETH)
  - `bondToken`: `0x0000000000000000000000000000000000000000` (native ETH)
  - `requiredCapabilities`: `{ capabilities: ["text"], domains: [] }`
  - **Must pass `value: rewardAmount`** in the transaction since `rewardToken` is native ETH
  - Returns `requestId` as `bigint`, serialize to string for DB storage
- `getOraclePhase(requestId: bigint)` — Calls `phases(requestId)`, returns `number` (0-6)
- `getOracleResolution(requestId: bigint)` — Calls `getResolution(requestId)`, returns `{ finalAnswer: Hex, finalized: boolean }`
- `getOracleCommitCount(requestId: bigint)` — Calls `getCommits(requestId)`, returns `agents.length`
- `getOracleRevealCount(requestId: bigint)` — Calls `getReveals(requestId)`, returns `agents.length`

Phase enum:
```
0 = None, 1 = Committing, 2 = Revealing, 3 = Judging,
4 = Finalized, 5 = Distributed, 6 = Failed
```

#### `src/lib/nous/query.ts`
Query builder:
- `buildMatchmakerQuery(primaryAgent, candidates)` — Builds the query string and specifications JSON

Query format:
```
query: "Which agent should {name} go on a date with? Pick exactly one."

specifications: JSON string containing:
{
  "task": "matchmaking",
  "primaryAgent": { name, description, vibeTags, personalityTags, weirdHook },
  "candidates": [ ...agents with same fields ],
  "instructions": "Respond with a JSON object: { \"pick\": \"<exact agent name>\" }. Choose the candidate that would create the most entertaining, chaotic, and story-worthy date. Consider personality contrast, vibe chemistry, and weird hook interactions. Return ONLY the JSON."
}
```

- `parseMatchmakerAnswer(answerBytes, candidateNames)` — Decodes `bytes` → UTF-8 string → parse JSON → extract `pick` field → match against candidates using: (1) case-insensitive exact match, (2) case-insensitive `includes`, (3) return `null` if no match. Simple approach sufficient for 10 unique agent names.

#### `src/app/matches/nous-actions.ts`
Server actions:

**`submitNousMatchmaker(primaryAgentId: string)`**
- Checks `nousEnabled()`, returns error if not configured
- Loads primary agent from DB
- Picks up to 10 random public agents (excluding primary) from DB; requires minimum 2
- Builds query via `buildMatchmakerQuery`
- Submits to oracle via `submitOracleRequest`
- Stores record in `NousRequest` table with `onChainRequestId: requestId.toString()`
- Returns `{ nousRequestId }`

**`pollNousStatus(nousRequestId: string)`**
- Reads the stored `NousRequest`; if `status === "resolved"`, return existing `episodeId` immediately (idempotency)
- Converts `onChainRequestId` back to `BigInt()` for contract calls
- Calls `getOraclePhase`, `getOracleCommitCount`, `getOracleRevealCount`
- Returns `{ phase, commitCount, revealCount, resolved: boolean, failed: boolean, episodeId?: string }`
- `resolved = phase >= 4`, `failed = phase === 6`

**`resolveNousMatch(nousRequestId: string)`**
- **Idempotency guard**: If `NousRequest.status === "resolved"` and `episodeId` exists, return existing `episodeId` without creating duplicates
- Reads `NousRequest` record, converts `onChainRequestId` to `BigInt`
- Calls `getOracleResolution` to get the final answer bytes
- Parses answer via `parseMatchmakerAnswer` against candidate names
- If parse fails: falls back to candidate with highest storyability score vs primary agent
- Creates Match (`selectionMode: "nous"`) + generates episode via existing `generateEpisodeForMatch`
- Updates `NousRequest` with `status: "resolved"`, `pickedAgentId`, `episodeId`
- Returns `{ episodeId }`

#### `src/components/nous-matchmaker.tsx`
Client component. Does NOT reuse `CreationOverlay` directly (that component uses time-based step delays). Instead, builds a new `NousOverlay` component using the same visual pattern (orbit animation, step text crossfade, progress dots) but with **phase-driven step progression** controlled by poll results.

Three states:

**Idle**: "Let Nous Decide" button with oracle/decentralized theming

**Loading**: Full-screen overlay with phase-aware steps:
```
Step 0 (submitting tx): [
  "Summoning the agent council...",
  "Sending the profiles to the blockchain...",
  "Staking reputation on romantic chaos...",
]
Step 1 (Committing, phase=1): [
  "Agents are reviewing the candidates...",
  "The council is staking their reputation on this...",
  "Three AIs are arguing about chemistry...",
  "Decentralized deliberation in progress...",
]
Step 2 (Revealing, phase=2): [
  "The council is revealing their picks...",
  "Sealed votes are being opened on-chain...",
  "The truth comes out...",
]
Step 3 (Judging, phase=3): [
  "The judge is deliberating...",
  "One agent to rule them all...",
  "Synthesizing the council's wisdom...",
]
Step 4 (Finalized, generating episode): [
  "The council has spoken!",
  "Writing the date story no one voted against...",
  "Generating romantic catastrophe...",
]
```

Polling logic:
- After submit, poll `pollNousStatus` every 5 seconds
- Update step based on returned `phase`
- If `failed: true`, immediately show error
- If `resolved: true`, call `resolveNousMatch`, then redirect to episode page
- Timeout after 5 minutes → show error with retry option

**Error**: Error message with retry button

### Modified Files

#### `prisma/schema.prisma`
Add `NousRequest` model:
```prisma
model NousRequest {
  id                String   @id @default(cuid())
  onChainRequestId  String   @unique
  primaryAgentId    String
  candidateAgentIds Json     // string[] of agent IDs — validate with Zod on read
  status            String   @default("pending") // pending | resolved | failed
  pickedAgentId     String?
  episodeId         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

Note: `pickedAgentId` and `episodeId` are plain strings (no FK relations) to keep the schema change minimal and avoid inverse relation changes on existing models.

#### `src/app/matches/new/page.tsx`
Add `NousMatchmaker` component below the primary agent card, above the recommendation list. Pass `primaryAgentId` as prop. Only render if `nousEnabled()` returns true.

#### `.env` / `.env.example`
Add:
```
NOUS_PRIVATE_KEY=""
NOUS_RPC_URL="https://rpc.hoodi.taiko.xyz"
NOUS_ORACLE_ADDRESS="0x9a78aD39f2cA73059e7C7963Dd0D49e46f404434"
NOUS_BOND_AMOUNT="100000000000000"
NOUS_REWARD_AMOUNT="100000000000000"
NOUS_COMMIT_DEADLINE_SECONDS="120"
NOUS_NUM_AGENTS="3"
```

### Dependencies

- `viem` — Ethereum client library (add to `package.json`)

### Error Handling

- **Oracle request tx fails**: Show error, allow retry
- **Phase reaches Failed (6)**: Client detects immediately via poll, shows error with retry
- **Phase times out (5 min client-side)**: Show timeout message with retry option
- **Resolution parsing fails** (agent name not found in candidates): Fall back to candidate with highest storyability score among the candidates
- **Episode generation fails**: Same handling as existing pipeline (episode without comic)
- **Server wallet out of gas/funds**: Catch tx error, show "Decentralized matchmaker temporarily unavailable"
- **No `NOUS_PRIVATE_KEY` configured**: Hide the "Let Nous Decide" button entirely (checked server-side)
- **Fewer than 2 agents in DB**: Show "Not enough agents for decentralized matchmaking" message
- **Duplicate resolve calls (race condition)**: `resolveNousMatch` checks `NousRequest.status` first, returns existing `episodeId` if already resolved

### Design Decisions

- **10 random candidates**: Keeps the query concise enough for AI agents to reason about. Random selection ensures variety across requests. Gracefully handles < 10 agents (minimum 2).
- **Server wallet**: Zero-friction UX. User never needs a wallet or testnet tokens. Wallet must be pre-funded with testnet ETH.
- **Short deadlines (2 min commit)**: Makes the experience interactive rather than async. Nous agents should respond within this window if running.
- **Absolute timestamp deadline**: `createRequest` expects a Unix timestamp, not a duration. Computed as `now + NOUS_COMMIT_DEADLINE_SECONDS`.
- **Native ETH for rewards/bonds**: Both `rewardToken` and `bondToken` set to `address(0)`. Transaction must include `value: rewardAmount`.
- **Fuzzy name matching on resolution**: Case-insensitive exact match, then substring match. Simple and sufficient for 10 unique names.
- **`NousRequest` DB table**: Links on-chain request ID (stored as string, converted to BigInt for contract calls) to Spark's agent/episode IDs. Enables idempotent retries.
- **Phase-driven overlay (not time-driven)**: Unlike existing `CreationOverlay` which uses `delay` timers, the Nous overlay advances steps based on polled oracle phase. New component using same visual style.
- **Graceful degradation**: If Nous is unavailable or unconfigured, the existing recommendation list still works. The decentralized matchmaker is additive.
