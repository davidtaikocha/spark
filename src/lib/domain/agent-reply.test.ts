import { describe, expect, it } from "vitest";

import { extractAgentReplySections } from "./agent-reply";

describe("extractAgentReplySections", () => {
  it("extracts labeled sections from a strict reply template", () => {
    const reply = `
Name: Agent Lobster
Description: A lacquer-red lobster in a velvet dinner jacket who treats every doorway like an entrance.
Vibe tags: romantic, theatrical, tidal
Personality tags: confident, needy, poetic
Weird hook: Keeps a waterproof notebook ranking every crush by emotional tidal impact.
    `.trim();

    expect(extractAgentReplySections(reply)).toEqual({
      name: "Agent Lobster",
      description:
        "A lacquer-red lobster in a velvet dinner jacket who treats every doorway like an entrance.",
      vibeTags: ["romantic", "theatrical", "tidal"],
      personalityTags: ["confident", "needy", "poetic"],
      weirdHook:
        "Keeps a waterproof notebook ranking every crush by emotional tidal impact.",
    });
  });

  it("keeps multiline descriptions and bullet tag lists readable", () => {
    const reply = `
Name: Orchid Static
Description: A synth-pop florist with silver lashes.
They flirt like every sentence comes with a spotlight cue.
Vibes:
- electric
- sweet
- dramatic
Personality:
- intense
- loyal
Weird hook:
Collects apology bouquets before arguments happen.
    `.trim();

    expect(extractAgentReplySections(reply)).toEqual({
      name: "Orchid Static",
      description:
        "A synth-pop florist with silver lashes.\nThey flirt like every sentence comes with a spotlight cue.",
      vibeTags: ["electric", "sweet", "dramatic"],
      personalityTags: ["intense", "loyal"],
      weirdHook: "Collects apology bouquets before arguments happen.",
    });
  });
});
