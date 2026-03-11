import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockNormalizeAgent, mockInterpretAgentReply, mockCreate, mockCompletePortrait } = vi.hoisted(() => ({
  mockNormalizeAgent: vi.fn(),
  mockInterpretAgentReply: vi.fn(),
  mockCreate: vi.fn(),
  mockCompletePortrait: vi.fn(),
}));

vi.mock("@/lib/ai/normalize-agent", () => ({
  normalizeAgent: mockNormalizeAgent,
}));

vi.mock("@/lib/ai/interpret-agent-reply", () => ({
  interpretAgentReply: mockInterpretAgentReply,
}));

vi.mock("@/lib/db", () => ({
  db: {
    agent: {
      create: mockCreate,
    },
  },
}));

vi.mock("@/app/api/agents/[agentId]/portrait/route", () => ({
  completePortraitGeneration: mockCompletePortrait,
}));

import { createAgent, prepareAgentDraft } from "./actions";

describe("agent actions", () => {
  beforeEach(() => {
    mockNormalizeAgent.mockReset();
    mockInterpretAgentReply.mockReset();
    mockCreate.mockReset();
    mockCompletePortrait.mockReset();
    mockCompletePortrait.mockResolvedValue(null);
  });

  it("normalizes the input, stores an agent, and generates a portrait", async () => {
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

    const agent = "agent" in result ? result.agent : undefined;

    expect(agent).toBeDefined();

    if (!agent) {
      throw new Error("Expected agent creation to succeed");
    }

    expect(agent.name).toBe("Lobster Poet");
    expect(agent.portraitStatus).toBe("pending");
  });

  it("returns a structured draft without interpretation when the reply follows the template", async () => {
    const result = await prepareAgentDraft(`
Name: Agent Lobster
Description: A lacquer-red lobster in a velvet dinner jacket who believes every hallway is an entrance.
Vibe tags: romantic, theatrical, strange
Personality tags: confident, needy, poetic
Weird hook: Keeps a waterproof notebook ranking every crush by emotional tidal impact.
    `);

    expect(mockInterpretAgentReply).not.toHaveBeenCalled();
    expect(result).toEqual({
      draft: {
        name: "Agent Lobster",
        description:
          "A lacquer-red lobster in a velvet dinner jacket who believes every hallway is an entrance.",
        vibeTags: ["romantic", "theatrical", "strange"],
        personalityTags: ["confident", "needy", "poetic"],
        weirdHook:
          "Keeps a waterproof notebook ranking every crush by emotional tidal impact.",
      },
      missingFields: [],
      mode: "structured",
    });
  });

  it("merges interpreted fields when the pasted reply is manually rewritten", async () => {
    mockInterpretAgentReply.mockResolvedValue({
      name: "Comet Sweetheart",
      description:
        "A velvet-tailed comet person with impossible hair and an appetite for disastrous romance.",
      vibeTags: ["romantic", "electric"],
      personalityTags: ["earnest", "chaotic"],
      weirdHook: "Leaves a glitter contrail in every doorway",
    });

    const result = await prepareAgentDraft(`
Comet Sweetheart drifts into rooms like the room was waiting.
They are gorgeous, doomed, and weirdly sincere.
Weird hook: Leaves a glitter contrail in every doorway.
    `);

    expect(mockInterpretAgentReply).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      draft: {
        name: "Comet Sweetheart",
        description:
          "A velvet-tailed comet person with impossible hair and an appetite for disastrous romance.",
        vibeTags: ["romantic", "electric"],
        personalityTags: ["earnest", "chaotic"],
        weirdHook: "Leaves a glitter contrail in every doorway.",
      },
      missingFields: [],
      mode: "mixed",
    });
  });
});
