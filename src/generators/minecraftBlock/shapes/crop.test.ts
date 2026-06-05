import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { type Rotation } from "@genroot/builder/ui/texturePicker/rotation";
import { encodeSelectedTextures } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { drawCrop } from "./crop";

type Crop = [number, number, number, number];

function makeCropFaceJson(
  crop: Crop = [0, 0, 16, 16],
  rotation: Rotation = "Rot0"
): string {
  return encodeSelectedTextures([
    {
      textureDefId: "test-texture",
      frame: {
        id: "frame",
        label: "Frame",
        rectangle: [0, 0, 16, 16],
        crop,
      },
      rotation,
      flip: "None",
      blend: null,
    },
  ]);
}

function makeGenerator(
  faceJson: string | null = makeCropFaceJson()
): Generator {
  return {
    defineRegionInput: vi.fn(),
    drawFoldLine: vi.fn(),
    drawLine: vi.fn(),
    drawTexture: vi.fn(),
    getStringInputValue: (id: string) => (id === "CropFace1" ? faceJson : null),
  } as unknown as Generator;
}

describe("drawCrop", () => {
  it("uses one face input for all four mirrored crop pairs", () => {
    const generator = makeGenerator();

    drawCrop(generator, "1", 0, 0, false);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(4);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [-40, 72, 128, 256],
      expect.any(Function),
      "CropFace1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [104, 72, 128, 256],
      expect.any(Function),
      "CropFace1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [248, 72, 128, 256],
      expect.any(Function),
      "CropFace1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [392, 72, 128, 256],
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
      [-40, 72, 128, 128],
      expect.objectContaining({
        flip: "None",
        rotate: 0,
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "test-texture",
      [0, 0, 16, 16],
      [-40, 200, 128, 128],
      expect.objectContaining({
        flip: "Vertical",
        rotate: 0,
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      7,
      "test-texture",
      [0, 0, 16, 16],
      [392, 72, 128, 128],
      expect.objectContaining({
        flip: "None",
        rotate: 0,
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      8,
      "test-texture",
      [0, 0, 16, 16],
      [392, 200, 128, 128],
      expect.objectContaining({
        flip: "Vertical",
        rotate: 0,
      })
    );
  });

  it("anchors one-pixel rotated crops against the center fold", () => {
    const generator = makeGenerator(makeCropFaceJson([6, 5, 4, 1], "Rot180"));

    drawCrop(generator, "1", 0, 0, false);

    expect(generator.drawTexture).toHaveBeenCalledTimes(8);
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      1,
      "test-texture",
      [6, 5, 4, 1],
      [8, 192, 32, 8],
      expect.objectContaining({
        flip: "None",
        rotate: 180,
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "test-texture",
      [6, 5, 4, 1],
      [8, 200, 32, 8],
      expect.objectContaining({
        flip: "Vertical",
        rotate: 180,
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
      [-40, 200],
      [88, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      2,
      [-40, 199],
      [88, 199],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      3,
      [-8, 72],
      [-8, 136],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      4,
      [55, 72],
      [55, 136],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [-8, 264],
      [-8, 328],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [55, 264],
      [55, 328],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      9,
      [136, 136],
      [136, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      10,
      [199, 136],
      [199, 200],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      12,
      [199, 200],
      [199, 264],
      true
    );
  });

  it("sizes crop folds to the drawn texture crop", () => {
    const generator = makeGenerator(makeCropFaceJson([0, 2, 4, 12]));

    drawCrop(generator, "1", 0, 0, true);

    expect(generator.drawFoldLine).toHaveBeenCalledTimes(24);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      3,
      [-8, 104],
      [-8, 152],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      4,
      [55, 104],
      [55, 152],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [-8, 248],
      [-8, 296],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [55, 248],
      [55, 296],
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
