import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    episode: {
      findMany: mockFindMany,
    },
  },
}));

import { listFeedEpisodes } from "./feed";

describe("listFeedEpisodes", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("returns the newest ready episodes for public display", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "episode_2",
        status: "ready",
      },
      {
        id: "episode_1",
        status: "ready",
      },
    ]);

    const episodes = await listFeedEpisodes();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: "ready" },
      select: {
        id: true,
        matchId: true,
        title: true,
        tone: true,
        setting: true,
        beats: true,
        ending: true,
        shareSummary: true,
        status: true,
        comicStatus: true,
        comicUrl: true,
        createdAt: true,
        updatedAt: true,
        match: {
          include: {
            agentA: true,
            agentB: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    expect(Array.isArray(episodes)).toBe(true);
    expect(episodes).toHaveLength(2);
  });
});
