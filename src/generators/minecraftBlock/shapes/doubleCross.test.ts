import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { encodeSelectedTextures } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { drawDoubleCross } from "./doubleCross";

type Crop = [number, number, number, number];
type CropOptions = {
  bottomCrop?: Crop | null;
  topCrop?: Crop | null;
};

const defaultCrop: Crop = [0, 2, 4, 12];

function makeCrossFaceJson(crop: Crop = [0, 2, 4, 12]): string {
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

function makeGenerator(cropOrOptions?: Crop | CropOptions): Generator {
  const options = Array.isArray(cropOrOptions)
    ? { bottomCrop: cropOrOptions, topCrop: cropOrOptions }
    : cropOrOptions;
  const bottomCrop =
    options && "bottomCrop" in options ? options.bottomCrop : defaultCrop;
  const topCrop =
    options && "topCrop" in options ? options.topCrop : defaultCrop;
  const bottomFaceJson = bottomCrop ? makeCrossFaceJson(bottomCrop) : null;
  const topFaceJson = topCrop ? makeCrossFaceJson(topCrop) : null;

  return {
    defineRegionInput: vi.fn(),
    drawFoldLine: vi.fn(),
    drawImage: vi.fn(),
    drawLine: vi.fn(),
    drawTexture: vi.fn(),
    fillRectangle: vi.fn(),
    getStringInputValue: (id: string) => {
      if (id === "DoubleCrossFaceBottom1") {
        return bottomFaceJson;
      }
      if (id === "DoubleCrossFaceTop1") {
        return topFaceJson;
      }
      return null;
    },
  } as unknown as Generator;
}

function expectStructuralFoldLines(generator: Generator) {
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
}

describe("drawDoubleCross", () => {
  it("draws half fold lines over the stacked crop", () => {
    const generator = makeGenerator();

    drawDoubleCross(generator, "1", 0, 0, true);

    expect(generator.drawLine).not.toHaveBeenCalled();
    expect(generator.fillRectangle).not.toHaveBeenCalled();
    expect(generator.drawFoldLine).toHaveBeenCalledTimes(8);
    expectStructuralFoldLines(generator);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [96, 180.25],
      [208, 180.25],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [96, 218.75],
      [208, 218.75],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      7,
      [272, 180.25],
      [384, 180.25],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      8,
      [272, 218.75],
      [384, 218.75],
      true
    );
  });

  it("uses the stacked crop height for full-height top and bottom textures", () => {
    const generator = makeGenerator([0, 0, 16, 16]);

    drawDoubleCross(generator, "1", 0, 0, true);

    expect(generator.drawLine).not.toHaveBeenCalled();
    expect(generator.fillRectangle).not.toHaveBeenCalled();
    expect(generator.drawFoldLine).toHaveBeenCalledTimes(8);
    expectStructuralFoldLines(generator);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [96, 119],
      [224, 119],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [96, 280],
      [224, 280],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      7,
      [256, 119],
      [384, 119],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      8,
      [256, 280],
      [384, 280],
      true
    );
  });

  it("positions asymmetric stacked crops on the translated right pair half", () => {
    const topOnlyGenerator = makeGenerator({ bottomCrop: null });
    const bottomOnlyGenerator = makeGenerator({ topCrop: null });

    drawDoubleCross(topOnlyGenerator, "1", 0, 0, true);
    drawDoubleCross(bottomOnlyGenerator, "1", 0, 0, true);

    expect(topOnlyGenerator.drawLine).not.toHaveBeenCalled();
    expect(bottomOnlyGenerator.drawLine).not.toHaveBeenCalled();
    expect(topOnlyGenerator.fillRectangle).not.toHaveBeenCalled();
    expect(bottomOnlyGenerator.fillRectangle).not.toHaveBeenCalled();
    expect(topOnlyGenerator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [160, 180.25],
      [208, 180.25],
      true
    );
    expect(topOnlyGenerator.drawFoldLine).toHaveBeenNthCalledWith(
      7,
      [400, 180.25],
      [448, 180.25],
      true
    );
    expect(bottomOnlyGenerator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [32, 180.25],
      [80, 180.25],
      true
    );
    expect(bottomOnlyGenerator.drawFoldLine).toHaveBeenNthCalledWith(
      7,
      [272, 180.25],
      [320, 180.25],
      true
    );
  });
});
