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

function makeGenerator(shape: string | null = null): Generator {
  const faceJson = makeWallFaceJson();

  return {
    defineSelectInput: vi.fn(),
    defineRegionInput: vi.fn(),
    drawImage: vi.fn(),
    drawTexture: vi.fn(),
    getSelectInputValue: (id: string) =>
      id === "Block 1 Shape" ? shape : null,
    getStringInputValue: (id: string) =>
      id.startsWith("WallFace") ? faceJson : null,
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
    expect(generator.defineRegionInput).toHaveBeenCalledTimes(6);
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
    expect(generator.drawImage).toHaveBeenCalledWith("Tabs-Wall-Post", [
      25, 15,
    ]);
    expect(generator.drawImage).toHaveBeenCalledWith("Folds-Wall-Post", [
      25, 15,
    ]);
  });

  it("uses left side regions and draws both sides for the sides shape", () => {
    const generator = makeGenerator("Two Sides");

    drawWall(generator, "1", 57, 16, true);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(6);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [120, 112, 20, 64],
      expect.any(Function),
      "WallFaceTop1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [120, 208, 20, 64],
      expect.any(Function),
      "WallFaceBottom1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [140, 176, 64, 32],
      expect.any(Function),
      "WallFaceRight1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [120, 176, 20, 32],
      expect.any(Function),
      "WallFaceFront1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      5,
      [56, 176, 64, 32],
      expect.any(Function),
      "WallFaceLeft1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      6,
      [120, 272, 20, 32],
      expect.any(Function),
      "WallFaceBack1"
    );
    expect(generator.drawTexture).toHaveBeenCalledTimes(12);
    expect(generator.drawImage).toHaveBeenCalledWith("Tabs-Wall-Sides", [
      25, 15,
    ]);
    expect(generator.drawImage).toHaveBeenCalledWith("Folds-Wall-Sides", [
      25, 15,
    ]);
  });

  it("uses straight segment regions and draws only the straight shape", () => {
    const generator = makeGenerator("Straight Segment");

    drawWall(generator, "1", 57, 16, true);

    expect(generator.defineRegionInput).toHaveBeenCalledTimes(6);
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      1,
      [441, 112, 20, 64],
      expect.any(Function),
      "WallFaceTop1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      2,
      [441, 208, 20, 64],
      expect.any(Function),
      "WallFaceBottom1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      3,
      [481, 176, 64, 32],
      expect.any(Function),
      "WallFaceRight1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      4,
      [441, 176, 20, 32],
      expect.any(Function),
      "WallFaceFront1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      5,
      [377, 176, 64, 32],
      expect.any(Function),
      "WallFaceLeft1"
    );
    expect(generator.defineRegionInput).toHaveBeenNthCalledWith(
      6,
      [441, 272, 20, 32],
      expect.any(Function),
      "WallFaceBack1"
    );
    expect(generator.drawTexture).toHaveBeenCalledTimes(6);
    expect(generator.drawImage).toHaveBeenCalledWith("Tabs-Wall-Straight", [
      25, 15,
    ]);
    expect(generator.drawImage).toHaveBeenCalledWith("Folds-Wall-Straight", [
      25, 15,
    ]);
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
