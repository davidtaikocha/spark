import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUniqueOrThrow, mockCreate, mockGenerateEpisode } = vi.hoisted(() => ({
  mockFindUniqueOrThrow: vi.fn(),
  mockCreate: vi.fn(),
  mockGenerateEpisode: vi.fn(),
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

import { generateEpisodeForMatch } from "./actions";

describe("generateEpisodeForMatch", () => {
  beforeEach(() => {
    mockFindUniqueOrThrow.mockReset();
    mockCreate.mockReset();
    mockGenerateEpisode.mockReset();
  });

  it("stores a structured episode with 4-6 beats and a share summary", async () => {
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
        { label: "Pivot", summary: "They both start laughing.", visualCue: "Linked umbrellas." },
      ],
      ending: "They leave soaked but charmed.",
      shareSummary: "Lobster Poet and Ghost DJ survived a rooftop greenhouse date.",
    });

    mockCreate.mockResolvedValue({
      id: "episode_123",
      beats: [{}, {}, {}, {}],
      shareSummary: "summary",
    });

    const episode = await generateEpisodeForMatch("match_123");

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        matchId: "match_123",
        title: "A Rooftop Disaster in Two Parts",
        tone: "mixed",
        status: "ready",
      }),
    });
    expect(episode.beats.length).toBeGreaterThanOrEqual(4);
    expect(episode.beats.length).toBeLessThanOrEqual(6);
    expect(episode.shareSummary.length).toBeGreaterThan(0);
  });
});
