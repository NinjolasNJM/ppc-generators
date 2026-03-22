import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("example generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/example");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);

    await expect(outputPage).toHaveScreenshot(
      "example-default-page-" + (index + 1) + ".png"
    );
  }
});

test("example generator matches the folds-off screenshot", async ({ page }) => {
  await page.goto("/generator/example");

  const output = page.getByTestId("generator-page-image");
  const showFolds = page.getByText("Show Folds");

  await expect(output).toBeVisible();
  await expect(output).toHaveAttribute("src", /data:image\/png/);
  await showFolds.click();
  await expect(output).toBeVisible();
  await renderImageAtNaturalSize(output);

  await expect(output).toHaveScreenshot("example-default-folds-off.png");
});
