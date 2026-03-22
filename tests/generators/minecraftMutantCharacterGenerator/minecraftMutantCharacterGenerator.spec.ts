import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("minecraft mutant character generator matches the default screenshots", async ({ page }) => {
  await page.goto("/generator/minecraft-mutant-character");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(4);

  for (let index = 0; index < 4; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);

    await expect(outputPage).toHaveScreenshot(
      "minecraft-mutant-character-default-page-" + (index + 1) + ".png"
    );
  }
});
