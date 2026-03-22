import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("minecraft pig character generator matches the default screenshots", async ({ page }) => {
  await page.goto("/generator/minecraft-pig-character");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);

    await expect(outputPage).toHaveScreenshot(
      "minecraft-pig-character-default-page-" + (index + 1) + ".png"
    );
  }
});
