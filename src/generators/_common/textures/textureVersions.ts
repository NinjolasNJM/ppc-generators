import { type TextureDef } from "@genroot/builder/modules/generatorDef";
import {
  type TextureData,
  type TextureFrame,
  tilesToTextureFrames,
} from "@genroot/builder/modules/textureData";

import * as Texture_1_7_10_Items from "@genroot/generators/_common/textures/texture_minecraft_1_7_10_items";
import * as Texture_1_7_10_Blocks from "@genroot/generators/_common/textures/texture_minecraft_1_7_10_blocks";

import * as Texture_1_13_2_Items from "@genroot/generators/_common/textures/texture_minecraft_1_13_2_items";
import * as Texture_1_13_2_Blocks from "@genroot/generators/_common/textures/texture_minecraft_1_13_2_blocks";

import * as Texture_26_1_2_Items from "@genroot/generators/_common/textures/texture_minecraft_26_1_2_items";
import * as Texture_26_1_2_Blocks from "@genroot/generators/_common/textures/texture_minecraft_26_1_2_blocks";

const definitions: [TextureData, number][] = [
  [Texture_1_7_10_Items.data, 16],
  [Texture_1_7_10_Blocks.data, 16],
  [Texture_1_13_2_Items.data, 16],
  [Texture_1_13_2_Blocks.data, 16],
  [Texture_26_1_2_Items.data, 16],
  [Texture_26_1_2_Blocks.data, 16],
];

export type TextureVersion = {
  textureDef: TextureDef;
  frames: TextureFrame[];
};

export const textureVersions: TextureVersion[] = definitions.map(
  ([data, frameSize]) => {
    const { textureDef, tiles } = data;
    const frames = tilesToTextureFrames(tiles, frameSize);
    return { textureDef, frames };
  }
);

export const allTextureDefs = textureVersions.map(
  ({ textureDef }) => textureDef
);

export const versionIds = textureVersions
  .map(({ textureDef }) => textureDef.id)
  .reverse();

export function findVersion(versionId: string): TextureVersion | null {
  return (
    textureVersions.find(({ textureDef }) => textureDef.id === versionId) ??
    null
  );
}
