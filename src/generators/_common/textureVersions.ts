import { type TextureDef } from "@genroot/builder/modules/generatorDef";
import {
  type TextureData,
  type TextureFrame,
  tilesToTextureFrames,
} from "./textureData";

export type TextureVersion = {
  textureDef: TextureDef;
  frames: TextureFrame[];
};

export type TextureVersionDefinition = [TextureData, number];

export function makeTextureVersions(
  definitions: TextureVersionDefinition[]
): TextureVersion[] {
  return definitions.map(([data, frameSize]) => {
    const { textureDef, tiles } = data;
    const frames = tilesToTextureFrames(tiles, frameSize);
    return { textureDef, frames };
  });
}
