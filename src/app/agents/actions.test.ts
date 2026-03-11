import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockNormalizeAgent, mockCreate } = vi.hoisted(() => ({
  mockNormalizeAgent: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/ai/normalize-agent", () => ({
  normalizeAgent: mockNormalizeAgent,
}));

vi.mock("@/lib/db", () => ({
  db: {
    agent: {
      create: mockCreate,
    },
  },
}));

import { createAgent } from "./actions";

describe("createAgent", () => {
  beforeEach(() => {
    mockNormalizeAgent.mockReset();
    mockCreate.mockReset();
  });

  it("normalizes the input and stores an agent before portrait completion", async () => {
    mockNormalizeAgent.mockResolvedValue({
      name: "Lobster Poet",
      description: "Velvet blazer, dramatic sighs, writes sonnets at low tide.",
      vibeTags: ["dramatic", "romantic"],
      personalityTags: ["awkward"],
      weirdHook: "Cries when hearing smooth jazz",
      portraitPrompt: "Cute illustrated lobster poet in a velvet blazer.",
    });

    mockCreate.mockResolvedValue({
      id: "agent_123",
      name: "Lobster Poet",
      portraitStatus: "pending",
    });

    const result = await createAgent({
      name: "Lobster Poet",
      description: "Velvet blazer, dramatic sighs, writes sonnets at low tide.",
      vibeTags: ["dramatic", "romantic"],
      personalityTags: ["awkward"],
      weirdHook: "Cries when hearing smooth jazz",
    });

    expect(mockNormalizeAgent).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Lobster Poet",
        sourceType: "user",
        visibility: "public",
        portraitStatus: "pending",
      }),
    });
    expect(result.agent.name).toBe("Lobster Poet");
    expect(result.agent.portraitStatus).toBe("pending");
  });
});
