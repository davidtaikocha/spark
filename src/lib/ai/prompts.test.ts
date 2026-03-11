import { buildComicPrompt, buildEpisodePrompt } from "./prompts";

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
    expect(prompt).toContain("6 beats");
  });
});

describe("buildComicPrompt", () => {
  it("includes agent names, setting, beat summaries, and panel layout", () => {
    const prompt = buildComicPrompt({
      title: "Rooftop Disaster",
      setting: "A rooftop greenhouse",
      agentA: { name: "Lobster Poet" },
      agentB: { name: "Ghost DJ" },
      beats: [
        { label: "Arrival", summary: "They arrive overdressed.", visualCue: "Rain on glass." },
        { label: "Spark", summary: "A tray tips.", visualCue: "Petals falling." },
        { label: "Turn", summary: "Joke lands badly.", visualCue: "Crooked candle." },
        { label: "Connect", summary: "A confession.", visualCue: "Wide eyes." },
        { label: "Escalate", summary: "Double down.", visualCue: "Laughter." },
        { label: "Finale", summary: "They laugh together.", visualCue: "Linked umbrellas." },
      ],
    });

    expect(prompt).toContain("Lobster Poet");
    expect(prompt).toContain("Ghost DJ");
    expect(prompt).toContain("A rooftop greenhouse");
    expect(prompt).toContain("Rooftop Disaster");
    expect(prompt).toContain("comic book");
    expect(prompt).toContain("wide — opening");
    expect(prompt).toContain("wide — finale");
    expect(prompt).toContain("They arrive overdressed.");
    expect(prompt).toContain("They laugh together.");
  });
});
