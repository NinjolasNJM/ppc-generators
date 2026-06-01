import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { encodeSelectedTextures } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { drawDoubleCross } from "./doubleCross";

function makeCrossFaceJson(): string {
  return encodeSelectedTextures([
    {
      textureDefId: "test-texture",
      frame: {
        id: "frame",
        label: "Frame",
        rectangle: [0, 0, 16, 16],
        crop: [0, 2, 4, 12],
      },
      rotation: "Rot0",
      flip: "None",
      blend: null,
    },
  ]);
}

function makeGenerator(): Generator {
  const faceJson = makeCrossFaceJson();

  return {
    defineRegionInput: vi.fn(),
    drawFoldLine: vi.fn(),
    drawImage: vi.fn(),
    drawLine: vi.fn(),
    drawTexture: vi.fn(),
    getStringInputValue: (id: string) =>
      id === "CrossFace1" || id === "CrossFaceTop1" ? faceJson : null,
  } as unknown as Generator;
}

describe("drawDoubleCross", () => {
  it("draws sideways fold lines through the middle of each drawn face", () => {
    const generator = makeGenerator();

    drawDoubleCross(generator, "1", 0, 0, true);

    expect(generator.drawLine).not.toHaveBeenCalled();
    expect(generator.drawFoldLine).toHaveBeenCalledTimes(8);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      1,
      [-32, 200],
      [224, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      2,
      [-32, 199],
      [224, 199],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      3,
      [256, 200],
      [512, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      4,
      [256, 199],
      [512, 199],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [112, 180.25],
      [208, 180.25],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [112, 219.75],
      [208, 219.75],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      7,
      [368, 180.25],
      [272, 180.25],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      8,
      [368, 219.75],
      [272, 219.75],
      true
    );
  });
});
