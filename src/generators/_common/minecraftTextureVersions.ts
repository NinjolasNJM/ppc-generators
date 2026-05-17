import { type TextureVersionDefinition } from "./textureVersions";
import * as Texture_1_7_10_Items from "../../textures/texture_minecraft_1_7_10_items";
import * as Texture_1_7_10_Blocks from "../../textures/texture_minecraft_1_7_10_blocks";
import * as Texture_1_13_2_Items from "../../textures/texture_minecraft_1_13_2_items";
import * as Texture_1_13_2_Blocks from "../../textures/texture_minecraft_1_13_2_blocks";
import * as Texture_1_18_2_Items from "../../textures/texture_minecraft_1_18_2_items";
import * as Texture_1_18_2_Blocks from "../../textures/texture_minecraft_1_18_2_blocks";
import * as Texture_1_20_4_Items from "../../textures/texture_minecraft_1_20_4_items";
import * as Texture_1_20_4_Blocks from "../../textures/texture_minecraft_1_20_4_blocks";
import * as Texture_26_1_2_Items from "../../textures/texture_minecraft_26_1_2_items";
import * as Texture_26_1_2_Blocks from "../../textures/texture_minecraft_26_1_2_blocks";

const blockDefinitions: TextureVersionDefinition[] = [
  [Texture_1_7_10_Blocks.data, 16],
  [Texture_1_13_2_Blocks.data, 16],
  [Texture_1_18_2_Blocks.data, 16],
  [Texture_1_20_4_Blocks.data, 16],
  [Texture_26_1_2_Blocks.data, 16],
];

const itemDefinitions: TextureVersionDefinition[] = [
  [Texture_1_7_10_Items.data, 16],
  [Texture_1_13_2_Items.data, 16],
  [Texture_1_18_2_Items.data, 16],
  [Texture_1_20_4_Items.data, 16],
  [Texture_26_1_2_Items.data, 16],
];

export const minecraftTextureVersionDefinitions: TextureVersionDefinition[] = [
  ...itemDefinitions,
  ...blockDefinitions,
];

export const minecraftTextureVersionDefinitionsBlocksFirst: TextureVersionDefinition[] =
  [
    ...itemDefinitions,
    ...blockDefinitions,
  ];

export const minecraftTextureVersionDefinitionsItemsFirst: TextureVersionDefinition[] =
  [
    ...blockDefinitions,
    ...itemDefinitions,
  ];
