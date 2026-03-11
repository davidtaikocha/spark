import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUniqueOrThrow, mockUpdate, mockGeneratePortrait } = vi.hoisted(() => ({
  mockFindUniqueOrThrow: vi.fn(),
  mockUpdate: vi.fn(),
  mockGeneratePortrait: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    agent: {
      findUniqueOrThrow: mockFindUniqueOrThrow,
      update: mockUpdate,
    },
  },
}));

vi.mock("@/lib/ai/generate-portrait", () => ({
  generatePortrait: mockGeneratePortrait,
}));

import { POST } from "./route";

describe("POST /api/agents/[agentId]/portrait", () => {
  beforeEach(() => {
    mockFindUniqueOrThrow.mockReset();
    mockUpdate.mockReset();
    mockGeneratePortrait.mockReset();
  });

  it("updates the portrait url and prompt on success", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({
      id: "a1",
      name: "Lobster Poet",
      description: "Velvet blazer, dramatic sighs, writes sonnets at low tide.",
      vibeTags: ["dramatic", "romantic"],
      personalityTags: ["awkward"],
      weirdHook: "Cries when hearing smooth jazz",
    });

    mockGeneratePortrait.mockResolvedValue({
      image: {
        base64: "abc123",
        mediaType: "image/png",
      },
      prompt: "Cute illustrated lobster poet portrait.",
      model: "gpt-image-1",
    });

    mockUpdate.mockResolvedValue({
      id: "a1",
      portraitStatus: "ready",
    });

    const response = await POST(new Request("http://localhost/api/agents/a1/portrait"), {
      params: Promise.resolve({ agentId: "a1" }),
    });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: expect.objectContaining({
        portraitPrompt: "Cute illustrated lobster poet portrait.",
        portraitStatus: "ready",
        portraitUrl: "data:image/png;base64,abc123",
      }),
    });
  });
});
