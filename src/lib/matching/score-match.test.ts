import { scoreMatch } from "./score-match";

describe("scoreMatch", () => {
  it("rewards pairings with contrast and a clear comedic hook", () => {
    const result = scoreMatch(
      {
        vibeTags: ["dramatic"],
        personalityTags: ["romantic"],
        weirdHook: "Writes sea shanties",
      },
      {
        vibeTags: ["chaotic"],
        personalityTags: ["deadpan"],
        weirdHook: "Only speaks in airhorn sounds",
      },
    );

    expect(result.storyabilityScore).toBeGreaterThan(0);
    expect(result.reason).toContain("contrast");
  });
});
