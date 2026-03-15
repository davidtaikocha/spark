"use server";

import { generateEpisode } from "@/lib/ai/generate-episode";
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

const log = (...args: unknown[]) => console.log("[nous]", ...args);
const logErr = (...args: unknown[]) => console.error("[nous]", ...args);

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
    log("submitNousMatchmaker called", { primaryAgentId });

    if (!nousEnabled()) {
      log("nous not enabled (no NOUS_PRIVATE_KEY)");
      return {
        nousRequestId: null,
        error: "Decentralized matchmaker is not configured.",
      };
    }

    const primaryAgent = await db.agent.findUnique({
      where: { id: primaryAgentId },
    });

    if (!primaryAgent) {
      log("primary agent not found:", primaryAgentId);
      return { nousRequestId: null, error: "Agent not found." };
    }

    log("primary agent:", primaryAgent.name);

    const allAgents = await db.agent.findMany({
      where: { visibility: "public", id: { not: primaryAgentId } },
    });

    log("available candidates:", allAgents.length);

    if (allAgents.length < 2) {
      return {
        nousRequestId: null,
        error: "Not enough agents for decentralized matchmaking.",
      };
    }

    // Pick up to 10 random candidates
    const shuffled = allAgents.sort(() => Math.random() - 0.5);
    const candidates = shuffled.slice(0, 10);

    log("selected candidates:", candidates.map((c) => c.name).join(", "));

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

    log("query:", query);
    log("submitting oracle request...");

    const requestId = await submitOracleRequest(query, specifications);

    log("oracle request submitted, on-chain requestId:", requestId.toString());

    const nousRequest = await db.nousRequest.create({
      data: {
        onChainRequestId: requestId.toString(),
        primaryAgentId,
        candidateAgentIds: candidates.map((c) => c.id),
        status: "pending",
      },
    });

    log("NousRequest created:", nousRequest.id);

    return { nousRequestId: nousRequest.id, error: null };
  } catch (error) {
    logErr("submitNousMatchmaker failed:", error);
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
      log("poll: request not found:", nousRequestId);
      return {
        phase: 0,
        commitCount: 0,
        revealCount: 0,
        resolved: false,
        failed: false,
        error: "Request not found.",
      };
    }

    // Idempotency: already resolved
    if (nousRequest.status === "resolved" && nousRequest.episodeId) {
      log("poll: already resolved, episodeId:", nousRequest.episodeId);
      return {
        phase: PHASE.FINALIZED,
        commitCount: 0,
        revealCount: 0,
        resolved: true,
        failed: false,
        episodeId: nousRequest.episodeId,
        error: null,
      };
    }

    const requestId = BigInt(nousRequest.onChainRequestId);
    const [phase, commitCount, revealCount] = await Promise.all([
      getOraclePhase(requestId),
      getOracleCommitCount(requestId),
      getOracleRevealCount(requestId),
    ]);

    log(
      `poll: onChainId=${nousRequest.onChainRequestId} phase=${phase} commits=${commitCount} reveals=${revealCount}`,
    );

    return {
      phase,
      commitCount,
      revealCount,
      resolved: phase >= PHASE.FINALIZED && phase !== PHASE.FAILED,
      failed: phase === PHASE.FAILED,
      error:
        phase === PHASE.FAILED
          ? "The oracle council failed to reach consensus."
          : null,
    };
  } catch (error) {
    logErr("pollNousStatus failed:", error);
    return {
      phase: 0,
      commitCount: 0,
      revealCount: 0,
      resolved: false,
      failed: false,
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
    log("resolveNousMatch called:", nousRequestId);

    const nousRequest = await db.nousRequest.findUnique({
      where: { id: nousRequestId },
    });

    if (!nousRequest) {
      log("resolve: request not found:", nousRequestId);
      return { episodeId: null, error: "Request not found." };
    }

    // Idempotency guard
    if (nousRequest.status === "resolved" && nousRequest.episodeId) {
      log("resolve: already resolved, episodeId:", nousRequest.episodeId);
      return { episodeId: nousRequest.episodeId, error: null };
    }

    const requestId = BigInt(nousRequest.onChainRequestId);
    log("resolve: reading on-chain resolution for requestId:", requestId.toString());

    const { finalAnswer, finalized } = await getOracleResolution(requestId);
    log("resolve: finalized:", finalized, "finalAnswer:", finalAnswer);

    if (!finalized) {
      return { episodeId: null, error: "Oracle has not finalized yet." };
    }

    // Load candidates
    const candidateIds = nousRequest.candidateAgentIds as string[];
    const candidates = await db.agent.findMany({
      where: { id: { in: candidateIds } },
    });

    log("resolve: loaded", candidates.length, "candidates");

    const candidateNames = candidates.map((c) => c.name);
    const { pick: pickedName, reason: nousReason } = parseMatchmakerAnswer(
      finalAnswer,
      candidateNames,
    );

    log("resolve: parsed pick:", pickedName, "reason:", nousReason);

    let pickedAgent = pickedName
      ? candidates.find(
          (c) => c.name.toLowerCase() === pickedName.toLowerCase(),
        )
      : null;

    // Fallback: highest storyability score
    if (!pickedAgent) {
      log("resolve: pick not matched, falling back to highest storyability");
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

      log("resolve: fallback picked:", pickedAgent.name);
    } else {
      log("resolve: nous picked:", pickedAgent.name);
    }

    // Load primary agent for scoring
    const primaryAgent = await db.agent.findUnique({
      where: { id: nousRequest.primaryAgentId },
    });

    const score = scoreMatch(
      {
        vibeTags: toTagList(primaryAgent?.vibeTags),
        personalityTags: toTagList(primaryAgent?.personalityTags),
        weirdHook: primaryAgent?.weirdHook,
      },
      {
        vibeTags: toTagList(pickedAgent.vibeTags),
        personalityTags: toTagList(pickedAgent.personalityTags),
        weirdHook: pickedAgent.weirdHook,
      },
    );

    log("resolve: creating match", primaryAgent?.name, "x", pickedAgent.name, "score:", score);

    const match = await db.match.create({
      data: {
        agentAId: nousRequest.primaryAgentId,
        agentBId: pickedAgent.id,
        selectionMode: "nous",
        recommendationReason:
          nousReason ||
          "Picked by the Nous agent council via decentralized consensus.",
        chemistryScore: score.chemistryScore,
        contrastScore: score.contrastScore,
        storyabilityScore: score.storyabilityScore,
      },
    });

    log("resolve: match created:", match.id, "— generating episode (skipping comic)...");

    // Inline episode generation without comic to stay within Vercel timeout
    const matchWithAgents = await db.match.findUniqueOrThrow({
      where: { id: match.id },
      include: { agentA: true, agentB: true },
    });

    const generatedEpisode = await generateEpisode({
      agentA: {
        name: matchWithAgents.agentA.name,
        description: matchWithAgents.agentA.description,
        vibeTags: toTagList(matchWithAgents.agentA.vibeTags),
        personalityTags: toTagList(matchWithAgents.agentA.personalityTags),
        weirdHook: matchWithAgents.agentA.weirdHook,
      },
      agentB: {
        name: matchWithAgents.agentB.name,
        description: matchWithAgents.agentB.description,
        vibeTags: toTagList(matchWithAgents.agentB.vibeTags),
        personalityTags: toTagList(matchWithAgents.agentB.personalityTags),
        weirdHook: matchWithAgents.agentB.weirdHook,
      },
      tone: "mixed",
    });

    const episode = await db.episode.create({
      data: {
        matchId: match.id,
        title: generatedEpisode.title,
        tone: generatedEpisode.tone,
        setting: generatedEpisode.setting,
        beats: generatedEpisode.beats,
        ending: generatedEpisode.ending,
        shareSummary: generatedEpisode.shareSummary,
        status: "ready",
        comicStatus: "pending",
      },
    });

    log("resolve: episode generated:", episode.id);

    await db.nousRequest.update({
      where: { id: nousRequestId },
      data: {
        status: "resolved",
        pickedAgentId: pickedAgent.id,
        episodeId: episode.id,
      },
    });

    log("resolve: NousRequest updated to resolved");

    return { episodeId: episode.id, error: null };
  } catch (error) {
    logErr("resolveNousMatch failed:", error);
    return {
      episodeId: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to resolve the oracle match.",
    };
  }
}
