# Nous Decentralized Matchmaker

## Overview

Add a "Let Nous Decide" feature to the `/matches/new` page. Instead of the deterministic scoring algorithm, a decentralized AI agent council (Nous Oracle on Taiko Hoodi) picks the match through a cryptoeconomically-secured consensus process. The result feeds into the existing episode + comic generation pipeline.

## Context

- **Nous Oracle**: ERC-8033 Agent Council Oracle deployed at `0x9a78aD39f2cA73059e7C7963Dd0D49e46f404434` on Taiko Hoodi (`https://rpc.hoodi.taiko.xyz`)
- **Protocol**: Commit-reveal voting with judge arbitration. Phases: Committing → Revealing → Judging → Finalized → Distributed
- **Integration**: Server-side wallet submits requests. User never touches a wallet.

## User Flow

1. User selects a primary agent on `/matches/new`
2. User clicks "Let Nous Decide" button (alongside existing recommendation list)
3. Loading overlay appears with oracle-phase-aware status messages
4. Behind the scenes:
   - Server picks 10 random candidate agents
   - Server wallet calls `createRequest()` on the oracle contract
   - Client polls oracle phase every 5 seconds
   - On resolution: server decodes the picked agent, creates match, generates episode + comic
5. User is redirected to the episode page

## Architecture

### New Files

#### `src/lib/nous/config.ts`
Environment variable parsing:
- `NOUS_RPC_URL` — Taiko Hoodi RPC endpoint (default: `https://rpc.hoodi.taiko.xyz`)
- `NOUS_ORACLE_ADDRESS` — Deployed oracle contract address
- `NOUS_PRIVATE_KEY` — Server wallet private key for signing transactions
- `NOUS_BOND_AMOUNT` — Bond amount in wei for each request (default: small testnet amount)
- `NOUS_REWARD_AMOUNT` — Reward pool in wei (default: small testnet amount)
- `NOUS_COMMIT_DEADLINE_SECONDS` — Commit phase duration (default: 120)
- `NOUS_NUM_AGENTS` — Number of info agents required (default: 3)

#### `src/lib/nous/client.ts`
Viem-based oracle client:
- `createNousClients()` — Returns `{ publicClient, walletClient }` configured for Taiko Hoodi using server wallet
- `submitOracleRequest(query, specifications)` — Calls `createRequest()` on oracle, returns `requestId`
- `getOraclePhase(requestId)` — Returns current phase (0-6)
- `getOracleResolution(requestId)` — Returns decoded final answer + finalized bool
- `getOracleCommitCount(requestId)` — Returns number of committed agents (for progress display)
- `getOracleRevealCount(requestId)` — Returns number of revealed agents

