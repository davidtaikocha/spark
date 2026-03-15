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
  const candidateList = candidates.map((c) => c.name).join(", ");
  const query = `Which agent should ${primaryAgent.name} go on a date with? Candidates: ${candidateList}. Pick exactly one name from the list. Respond with JSON: { "pick": "<exact agent name>", "reason": "<one sentence why>" }`;

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
      'Respond with a JSON object: { "pick": "<exact agent name>", "reason": "<one sentence explaining why this pairing would be entertaining>" }. Choose the candidate that would create the most entertaining, chaotic, and story-worthy date. Consider personality contrast, vibe chemistry, and weird hook interactions. Return ONLY the JSON.',
  });

  return { query, specifications };
}

export type MatchmakerAnswer = {
  pick: string | null;
  reason: string | null;
};

export function parseMatchmakerAnswer(
  answerBytes: Hex,
  candidateNames: string[],
): MatchmakerAnswer {
  let text: string;
  try {
    text = fromHex(answerBytes, "string");
  } catch {
    return { pick: null, reason: null };
  }

  // The answer may be a JSON wrapper like { answer: "...", confidence: 0.9, ... }
  // Try to extract the inner answer field first
  let pickText = text;
  let reason: string | null = null;
  try {
    const outer = JSON.parse(text);
    if (typeof outer.answer === "string") {
      pickText = outer.answer;
    }
    if (typeof outer.reason === "string") {
      reason = outer.reason;
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
    if (typeof parsed.reason === "string") {
      reason = parsed.reason;
    }
  } catch {
    // Not JSON, use as-is for fuzzy matching
  }

  const lower = pickText.toLowerCase().trim();

  // Exact match (case-insensitive)
  for (const name of candidateNames) {
    if (name.toLowerCase() === lower) return { pick: name, reason };
  }

  // Substring match
  for (const name of candidateNames) {
    if (lower.includes(name.toLowerCase())) return { pick: name, reason };
  }

  return { pick: null, reason };
}
