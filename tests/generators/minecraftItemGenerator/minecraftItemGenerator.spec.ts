import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("minecraft item generator matches the default screenshots", async ({ page }) => {
  await page.goto("/generator/minecraft-item");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);

    await expect(outputPage).toHaveScreenshot(
      "minecraft-item-default-page-" + (index + 1) + ".png"
    );
  }
});

test("minecraft item generator renders custom atlas textures", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-item");

  const sheetPath = path.join(
    process.cwd(),
    "src/generators/testing/images/testSheet.png"
  );
  const sheetBytes = fs.readFileSync(sheetPath);

  await page.getByLabel("Version").selectOption("custom");
  await page
    .getByLabel("Select one or more custom texture files")
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

  await expect(page.getByTitle("atlas-a")).toBeVisible();
  await expect(page.getByTitle("atlas-b")).toBeVisible();

  await page.getByTitle("atlas-a").click();
  await page.getByLabel("Add Item").click();

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  const outputPage = outputPages.nth(0);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot(
    "minecraft-item-custom-atlas-page-1.png"
  );
});

test("minecraft item generator supports custom item scales", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-item");

  const tiles = page.locator("button[title]");
  await tiles.nth(1).click();

  const sizeOptions = [
    "Small (200%)",
    "Medium (400%)",
    "Large (700%)",
    "Extra Large (1400%)",
    "Custom",
  ] as const;

  for (const sizeOption of sizeOptions) {
    await page.getByLabel("Item Size").selectOption(sizeOption);

    if (sizeOption === "Custom") {
      const customScale = page.getByLabel("Custom Scale (%)");
      await expect(customScale).toHaveAttribute("min", "100");
      await expect(customScale).toHaveAttribute("max", "1600");
      await expect(customScale).toHaveAttribute("step", "100");
      await customScale.press("ArrowRight");
    }

    await page.getByLabel("Add Item").click();
  }

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  const outputPage = outputPages.nth(0);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot(
    "minecraft-item-custom-scale-page-1.png"
  );
});

test("minecraft item generator clears the selected texture when switching to custom", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-item");

  const tiles = page.locator("button[title]");
  await tiles.nth(1).click();

  await expect(page.getByTestId("texture-picker-preview")).toBeVisible();

  await page.getByLabel("Version").selectOption("custom");

  await expect(page.getByTestId("texture-picker-preview")).toHaveCount(0);

  await page.getByLabel("Add Item").click();

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  const outputPage = outputPages.nth(0);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot(
    "minecraft-item-default-page-1.png"
  );
});

test("minecraft item generator clears the custom selection when the version changes", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-item");

  const sheetPath = path.join(
    process.cwd(),
    "src/generators/testing/images/testSheet.png"
  );
  const sheetBytes = fs.readFileSync(sheetPath);

  await page.getByLabel("Version").selectOption("custom");
  await page
    .getByLabel("Select one or more custom texture files")
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

  await page.getByTitle("atlas-a").click();
  await page.getByLabel("Version").selectOption("minecraft-1.7.10-items");
  await page.getByLabel("Add Item").click();

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  const outputPage = outputPages.nth(0);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot(
    "minecraft-item-version-switch-clears-custom-selection-page-1.png"
  );
});
