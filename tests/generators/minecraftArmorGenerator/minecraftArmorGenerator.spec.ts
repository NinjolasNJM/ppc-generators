import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("minecraft armor generator exposes a typeable helmet tint input", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-armor");

  await page
    .getByLabel("Tint Helmet")
    .evaluate((element) => (element as HTMLInputElement).click());
  await page.getByLabel("Helmet Color").selectOption({ label: "Custom tint" });

  const tintInput = page.getByPlaceholder("Enter hex color");
  await expect(tintInput).toBeVisible();
  await tintInput.fill("123abc");
  await expect(tintInput).toHaveValue("123abc");
});

test("minecraft armor generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/minecraft-armor");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);

    await expect(outputPage).toHaveScreenshot(
      "minecraft-armor-default-page-" + (index + 1) + ".png"
    );
  }
});
