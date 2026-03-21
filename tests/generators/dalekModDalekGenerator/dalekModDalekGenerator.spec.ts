import { expect, test } from "@playwright/test";

test("dalek generator matches the default screenshots", async ({ page }) => {
  await page.goto("/generator/dalek");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(2);

  for (let index = 0; index < 2; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await expect(outputPage).toHaveScreenshot(
      "dalek-default-page-" + (index + 1) + ".png"
    );
  }
});
