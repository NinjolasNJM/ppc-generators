import { expect, test } from "@playwright/test";

test("minecraft horse generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/minecraft-horse");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await expect(outputPage).toHaveScreenshot(
      "minecraft-horse-default-page-" + (index + 1) + ".png"
    );
  }
});

test("minecraft horse generator matches the white horse screenshot", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-horse");

  const output = page.getByTestId("generator-page-image");
  const horseSelect = page
    .getByText("Horse", { exact: true })
    .locator("xpath=following::select[1]");

  await expect(output).toBeVisible();
  await expect(output).toHaveAttribute("src", /data:image\/png/);
  await expect(horseSelect).toBeVisible();

  await horseSelect.selectOption({ label: "White Horse" });

  await expect(output).toBeVisible();
  await expect(output).toHaveScreenshot("minecraft-horse-white-page-1.png");
});
