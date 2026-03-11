import { describe, expect, it } from "vitest";

import { moderateAgentInput } from "./moderate-agent-input";

describe("moderateAgentInput", () => {
  it("rejects real-person dating simulation prompts", async () => {
    const result = await moderateAgentInput({
      name: "Celebrity Clone",
      description: "Exactly looks like a famous actor and wants to date fans all night.",
    });

    expect(result.allowed).toBe(false);
  });
});