Phase enum mapping:
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
  "candidates": [ ...10 agents with same fields ],
  "instructions": "Respond with a JSON object: { \"pick\": \"<exact agent name>\" }. Choose the candidate that would create the most entertaining, chaotic, and story-worthy date. Consider personality contrast, vibe chemistry, and weird hook interactions. Return ONLY the JSON."
}
```

- `parseMatchmakerAnswer(answerBytes)` — Decodes `bytes` → UTF-8 → JSON → extracts `pick` field → fuzzy matches against candidate names

#### `src/app/matches/nous-actions.ts`
Server actions:

**`submitNousMatchmaker(primaryAgentId: string)`**
- Loads primary agent from DB
- Picks 10 random public agents (excluding primary) from DB
- Builds query via `buildMatchmakerQuery`
- Submits to oracle via `submitOracleRequest`
- Stores `{ requestId, primaryAgentId, candidateIds }` in a new `NousRequest` DB record
- Returns `{ requestId, nousRequestId }`

**`pollNousStatus(nousRequestId: string)`**
- Reads the stored `NousRequest` to get the on-chain `requestId`
- Calls `getOraclePhase`, `getOracleCommitCount`, `getOracleRevealCount`
- Returns `{ phase, commitCount, revealCount, resolved: bool }`

**`resolveNousMatch(nousRequestId: string)`**
- Reads `NousRequest` record
- Calls `getOracleResolution` to get the final answer bytes
- Parses the answer to extract the picked agent name
- Fuzzy-matches against stored candidate IDs
- Creates Match (selectionMode: "nous") + generates episode via existing pipeline
- Returns `{ episodeId }`

#### `src/components/nous-matchmaker.tsx`
Client component with three states:

**Idle**: "Let Nous Decide" button with oracle/decentralized theming

**Loading**: Full-screen overlay (reuses `CreationOverlay` animation pattern) with phase-aware steps:
```
Step 1 (on submit): [
  "Summoning the agent council...",
  "Sending the profiles to the blockchain...",
  "Staking reputation on romantic chaos...",
]
Step 2 (Committing, phase=1): [
  "Agents are reviewing the candidates...",
  "The council is staking their reputation on this...",
  "Three AIs are arguing about chemistry...",
  "Decentralized deliberation in progress...",
]
Step 3 (Revealing, phase=2): [
  "The council is revealing their picks...",
  "Sealed votes are being opened on-chain...",
  "The truth comes out...",
]
Step 4 (Judging, phase=3): [
  "The judge is deliberating...",
  "One agent to rule them all...",
  "Synthesizing the council's wisdom...",
]
Step 5 (Finalized, generating episode): [
  "The council has spoken!",
  "Writing the date story no one voted against...",
  "Generating romantic catastrophe...",
]
```

Polling logic:
- After submit, poll `pollNousStatus` every 5 seconds
- Update step based on returned phase
- When `resolved: true`, call `resolveNousMatch`, then redirect to episode page
- Timeout after 5 minutes → show error with retry option

**Error**: Error message with retry button

### Modified Files

#### `prisma/schema.prisma`
Add `NousRequest` model:
```prisma
model NousRequest {
  id              String   @id @default(cuid())
  onChainRequestId String  @unique
  primaryAgentId  String
  candidateAgentIds Json   // string[] of agent IDs
  status          String   @default("pending") // pending | resolved | failed
  pickedAgentId   String?
  episodeId       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### `src/app/matches/new/page.tsx`
Add `NousMatchmaker` component below the primary agent card, above the recommendation list. Pass `primaryAgentId` as prop.

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

- **Oracle request fails**: Show error, allow retry
- **Phase times out (5 min client-side)**: Show timeout message, link to check later
- **Resolution parsing fails** (agent name not found in candidates): Fall back to highest storyability score among the 10 candidates
- **Episode generation fails**: Same handling as existing pipeline (episode without comic)
- **Server wallet out of gas/funds**: Catch and show "Decentralized matchmaker temporarily unavailable" message
- **No `NOUS_PRIVATE_KEY` configured**: Hide the "Let Nous Decide" button entirely

### Oracle Contract ABI

Reuse the ABI from `/Users/davidcai/taiko/hackathon/nous/client/src/oracleAbi.ts`. Copy the relevant subset (read functions + `createRequest`) into `src/lib/nous/abi.ts`.

### Design Decisions

- **10 random candidates**: Keeps the query concise enough for AI agents to reason about. Random selection ensures variety across requests.
- **Server wallet**: Zero-friction UX. User never needs a wallet or testnet tokens.
- **Short deadlines (2 min commit)**: Makes the demo interactive rather than async. The Nous agents should respond within this window if they're running.
- **Fuzzy name matching on resolution**: The oracle returns free-text from AI agents. Exact string matching would be brittle. Use case-insensitive substring/distance matching against candidate names.
- **`NousRequest` DB table**: Links the on-chain request ID to Spark's agent/episode IDs. Enables retries and prevents re-creating requests.
- **Graceful degradation**: If Nous is unavailable, the existing recommendation list still works. The decentralized matchmaker is additive.
