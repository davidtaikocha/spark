import { agentInputSchema } from "./agent";

describe("agentInputSchema", () => {
  it("requires a name, description, and at least one tag", () => {
    const result = agentInputSchema.safeParse({
      name: "Lobster Poet",
      description: "A melancholy lobster in a velvet blazer.",
      vibeTags: ["dramatic"],
      personalityTags: ["awkward"],
    });

    expect(result.success).toBe(true);
  });
});
