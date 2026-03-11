import { buildEpisodePrompt } from "./prompts";

describe("buildEpisodePrompt", () => {
  it("includes both agents, tone guidance, and structured beat instructions", () => {
    const prompt = buildEpisodePrompt({
      agentA: { name: "Lobster Poet" },
      agentB: { name: "Ghost DJ" },
      tone: "mixed",
    });

    expect(prompt).toContain("Lobster Poet");
    expect(prompt).toContain("Ghost DJ");
    expect(prompt).toContain("mixed");
    expect(prompt).toContain("4-6 beats");
  });
});
