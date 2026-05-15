import { type TextureDef } from "./generatorDef";

// These "TextureData" types are the shapes of the generated texture data.

export type Rectangle = [number, number, number, number];

export type TextureData_TileFrame =
  | Rectangle
  | {
      x: number;
      y: number;
      width: number;
      height: number;
    };

export type TextureData_Tile = {
  name: string;
  frames: TextureData_TileFrame[];
};

export type TextureData = {
  textureDef: TextureDef;
  tiles: TextureData_Tile[];
};

export type TextureFrame = {
  id: string;
  label: string;
  rectangle: Rectangle;
};

export type Atlas = {
  atlasWidth: number;
  atlasHeight: number;
  frames: TextureFrame[];
};

function tileToTextureFrames(
  tile: TextureData_Tile,
  frameSize: number // We assume a square frame
): TextureFrame[] {
  const frameCount = tile.frames.length;
  const frames: TextureFrame[] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const [x, y, width, height] = tileFrameToRectangle(
      tile.frames[frameIndex]!
    );

    if (width % frameSize !== 0 || height % frameSize !== 0) {
      return [];
    }

    const id =
      frameCount > 1 ? tile.name + "_" + String(frameIndex) : tile.name;
    const frame: TextureFrame = {
      id,
      label: makeTextureFrameLabel(tile.name, frameIndex, frameCount),
      rectangle: [x, y, width, height],
    };
    frames.push(frame);
  }

  return frames;
}

function tileFrameToRectangle(frame: TextureData_TileFrame): Rectangle {
  return Array.isArray(frame)
    ? frame
    : [frame.x, frame.y, frame.width, frame.height];
}

export function tilesToTextureFrames(
  tiles: TextureData_Tile[],
  frameSize: number
): TextureFrame[] {
  return sortTextureDataTiles(tiles, frameSize).flatMap((tile) =>
    tileToTextureFrames(tile, frameSize)
  );
}

export function sortTextureDataTiles(
  tiles: TextureData_Tile[],
  frameSize: number
): TextureData_Tile[] {
  return tiles
    .map((tile, index) => ({ tile, index }))
    .sort((a, b) => {
      const categoryA = textureDataTileCategory(a.tile, frameSize);
      const categoryB = textureDataTileCategory(b.tile, frameSize);

      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }

      return a.index - b.index;
    })
    .map(({ tile }) => tile);
}

function textureDataTileCategory(
  tile: TextureData_Tile,
  frameSize: number
): number {
  if (tile.frames.length > 1) {
    return 2;
  }

  const frame = tile.frames[0];
  if (!frame) {
    return 0;
  }

  const [, , width, height] = tileFrameToRectangle(frame);
  return width > frameSize || height > frameSize ? 1 : 0;
}

export function imageToTextureFrames(
  name: string,
  imageWidth: number,
  imageHeight: number
): TextureFrame[] {
  const frameSize = imageWidth;
  const frameCount = frameSize > 0 ? Math.floor(imageHeight / frameSize) : 0;

  if (frameCount < 1) {
    return [
      {
        id: name,
        label: makeTextureFrameLabel(name, 0, 1),
        rectangle: [0, 0, imageWidth, imageHeight],
      },
    ];
  }

  const frames: TextureFrame[] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const frameId = frameCount > 1 ? `${name}_${frameIndex}` : name;
    frames.push({
      id: frameId,
      label: makeTextureFrameLabel(name, frameIndex, frameCount),
      rectangle: [0, frameIndex * frameSize, imageWidth, frameSize],
    });
  }

  return frames;
}

function makeTextureFrameLabel(
  name: string,
  frameIndex: number,
  frameCount: number
): string {
  const label = name.replace(/\.(png|jpe?g)$/i, "").replace(/_/g, " ");
  return frameCount > 1 ? `${label} (Frame ${frameIndex + 1})` : label;
}
