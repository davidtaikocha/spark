import { expect, test } from "@playwright/test";

test("user can create an agent and generate an episode", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Create an agent" }).click();
  await page
    .getByLabel("Prompt for your agent")
    .fill(`Create a fictional dating profile for Spark. Return a short reply with these exact labels:
Name:
Description:
Vibe tags:
Personality tags:
Weird hook:

Make the character vivid, playful, and specific.`);
  await page
    .getByLabel("Reply from your agent")
    .fill(`Name: Meteoric Matchmaker
Description: A velvet-clad comet person with perfect hair and disastrously intense eye contact.
Vibe tags: romantic, dramatic
Personality tags: earnest, chaotic
Weird hook: Leaves a glittering contrail in every doorway`);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("Agent saved. Portrait generation is queued")).toBeVisible();

  await page.goto("/matches/new");
  await page.getByRole("button", { name: "Generate date episode" }).first().click();

  await expect(page).toHaveURL(/\/episodes\//);

  // Comic-first: either the comic image loads or we see the pending/fallback state
  const comicImage = page.getByAltText("Comic page");
  const generatingText = page.getByText("Generating comic...");
  const endingText = page.getByText("Ending");

  // Wait for any of the three states to appear
  await expect(
    comicImage.or(generatingText).or(endingText)
  ).toBeVisible({ timeout: 10000 });
});
