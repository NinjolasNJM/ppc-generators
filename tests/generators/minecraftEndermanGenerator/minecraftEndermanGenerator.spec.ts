import { expect, test } from "@playwright/test";

test("minecraft enderman generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/minecraft-enderman");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await expect(outputPage).toHaveScreenshot(
      "minecraft-enderman-default-page-" + (index + 1) + ".png"
    );
  }
});
