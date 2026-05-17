export type AtlasFrame = {
  id: string;
  name: string;
  rectangle: [number, number, number, number];
  frameIndex: number;
  frameCount: number;
};

export type Atlas = {
  atlasWidth: number;
  atlasHeight: number;
  frames: AtlasFrame[];
};

export type AtlasImage = {
  name: string;
  width: number;
  height: number;
};

export function packAtlasImages(
  images: AtlasImage[],
  standardWidth: number,
  standardHeight: number
): Atlas {
  if (images.length === 0) {
    throw new Error("No images to pack into atlas");
  }

  const widestImage = images.reduce((max, image) => Math.max(max, image.width), 0);
  const atlasWidth = Math.max(
    standardWidth,
    standardHeight,
    widestImage,
    Math.min(2048, Math.ceil(Math.sqrt(images.length)) * standardWidth)
  );

  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let atlasHeight = 0;
  const frames: AtlasFrame[] = [];
  const frameNameCounts = new Map<string, number>();

  for (const image of images) {
    if (x + image.width > atlasWidth) {
      x = 0;
      y += rowHeight;
      atlasHeight += rowHeight;
      rowHeight = 0;
    }

    const currentCount = frameNameCounts.get(image.name) ?? 0;
    const frameId = currentCount === 0 ? image.name : `${image.name}_${currentCount}`;
    frameNameCounts.set(image.name, currentCount + 1);

    frames.push({
      id: frameId,
      name: image.name,
      rectangle: [x, y, image.width, image.height],
      frameIndex: 0,
      frameCount: 1,
    });

    x += image.width;
    rowHeight = Math.max(rowHeight, image.height);
  }

  atlasHeight += rowHeight;

  return {
    atlasWidth,
    atlasHeight,
    frames,
  };
}
