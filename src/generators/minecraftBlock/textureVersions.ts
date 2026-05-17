import {
  makeTextureVersions,
  type TextureVersion as CommonTextureVersion,
} from "../_common/textureVersions";
import { minecraftTextureVersionDefinitions as definitions } from "../_common/minecraftTextureVersions";
import { customTextureVersion } from "../_common/customTextureVersion";

export const textureVersions: TextureVersion[] = [
  customTextureVersion,
  ...makeTextureVersions(definitions),
];
export type TextureVersion = CommonTextureVersion;

export const textureDefs = textureVersions.map(({ textureDef }) => textureDef);

export const textureVersionIds = textureVersions
  .map(({ textureDef }) => textureDef.id)
  .reverse();

export function findVersion(versionId: string): TextureVersion | null {
  return (
    textureVersions.find(({ textureDef }) => textureDef.id === versionId) ??
    null
  );
}
