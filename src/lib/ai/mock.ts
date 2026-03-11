import type { AgentInput } from "@/lib/domain/agent";
import { extractAgentReplySections } from "@/lib/domain/agent-reply";

import type {
  ComicPromptInput,
  ComicResult,
  Episode,
  EpisodePromptInput,
  InterpretedAgent,
  NormalizedAgent,
  PortraitResult,
} from "./types";

function cleanTagList(tags: string[], fallback: string[]) {
  const cleaned = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

  return cleaned.length > 0 ? cleaned : fallback;
}

function svgToBase64(svg: string) {
  return Buffer.from(svg, "utf8").toString("base64");
}

export function shouldUseMockAi() {
  return process.env.AI_MOCK_MODE === "1" || process.env.OPENAI_API_KEY === "test-key";
}

export function mockNormalizeAgent(input: AgentInput): NormalizedAgent {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    vibeTags: cleanTagList(input.vibeTags, ["romantic", "dramatic"]),
    personalityTags: cleanTagList(input.personalityTags, ["earnest"]),
    weirdHook: input.weirdHook?.trim() || null,
    portraitPrompt: `Cute illustrated portrait of ${input.name} with a warm romantic palette and clean character-card styling.`,
  };
}

function clampDescription(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= 220) {
    return cleaned;
  }

  return `${cleaned.slice(0, 217).trimEnd()}...`;
}

export function mockInterpretAgentReply(reply: string): InterpretedAgent {
  const extracted = extractAgentReplySections(reply);
  const prose = reply.replace(/^[A-Za-z ]+:\s*/gm, "").trim();

  return {
    name: extracted.name || "Mystery Heart",
    description:
      extracted.description ||
      clampDescription(
        prose ||
          "A strange romantic character with enough detail to survive one very dramatic date.",
      ),
    vibeTags: cleanTagList(extracted.vibeTags, ["romantic", "strange"]),
    personalityTags: cleanTagList(extracted.personalityTags, ["earnest", "chaotic"]),
    weirdHook: extracted.weirdHook ?? null,
  };
}

export function mockGeneratePortrait(name: string): PortraitResult {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="768" viewBox="0 0 640 768" fill="none">
      <rect width="640" height="768" fill="#f8efe6"/>
      <rect x="48" y="48" width="544" height="672" rx="40" fill="#ead7c7"/>
      <circle cx="320" cy="278" r="118" fill="#c46a52"/>
      <rect x="176" y="420" width="288" height="188" rx="36" fill="#8f3f2f"/>
      <text x="320" y="650" text-anchor="middle" fill="#4f2f25" font-size="40" font-family="Georgia, serif">${name}</text>
    </svg>
  `;

  return {
    image: {
      base64: svgToBase64(svg),
      mediaType: "image/svg+xml",
    },
    prompt: `Mock illustrated portrait for ${name}`,
    model: "mock-portrait",
  };
}

export function mockGenerateEpisode(input: EpisodePromptInput): Episode {
  const setting = "A candlelit rooftop conservatory";

  return {
    title: `${input.agentA.name} and ${input.agentB.name} almost ruin a perfect evening`,
    tone: input.tone,
    setting,
    beats: [
      {
        label: "Arrival",
        summary: `${input.agentA.name} arrives overdressed and immediately commits to the bit.`,
        visualCue: "Warm glasshouse light and rain on the windows.",
      },
      {
        label: "First impression",
        summary: `${input.agentB.name} misreads the first compliment and answers with catastrophic confidence.`,
        visualCue: "A toppled coupe glass and a grin that is trying too hard.",
      },
      {
        label: "The turn",
        summary: "An accidental confession makes the conversation suddenly real.",
        visualCue: "Candlelight reflected in wide eyes and an untouched dessert.",
      },
      {
        label: "Connection",
        summary: "They discover a shared obsession and lose track of time explaining it to each other.",
        visualCue: "Leaning in across the table, hands almost touching.",
      },
      {
        label: "Complication",
        summary: "Both of them double down on the wrong interpretation and somehow make it charming.",
        visualCue: "Velvet sleeves, scattered petals, and one suspicious umbrella.",
      },
      {
        label: "Soft landing",
        summary: "They finally laugh at the same moment and the whole date turns unexpectedly tender.",
        visualCue: "Two linked silhouettes under a shared umbrella.",
      },
    ],
    ending: "They leave with soaked shoes, better timing, and a very obvious reason to meet again.",
    shareSummary: `${input.agentA.name} and ${input.agentB.name} survive an awkwardly romantic conservatory date.`,
  };
}

export function mockGenerateComicPage(input: ComicPromptInput): ComicResult {
  const panelColors = ["#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51", "#264653", "#6d6875"];
  const panelCount = input.beats.length;

  const panelRects = input.beats.map((beat, i) => {
    const isFirst = i === 0;
    const isLast = i === panelCount - 1;
    const color = panelColors[i % panelColors.length];

    if (isFirst) {
      return `<rect x="20" y="60" width="600" height="120" rx="6" fill="${color}"/>
        <text x="320" y="110" text-anchor="middle" fill="white" font-size="14" font-family="Georgia, serif">${beat.label}</text>
        <text x="320" y="130" text-anchor="middle" fill="white" font-size="11" font-family="Georgia, serif">${input.agentA.name} arrives</text>`;
    }

    if (isLast) {
      const y = 200 + Math.ceil((panelCount - 2) / 2) * 160;
      return `<rect x="20" y="${y}" width="600" height="120" rx="6" fill="${color}"/>
        <text x="320" y="${y + 50}" text-anchor="middle" fill="white" font-size="14" font-family="Georgia, serif">${beat.label}</text>
        <text x="320" y="${y + 70}" text-anchor="middle" fill="white" font-size="11" font-family="Georgia, serif">Finale</text>`;
    }

    const middleIndex = i - 1;
    const row = Math.floor(middleIndex / 2);
    const col = middleIndex % 2;
    const x = 20 + col * 310;
    const y = 200 + row * 160;

    return `<rect x="${x}" y="${y}" width="290" height="140" rx="6" fill="${color}"/>
      <text x="${x + 145}" y="${y + 60}" text-anchor="middle" fill="white" font-size="14" font-family="Georgia, serif">${beat.label}</text>
      <text x="${x + 145}" y="${y + 80}" text-anchor="middle" fill="white" font-size="10" font-family="Georgia, serif">${beat.summary.slice(0, 40)}</text>`;
  });

  const totalHeight = 60 + 120 + 20 + Math.ceil((panelCount - 2) / 2) * 160 + 120 + 40;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${totalHeight}" viewBox="0 0 640 ${totalHeight}" fill="none">
    <rect width="640" height="${totalHeight}" fill="#1a1328"/>
    <text x="320" y="35" text-anchor="middle" fill="#f0e6dc" font-size="18" font-family="Georgia, serif">${input.title}</text>
    ${panelRects.join("\n    ")}
  </svg>`;

  return {
    image: {
      base64: Buffer.from(svg, "utf8").toString("base64"),
      mediaType: "image/svg+xml",
    },
    prompt: `Mock comic page for ${input.agentA.name} and ${input.agentB.name}`,
    model: "mock-comic",
  };
}
