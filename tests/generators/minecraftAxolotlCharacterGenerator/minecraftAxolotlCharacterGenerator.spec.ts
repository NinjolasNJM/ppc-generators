import { expect, test } from "@playwright/test";

test("minecraft axolotl character generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/minecraft-axolotl-character");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await expect(outputPage).toHaveScreenshot(
      "minecraft-axolotl-character-default-page-" + (index + 1) + ".png"
    );
  }
});
