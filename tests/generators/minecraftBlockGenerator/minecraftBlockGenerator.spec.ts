import { expect, test } from "@playwright/test";
import { renderImageAtNaturalSize } from "../_shared/screenshot";

test("minecraft block generator matches the default screenshot", async ({ page }) => {
  await page.goto("/generator/minecraft-block");

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  for (let index = 0; index < 1; index += 1) {
    const outputPage = outputPages.nth(index);

    await expect(outputPage).toBeVisible();
    await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
    await renderImageAtNaturalSize(outputPage);

    await expect(outputPage).toHaveScreenshot(
      "minecraft-block-default-page-" + (index + 1) + ".png"
    );
  }
});

test("minecraft block generator matches the rotated and flipped screenshot", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-block");

  await page.getByPlaceholder("Search...").fill("lever");
  await page.getByTitle("lever").click();
  await page.getByLabel("Rotate texture").click();
  await page.getByLabel("Flip texture vertical").click();
  await page.getByTestId("region-BlockFaceTop1").click();

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  const outputPage = outputPages.nth(0);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot(
    "minecraft-block-rotated-and-flipped-page-1.png"
  );
});

test("minecraft block generator matches the rotated and horizontally flipped screenshot", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-block");

  await page.getByPlaceholder("Search...").fill("observer");
  await page.getByTitle("observer front").click();
  await page.getByLabel("Rotate texture").click();
  await page.getByLabel("Flip texture horizontal").click();
  await page.getByTestId("region-BlockFaceTop1").click();

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  const outputPage = outputPages.nth(0);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot(
    "minecraft-block-rotated-and-horizontal-flipped-page-1.png"
  );
});

test("minecraft block generator shows the selected tint in the preview", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-block");

  await page.getByPlaceholder("Search...").fill("lever");
  await page.getByTitle("lever").click();
  await page.getByLabel("Tint").selectOption({ label: "Plains" });

  const preview = page.getByTestId("texture-picker-preview");
  await expect(preview).toBeVisible();

  await expect(preview).toHaveScreenshot("minecraft-block-tinted-preview.png");
});

test("minecraft block generator shows the before and after tinting on the page", async ({
  page,
}) => {
  await page.goto("/generator/minecraft-block");

  await page.getByPlaceholder("Search...").fill("grass_block_top");
  await page.getByTitle("grass block top").click();
  await page.getByTestId("region-BlockFaceTop1").click();

  await page.getByLabel("Tint").selectOption({ label: "Plains" });
  await page.getByTestId("region-BlockFaceFront1").click();

  const outputPages = page.getByTestId("generator-page-image");
  await expect(outputPages).toHaveCount(1);

  const outputPage = outputPages.nth(0);
  await expect(outputPage).toBeVisible();
  await expect(outputPage).toHaveAttribute("src", /data:image\/png/);
  await renderImageAtNaturalSize(outputPage);

  await expect(outputPage).toHaveScreenshot(
    "minecraft-block-tinted-before-and-after-page-1.png"
  );
});
