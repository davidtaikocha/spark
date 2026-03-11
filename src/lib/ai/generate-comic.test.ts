import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.AI_MOCK_MODE = "1";
});

import { generateComicPage } from "./generate-comic";

describe("generateComicPage", () => {
  it("returns a comic result with base64 image in mock mode", async () => {
    const portraits = {
      agentA: Buffer.from("fake-png-a"),
      agentB: Buffer.from("fake-png-b"),
    };

    const result = await generateComicPage(
      {
        title: "A Rooftop Disaster",
        setting: "A rooftop greenhouse",
        agentA: { name: "Lobster Poet" },
        agentB: { name: "Ghost DJ" },
        beats: [
          { label: "Arrival", summary: "They arrive overdressed.", visualCue: "Rain on glass." },
          { label: "Spark", summary: "A tray tips.", visualCue: "Petals." },
          { label: "Turn", summary: "Joke lands badly.", visualCue: "Candle." },
          { label: "Connect", summary: "A confession.", visualCue: "Eyes." },
          { label: "Escalate", summary: "Double down.", visualCue: "Laughter." },
          { label: "Finale", summary: "They laugh.", visualCue: "Umbrellas." },
        ],
      },
      portraits,
    );

    expect(result.image.base64.length).toBeGreaterThan(0);
    expect(result.image.mediaType).toBe("image/svg+xml");
    expect(result.model).toBe("mock-comic");
    expect(result.prompt).toContain("Lobster Poet");
  });
});
