type ModerationInput = {
  name: string;
  description: string;
};

type ModerationResult = {
  allowed: boolean;
  reason?: string;
};

const sexualPatterns = [/\bexplicit\b/i, /\bnsfw\b/i, /\bsexual\b/i];
const hatefulPatterns = [/\bhate speech\b/i, /\bslur\b/i];

function matchesAnyPattern(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export async function moderateAgentInput(input: ModerationInput): Promise<ModerationResult> {
  const haystack = `${input.name}\n${input.description}`;

  if (matchesAnyPattern(haystack, sexualPatterns)) {
    return {
      allowed: false,
      reason: "Profiles must stay playful and non-explicit.",
    };
  }

  if (matchesAnyPattern(haystack, hatefulPatterns)) {
    return {
      allowed: false,
      reason: "Profiles cannot include hateful or abusive framing.",
    };
  }

  return { allowed: true };
}
