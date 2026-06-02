import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { encodeSelectedTextures } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { drawCrop } from "./crop";

type Crop = [number, number, number, number];

function makeCropFaceJson(crop: Crop = [0, 0, 16, 16]): string {
  return encodeSelectedTextures([
    {
      textureDefId: "test-texture",
      frame: {
        id: "frame",
        label: "Frame",
        rectangle: [0, 0, 16, 16],
        crop,
      },
      rotation: "Rot0",
      flip: "None",
      blend: null,
    },
  ]);
}

function makeGenerator(faceJson: string | null = makeCropFaceJson()): Generator {
  return {
    defineRegionInput: vi.fn(),
    drawFoldLine: vi.fn(),
    drawLine: vi.fn(),
    drawTexture: vi.fn(),
    getStringInputValue: (id: string) =>
      id === "CropFace1" ? faceJson : null,
  } as unknown as Generator;
}

describe("drawCrop", () => {
  it("uses one face input for all four mirrored crop pairs", () => {
    const generator = makeGenerator();

    drawCrop(generator, "1", 0, 0, false);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(4);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [-32, 72, 128, 256],
      expect.any(Function),
      "CropFace1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [112, 72, 128, 256],
      expect.any(Function),
      "CropFace1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [256, 72, 128, 256],
      expect.any(Function),
      "CropFace1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [400, 72, 128, 256],
      expect.any(Function),
      "CropFace1"
    );
  });

  it("draws each top face with a vertically flipped mirror below it", () => {
    const generator = makeGenerator();

    drawCrop(generator, "1", 0, 0, false);

    expect(generator.drawTexture).toHaveBeenCalledTimes(8);
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      1,
      "test-texture",
      [0, 0, 16, 16],
      [-32, 72, 128, 128],
      expect.objectContaining({
        flip: "None",
        rotate: 0,
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "test-texture",
      [0, 0, 16, 16],
      [-32, 200, 128, 128],
      expect.objectContaining({
        flip: "Vertical",
        rotate: 0,
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      7,
      "test-texture",
      [0, 0, 16, 16],
      [400, 72, 128, 128],
      expect.objectContaining({
        flip: "None",
        rotate: 0,
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      8,
      "test-texture",
      [0, 0, 16, 16],
      [400, 200, 128, 128],
      expect.objectContaining({
        flip: "Vertical",
        rotate: 0,
      })
    );
  });

  it("draws pair folds and left and right crop folds", () => {
    const generator = makeGenerator();

    drawCrop(generator, "1", 0, 0, true);

    expect(generator.drawLine).not.toHaveBeenCalled();
    expect(generator.drawFoldLine).toHaveBeenCalledTimes(24);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      1,
      [-32, 200],
      [96, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      2,
      [-32, 199],
      [96, 199],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      3,
      [0, 72],
      [0, 136],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      4,
      [64, 72],
      [64, 136],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [0, 264],
      [0, 328],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [64, 264],
      [64, 328],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      9,
      [144, 136],
      [144, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      10,
      [208, 136],
      [208, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      12,
      [208, 200],
      [208, 264],
      true
    );
  });

  it("sizes crop folds to the drawn texture crop", () => {
    const generator = makeGenerator(makeCropFaceJson([0, 2, 4, 12]));

    drawCrop(generator, "1", 0, 0, true);

    expect(generator.drawFoldLine).toHaveBeenCalledTimes(24);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      3,
      [0, 88],
      [0, 136],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      4,
      [64, 88],
      [64, 136],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [0, 264],
      [0, 312],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [64, 264],
      [64, 312],
      true
    );
  });

  it("does not draw texture-dependent crop folds without a face texture", () => {
    const generator = makeGenerator(null);

    drawCrop(generator, "1", 0, 0, true);

    expect(generator.drawTexture).not.toHaveBeenCalled();
    expect(generator.drawFoldLine).toHaveBeenCalledTimes(8);
  });
});
