import { type TextureDef } from "./generatorDef";

// These "TextureData" types are the shapes of the generated texture data.

export type TextureData_TileFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextureData_Tile = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  frames: TextureData_TileFrame[];
};

export type TextureData = {
  textureDef: TextureDef;
  tiles: TextureData_Tile[];
};

// Computed shapes for use in code

export type TextureFrame = {
  id: string;
  name: string;
  rectangle: [number, number, number, number];
  frameIndex: number;
  frameCount: number;
};

export function makeFrameLabel(frame: TextureFrame): string {
  const name = frame.name.replace(/_/g, " ");
  if (frame.frameCount > 1) {
    const sequence = String(frame.frameIndex + 1);
    return name + ` (Frame ${sequence})`;
  } else {
    return name;
  }
}

function tileToTextureFrames(
  tile: TextureData_Tile,
  frameSize: number // We assume a square frame
): TextureFrame[] {
  const xMod = tile.width % frameSize;
  const yMod = tile.height % frameSize;
  if (xMod > 0 || yMod > 0) {
    return [];
  }

  const frameCount = tile.frames.length;
  const frames: TextureFrame[] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const tileFrame = tile.frames[frameIndex]!;
    const id = frameCount > 1 ? tile.name + "_" + String(frameIndex) : tile.name;
    const frame: TextureFrame = {
      id,
      name: tile.name,
      rectangle: [tileFrame.x, tileFrame.y, tileFrame.width, tileFrame.height],
      frameIndex,
      frameCount,
    };
    frames.push(frame);
  }

  return frames;
}

export function tilesToTextureFrames(
  tiles: TextureData_Tile[],
  frameSize: number
): TextureFrame[] {
  return tiles.flatMap((tile) => tileToTextureFrames(tile, frameSize));
}
