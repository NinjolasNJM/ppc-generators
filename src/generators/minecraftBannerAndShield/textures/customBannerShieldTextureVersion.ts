import { type TextureDef } from "@genroot/builder/modules/generatorDef";
import {
  type Atlas,
  type TextureFrame,
} from "@genroot/builder/modules/textureData";

import image from "@genroot/generators/_common/textures/texture_custom.png";
import {
  pairBannerShieldPatterns,
} from "../bannerTexturePicker/pairPatterns";
import { type BannerShieldTextureVersion } from "../bannerTexturePicker/types";

export const customBannerTextureDef: TextureDef = {
  id: "custom-banner-patterns",
  url: image.src,
  standardWidth: 16,
  standardHeight: 16,
};

export const customShieldTextureDef: TextureDef = {
  id: "custom-shield-patterns",
  url: image.src,
  standardWidth: 16,
  standardHeight: 16,
};

export const customBannerFrames: TextureFrame[] = [];
export const customShieldFrames: TextureFrame[] = [];

export function makeCustomBannerShieldTextureVersion(): BannerShieldTextureVersion {
  const { bases, patterns } = pairBannerShieldPatterns({
    bannerFrames: customBannerFrames,
    shieldFrames: customShieldFrames,
  });

  return {
    id: "custom",
    label: "Custom",
    bannerTextureDef: customBannerTextureDef,
    shieldTextureDef: customShieldTextureDef,
    bases,
    patterns,
  };
}

export function updateCustomBannerTextureAtlas(
  url: string,
  atlas: Atlas
): void {
  customBannerTextureDef.url = url;
  customBannerTextureDef.standardWidth = atlas.atlasWidth;
  customBannerTextureDef.standardHeight = atlas.atlasHeight;
  customBannerFrames.splice(0, customBannerFrames.length, ...atlas.frames);
}

export function updateCustomShieldTextureAtlas(
  url: string,
  atlas: Atlas
): void {
  customShieldTextureDef.url = url;
  customShieldTextureDef.standardWidth = atlas.atlasWidth;
  customShieldTextureDef.standardHeight = atlas.atlasHeight;
  customShieldFrames.splice(0, customShieldFrames.length, ...atlas.frames);
}
