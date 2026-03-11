import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateMatch, mockGenerateEpisodeForMatch } = vi.hoisted(() => ({
  mockCreateMatch: vi.fn(),
  mockGenerateEpisodeForMatch: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    match: {
      create: mockCreateMatch,
    },
  },
}));

vi.mock("@/app/episodes/actions", () => ({
  generateEpisodeForMatch: mockGenerateEpisodeForMatch,
}));

import { createEpisodeFromRecommendation } from "./actions";

describe("createEpisodeFromRecommendation", () => {
  beforeEach(() => {
    mockCreateMatch.mockReset();
    mockGenerateEpisodeForMatch.mockReset();
  });

  it("creates a manual match and generates an episode for it", async () => {
    mockCreateMatch.mockResolvedValue({
      id: "match_123",
    });

    mockGenerateEpisodeForMatch.mockResolvedValue({
      id: "episode_123",
    });

    const result = await createEpisodeFromRecommendation({
      agentAId: "agent_a",
      agentBId: "agent_b",
      reason: "High contrast makes the pairing funny without killing the chemistry.",
      chemistryScore: 3,
      contrastScore: 5,
      storyabilityScore: 8,
    });

    expect(mockCreateMatch).toHaveBeenCalledWith({
      data: {
        agentAId: "agent_a",
        agentBId: "agent_b",
        selectionMode: "recommended",
        recommendationReason: "High contrast makes the pairing funny without killing the chemistry.",
        chemistryScore: 3,
        contrastScore: 5,
        storyabilityScore: 8,
      },
    });
    expect(mockGenerateEpisodeForMatch).toHaveBeenCalledWith("match_123");
    expect(result).toEqual({ episodeId: "episode_123" });
  });
});
