import { type TextureDef } from "@genroot/builder/modules/generatorDef";
import { type TextureFrame } from "@genroot/builder/modules/textureData";

import image from "./texture_custom.png";

export const customTextureDef: TextureDef = {
  id: "custom",
  url: image.src,
  standardWidth: 16,
  standardHeight: 16,
};

export const customFrame: TextureFrame = {
  id: "custom",
  name: "Custom",
  rectangle: [0, 0, 16, 16],
  frameIndex: 0,
  frameCount: 1,
};

export const customFrames: TextureFrame[] = [customFrame];

export const customTextureVersion = {
  textureDef: customTextureDef,
  frames: customFrames,
};