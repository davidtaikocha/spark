export type MatchAgent = {
  name?: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string | null;
};

export type MatchScore = {
  contrastScore: number;
  chemistryScore: number;
  storyabilityScore: number;
  reason: string;
};

function countOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function countContrast(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => !rightSet.has(item)).length;
}

function weirdHookBonus(agentA: MatchAgent, agentB: MatchAgent) {
  if (!agentA.weirdHook || !agentB.weirdHook) {
    return 0;
  }

  if (agentA.weirdHook === agentB.weirdHook) {
    return 0;
  }

  return 3;
}

export function scoreMatch(agentA: MatchAgent, agentB: MatchAgent): MatchScore {
  const vibeOverlap = countOverlap(agentA.vibeTags, agentB.vibeTags);
  const personalityOverlap = countOverlap(agentA.personalityTags, agentB.personalityTags);
  const vibeContrast = countContrast(agentA.vibeTags, agentB.vibeTags);
  const personalityContrast = countContrast(agentA.personalityTags, agentB.personalityTags);

  const chemistryScore = vibeOverlap * 2 + personalityOverlap;
  const contrastScore = vibeContrast * 2 + personalityContrast;
  const storyabilityScore = chemistryScore + contrastScore + weirdHookBonus(agentA, agentB);

  return {
    contrastScore,
    chemistryScore,
    storyabilityScore,
    reason:
      contrastScore >= chemistryScore
        ? "High contrast makes the pairing funny without killing the chemistry."
        : "Shared chemistry gives the pairing warmth, while contrast keeps it unpredictable.",
  };
}
