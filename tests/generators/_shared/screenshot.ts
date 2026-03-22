import type { Locator } from "@playwright/test";

export async function renderImageAtNaturalSize(image: Locator) {
  const naturalSize = await image.evaluate((img: HTMLImageElement) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
  }));

  await image.evaluate(
    (
      img: HTMLImageElement,
      size: { naturalWidth: number; naturalHeight: number }
    ) => {
      img.style.width = `${size.naturalWidth}px`;
      img.style.height = `${size.naturalHeight}px`;
      img.style.maxWidth = "none";
    },
    naturalSize
  );
}
