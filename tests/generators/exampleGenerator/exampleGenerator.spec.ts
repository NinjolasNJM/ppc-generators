import { expect, test } from "@playwright/test";

test("example generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/example");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
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
  const beforeSrc = await output.getAttribute("src");
  await showFolds.click();
  await expect.poll(async () => output.getAttribute("src")).not.toBe(beforeSrc);
  await expect(output).toBeVisible();
  await expect(output).toHaveScreenshot("example-default-folds-off.png");
});
