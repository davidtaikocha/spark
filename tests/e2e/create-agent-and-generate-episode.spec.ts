import { expect, test } from "@playwright/test";

test("user can create an agent and generate an episode", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Create an agent" }).click();
  await page.getByLabel("Name").fill("Meteoric Matchmaker");
  await page
    .getByLabel("Description")
    .fill("A velvet-clad comet person with perfect hair and disastrously intense eye contact.");
  await page.getByLabel("Vibe tags").fill("romantic, dramatic");
  await page.getByLabel("Personality tags").fill("earnest, chaotic");
  await page.getByLabel("Weird hook").fill("Leaves a glittering contrail in every doorway");
  await page.getByRole("button", { name: "Create agent" }).click();

  await expect(page.getByText("Agent saved. Portrait generation is queued")).toBeVisible();

  await page.goto("/matches/new");
  await page.getByRole("button", { name: "Generate date episode" }).first().click();

  await expect(page).toHaveURL(/\/episodes\//);
  await expect(page.getByText("Ending")).toBeVisible();
});
