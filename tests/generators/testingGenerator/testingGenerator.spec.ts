import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("testing generator matches the visual regression board", async ({
  page,
}) => {
  await page.goto("/generator/testing");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(4);

  // Page 1: reference sheet.
  // Page 2: common render cases grouped together.
  // Page 3: full rotation/flip matrix.
  // Page 4: same-destination density comparison.
  for (let index = 0; index < 4; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);

    await expect(outputPage).toHaveScreenshot(
      "testing-board-page-" + (index + 1) + ".png"
    );
  }
});

test("testing generator renders uploaded atlas textures", async ({ page }) => {
  await page.goto("/generator/testing");

  const sheetPath = path.join(
    process.cwd(),
    "src/generators/testing/images/testSheet.png"
  );
  const sheetBytes = fs.readFileSync(sheetPath);

  await page
    .getByLabel("Select one or more Textures texture files")
    .setInputFiles([
      {
        name: "atlas-a.png",
        mimeType: "image/png",
        buffer: sheetBytes,
      },
      {
        name: "atlas-b.png",
        mimeType: "image/png",
        buffer: sheetBytes,
      },
    ]);

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(5);

  const outputPage = outputPages.nth(4);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot("testing-board-atlas-page-5.png");
});
