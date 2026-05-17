import { describe, expect, it } from "vitest";
import {
  decodeSelectedTextureWithBlend,
  decodeSelectedTextureWithBlendArray,
  encodeSelectedTextureWithBlend,
  encodeSelectedTextureWithBlendArray,
} from "./selectedTextureWithBlend";

describe("selectedTextureWithBlend", () => {
  it("round-trips the selected texture and tint", () => {
    const selectedTexture = {
      selectedTexture: {
        textureDefId: "minecraft-1.7.10-items",
        frame: {
          id: "frame",
          name: "frame",
          rectangle: [0, 0, 16, 16] as [number, number, number, number],
          frameIndex: 0,
          frameCount: 1,
        },
        rotation: "Rot0" as const,
        flip: "None" as const,
      },
      blend: "#ff00aa",
      itemScale: 5,
    };

    const encoded = encodeSelectedTextureWithBlend(selectedTexture);
    expect(decodeSelectedTextureWithBlend(encoded)).toEqual(selectedTexture);
  });

  it("round-trips arrays of selected textures", () => {
    const selectedTextures = [
      {
        selectedTexture: null,
        blend: null,
        itemScale: 4,
      },
    ];

    const encoded = encodeSelectedTextureWithBlendArray(selectedTextures);
    expect(decodeSelectedTextureWithBlendArray(encoded)).toEqual(
      selectedTextures
    );
  });
});
