import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("minecraft horse generator exposes the horse texture selector by label", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-horse");

  await expect(page.getByLabel("Horse", { exact: true })).toBeVisible();
});

test("minecraft horse generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/minecraft-horse");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);
    await expect(outputPage).toHaveScreenshot(
      "minecraft-horse-default-page-" + (index + 1) + ".png"
    );
  }
});
