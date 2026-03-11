import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUniqueOrThrow, mockCreate, mockGenerateEpisode, mockCompleteComicGeneration } = vi.hoisted(() => ({
  mockFindUniqueOrThrow: vi.fn(),
  mockCreate: vi.fn(),
  mockGenerateEpisode: vi.fn(),
  mockCompleteComicGeneration: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    match: {
      findUniqueOrThrow: mockFindUniqueOrThrow,
    },
    episode: {
      create: mockCreate,
    },
  },
}));

vi.mock("@/lib/ai/generate-episode", () => ({
  generateEpisode: mockGenerateEpisode,
}));

vi.mock("@/app/api/episodes/[episodeId]/comic/route", () => ({
  completeComicGeneration: mockCompleteComicGeneration,
}));

vi.mock("@/lib/moderation/moderate-agent-input", () => ({
  moderateAgentInput: vi.fn().mockResolvedValue({ allowed: true }),
}));

import { generateEpisodeForMatch } from "./actions";

describe("generateEpisodeForMatch", () => {
  beforeEach(() => {
    mockFindUniqueOrThrow.mockReset();
    mockCreate.mockReset();
    mockGenerateEpisode.mockReset();
    mockCompleteComicGeneration.mockReset();
    mockCompleteComicGeneration.mockResolvedValue(undefined);
  });

  it("stores a structured episode with 6 beats and queues comic generation", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({
      id: "match_123",
      agentA: {
        name: "Lobster Poet",
        description: "Velvet blazer, dramatic sighs, writes sonnets at low tide.",
        vibeTags: ["dramatic", "romantic"],
        personalityTags: ["awkward", "earnest"],
        weirdHook: "Cries when hearing smooth jazz",
      },
      agentB: {
        name: "Ghost DJ",
        description: "A nightclub apparition with perfect posture and terrible timing.",
        vibeTags: ["chaotic"],
        personalityTags: ["deadpan"],
        weirdHook: "Only speaks in airhorn sounds",
      },
    });

    mockGenerateEpisode.mockResolvedValue({
      title: "A Rooftop Disaster in Two Parts",
      tone: "mixed",
      setting: "A rooftop greenhouse",
      beats: [
        { label: "Setup", summary: "They arrive overdressed.", visualCue: "Moonlight on glass." },
        { label: "Spark", summary: "The florist tray tips.", visualCue: "Falling petals." },
        { label: "Spiral", summary: "The joke lands badly.", visualCue: "A crooked candle." },
        { label: "Confession", summary: "An accidental truth slips out.", visualCue: "Wide eyes." },
        { label: "Recovery", summary: "They lean into the awkwardness.", visualCue: "Shared laughter." },
        { label: "Pivot", summary: "They both start laughing.", visualCue: "Linked umbrellas." },
      ],
      ending: "They leave soaked but charmed.",
      shareSummary: "Lobster Poet and Ghost DJ survived a rooftop greenhouse date.",
    });

    mockCreate.mockResolvedValue({
      id: "episode_123",
      beats: [{}, {}, {}, {}, {}, {}],
      shareSummary: "summary",
    });

    const episode = await generateEpisodeForMatch("match_123");

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        matchId: "match_123",
        title: "A Rooftop Disaster in Two Parts",
        tone: "mixed",
        status: "ready",
        comicStatus: "pending",
      }),
    });
    expect(episode.beats.length).toBeGreaterThanOrEqual(6);
    expect(episode.beats.length).toBeLessThanOrEqual(8);
    expect(episode.shareSummary.length).toBeGreaterThan(0);
    expect(mockCompleteComicGeneration).toHaveBeenCalledWith("episode_123");
  });
});
