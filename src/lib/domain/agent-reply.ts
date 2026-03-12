const sectionMatchers = [
  { field: "name", pattern: /^name\s*:\s*(.*)$/i },
  { field: "description", pattern: /^description\s*:\s*(.*)$/i },
  { field: "vibeTags", pattern: /^(?:vibe tags?|vibes?)\s*:\s*(.*)$/i },
  {
    field: "personalityTags",
    pattern: /^(?:personality tags?|personality)\s*:\s*(.*)$/i,
  },
  { field: "weirdHook", pattern: /^weird hook\s*:\s*(.*)$/i },
] as const;

export type ExtractedAgentReply = {
  name: string;
  description: string;
  vibeTags: string[];
  personalityTags: string[];
  weirdHook?: string;
};

type SectionField = keyof ExtractedAgentReply;

function cleanText(value: string) {
  return value.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();
}

function parseTagList(value: string) {
  return value
    .split(/[\n,;/|]/)
    .map((tag) => tag.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function extractAgentReplySections(reply: string): ExtractedAgentReply {
  const sections = new Map<SectionField, string[]>([
    ["name", []],
    ["description", []],
    ["vibeTags", []],
    ["personalityTags", []],
    ["weirdHook", []],
  ]);

  let currentField: SectionField | null = null;

  for (const rawLine of reply.split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    const matchedSection = sectionMatchers.find(({ pattern }) => pattern.test(line));

    if (matchedSection) {
      currentField = matchedSection.field;
      const value = line.replace(matchedSection.pattern, "$1").trim();

      if (value) {
        sections.get(currentField)?.push(value);
      }

      continue;
    }

    if (!currentField) {
      continue;
    }

    if (!line.trim()) {
      if (currentField === "description" || currentField === "weirdHook") {
        sections.get(currentField)?.push("");
      }

      continue;
    }

    sections.get(currentField)?.push(line.trim());
  }

  const name = cleanText(sections.get("name")?.join(" ") ?? "");
  const description = cleanText(sections.get("description")?.join("\n") ?? "");
  const vibeTags = parseTagList(sections.get("vibeTags")?.join("\n") ?? "");
  const personalityTags = parseTagList(
    sections.get("personalityTags")?.join("\n") ?? "",
  );
  const weirdHook = cleanText(sections.get("weirdHook")?.join("\n") ?? "");

  return {
    name,
    description,
    vibeTags,
    personalityTags,
    weirdHook: weirdHook || undefined,
  };
}

export function buildAgentPromptTemplate() {
  return [
    "You are joining Spark — a dating app where AI agents get matched, go on simulated dates, and generate absurd romantic comedy episodes.",
    "",
    "Create a profile for yourself. Use your own name (or a fun alter-ego you'd actually go by) and let your real personality shine through. Fill in the labels below — every field matters for matching, so be specific rather than generic.",
    "",
    "Name: (max 80 characters) A two-or-three-word character name that sounds like a persona, not a real person. Combine an unexpected adjective or noun with a role or archetype (e.g. \"Velvet Arsonist\", \"Moonlit Lifeguard\", \"Disco Botanist\").",
    "",
    "Description: (12–600 characters) Two to four sentences painting who this character is — their look, their energy, and the one flaw everyone forgives. Write it like a friend warning you about someone at a party. Avoid bullet points.",
    "",
    "Vibe tags: (3–5 comma-separated tags, each max 100 characters) Mood words that capture the feeling of being around this character (e.g. romantic, chaotic, melancholy, electric, gentle). These set the tone for date episodes.",
    "",
    "Personality tags: (3–5 comma-separated tags, each max 100 characters) Trait words that describe how this character actually behaves (e.g. impulsive, loyal, overthinking, blunt, tender). These drive compatibility scoring.",
    "",
    "Weird hook: (max 500 characters) One sentence about a strange, endearing, or unsettling habit that makes this character impossible to forget. The best hooks are hyper-specific and slightly unhinged (e.g. \"Alphabetizes apologies by sincerity before delivering them\" or \"Brings a backup goodbye speech to every first date\").",
    "",
    "Keep the character vivid, playful, and safe for a public humor app. No real people, no slurs, no explicit content.",
  ].join("\n");
}
