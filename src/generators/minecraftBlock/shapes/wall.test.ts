import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { encodeSelectedTextures } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { drawWall } from "./wall";

function makeWallFaceJson(): string {
  return encodeSelectedTextures([
    {
      textureDefId: "test-texture",
      frame: {
        id: "frame",
        label: "Frame",
        rectangle: [0, 0, 16, 16],
        crop: [0, 0, 16, 16],
      },
      rotation: "Rot0",
      flip: "None",
      blend: null,
    },
  ]);
}

function makeGenerator(
  shape: string | null = null,
  isTall: boolean = false,
  withPost: boolean = true
): Generator {
  const faceJson = makeWallFaceJson();

  return {
    defineAndGetBooleanInput: vi.fn(() => isTall),
    defineSelectInput: vi.fn(),
    defineRegionInput: vi.fn(),
    drawImage: vi.fn(),
    drawTexture: vi.fn(),
    getBooleanInputValueWithDefault: vi.fn(() => withPost),
    getSelectInputValue: (id: string) =>
      id === "Block 1 Shape" ? shape : null,
    getStringInputValue: (id: string) =>
      id.startsWith("WallFace") ? faceJson : null,
    setBooleanInputValue: vi.fn(),
  } as unknown as Generator;
}

describe("drawWall", () => {
  it("uses post regions and post overlay art by default", () => {
    const generator = makeGenerator();

    drawWall(generator, "1", 57, 16, true);

    expect(generator.defineSelectInput).toHaveBeenCalledWith("Block 1 Shape", [
      "Post and Side",
      "Two Sides",
      "Straight Segment",
    ]);
    expect(generator.defineAndGetBooleanInput).toHaveBeenCalledWith(
      "Block 1 Tall Wall",
      false
    );
    expect(generator.getBooleanInputValueWithDefault).toHaveBeenCalledWith(
      "Block 1 Wall With Post",
      true
    );
    expect(generator.defineRegionInput).toHaveBeenCalledTimes(7);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [121, 80, 64, 64],
      expect.any(Function),
      "WallFaceTop1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [121, 272, 64, 64],
      expect.any(Function),
      "WallFaceBottom1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [57, 144, 64, 128],
      expect.any(Function),
      "WallFaceRight1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [121, 144, 64, 128],
      expect.any(Function),
      "WallFaceFront1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      5,
      [185, 144, 64, 128],
      expect.any(Function),
      "WallFaceLeft1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      6,
      [249, 144, 64, 128],
      expect.any(Function),
      "WallFaceBack1"
    );
    expect(generator.drawTexture).toHaveBeenCalledTimes(12);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "test-texture",
      [11, 2, 4, 14],
      [417, 160, 32, 112],
      expect.any(Object)
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      7,
      [369, 112, 160, 208],
      expect.any(Function),
      "Block 1 Wall With Post"
    );
    expect(generator.drawImage).toHaveBeenCalledWith("Tabs-Wall-Post", [
      25, 15,
    ]);
    expect(generator.drawImage).toHaveBeenCalledWith("Folds-Wall-Post", [
      25, 15,
    ]);
  });

  it("uses short left side regions and draws both sides by default", () => {
    const generator = makeGenerator("Two Sides");

    drawWall(generator, "1", 57, 16, true);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(7);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [113, 112, 32, 48],
      expect.any(Function),
      "WallFaceTop1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [113, 272, 32, 48],
      expect.any(Function),
      "WallFaceBottom1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [65, 160, 48, 112],
      expect.any(Function),
      "WallFaceRight1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [113, 160, 32, 112],
      expect.any(Function),
      "WallFaceFront1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      5,
      [145, 160, 48, 112],
      expect.any(Function),
      "WallFaceLeft1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      6,
      [193, 160, 32, 112],
      expect.any(Function),
      "WallFaceBack1"
    );
    expect(generator.drawTexture).toHaveBeenCalledTimes(12);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "test-texture",
      [11, 2, 4, 14],
      [113, 160, 32, 112],
      expect.any(Object)
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      7,
      [369, 112, 160, 208],
      expect.any(Function),
      "Block 1 Wall With Post"
    );
    expect(generator.drawImage).toHaveBeenCalledWith("Tabs-Wall-Sides", [
      25, 15,
    ]);
    expect(generator.drawImage).toHaveBeenCalledWith("Folds-Wall-Sides", [
      25, 15,
    ]);
  });

  it("uses short straight segment regions and draws only the straight shape", () => {
    const generator = makeGenerator("Straight Segment");

    drawWall(generator, "1", 57, 16, true);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(6);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [185, 112, 128, 48],
      expect.any(Function),
      "WallFaceTop1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [185, 272, 128, 48],
      expect.any(Function),
      "WallFaceBottom1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [137, 160, 48, 112],
      expect.any(Function),
      "WallFaceRight1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [185, 160, 128, 112],
      expect.any(Function),
      "WallFaceFront1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      5,
      [313, 160, 48, 112],
      expect.any(Function),
      "WallFaceLeft1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      6,
      [361, 160, 128, 112],
      expect.any(Function),
      "WallFaceBack1"
    );
    expect(generator.drawTexture).toHaveBeenCalledTimes(6);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "test-texture",
      [0, 2, 16, 14],
      [185, 160, 128, 112],
      expect.any(Object)
    );
    expect(generator.drawImage).toHaveBeenCalledWith("Tabs-Wall-Straight", [
      25, 15,
    ]);
    expect(generator.drawImage).toHaveBeenCalledWith("Folds-Wall-Straight", [
      25, 15,
    ]);
  });

  it("uses tall side regions and full-height side textures when Tall Wall is checked", () => {
    const generator = makeGenerator("Two Sides", true);

    drawWall(generator, "1", 57, 16, true);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(7);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [113, 96, 32, 48],
      expect.any(Function),
      "WallFaceTop1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [113, 272, 32, 48],
      expect.any(Function),
      "WallFaceBottom1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [65, 144, 48, 128],
      expect.any(Function),
      "WallFaceRight1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [113, 144, 32, 128],
      expect.any(Function),
      "WallFaceFront1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      5,
      [145, 144, 48, 128],
      expect.any(Function),
      "WallFaceLeft1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      6,
      [193, 144, 32, 128],
      expect.any(Function),
      "WallFaceBack1"
    );
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "test-texture",
      [11, 0, 4, 16],
      [113, 144, 32, 128],
      expect.any(Object)
    );
  });

  it("uses the wider side depth when Wall With Post is toggled off", () => {
    const generator = makeGenerator("Two Sides", false, false);

    drawWall(generator, "1", 57, 16, true);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(7);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [105, 112, 40, 48],
      expect.any(Function),
      "WallFaceTop1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [105, 160, 40, 112],
      expect.any(Function),
      "WallFaceFront1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      5,
      [145, 160, 48, 112],
      expect.any(Function),
      "WallFaceLeft1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      7,
      [361, 112, 176, 208],
      expect.any(Function),
      "Block 1 Wall With Post"
    );
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "test-texture",
      [11, 2, 5, 14],
      [105, 160, 40, 112],
      expect.any(Object)
    );
  });

  it("toggles Wall With Post from the right side control region", () => {
    const generator = makeGenerator("Post and Side");

    drawWall(generator, "1", 57, 16, true);

    const controlRegionCall = vi.mocked(generator.defineRegionInput).mock.calls[6];
    if (!controlRegionCall) {
      throw new Error("Expected the Wall With Post control region to be defined");
    }
    controlRegionCall[1]();

    expect(generator.setBooleanInputValue).toHaveBeenCalledWith(
      "Block 1 Wall With Post",
      false
    );
  });

  it.each([
    ["Post and Side", "Post"],
    ["Two Sides", "Sides"],
    ["Straight Segment", "Straight"],
  ] as const)("uses the %s overlay art", (shape, imageSuffix) => {
    const generator = makeGenerator(shape);

    drawWall(generator, "1", 57, 16, true);

    expect(generator.drawImage).toHaveBeenCalledWith(
      "Tabs-Wall-" + imageSuffix,
      [25, 15]
    );
    expect(generator.drawImage).toHaveBeenCalledWith(
      "Folds-Wall-" + imageSuffix,
      [25, 15]
    );
  });
});
