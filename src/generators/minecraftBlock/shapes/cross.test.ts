import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { encodeSelectedTextures } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { drawCross } from "./cross";

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

function makeGenerator(faceJson: string | null = makeCrossFaceJson()): Generator {
  return {
    defineRegionInput: vi.fn(),
    defineText: vi.fn(),
    drawFoldLine: vi.fn(),
    drawLine: vi.fn(),
    drawTexture: vi.fn(),
    getStringInputValue: (id: string) =>
      id === "CrossFace1" ? faceJson : null,
  } as unknown as Generator;
}

describe("drawCross", () => {
  it("draws structural fold lines between the halves without texture layout", () => {
    const generator = makeGenerator(null);

    drawCross(generator, "1", 0, 0, true);

    expect(generator.drawLine).not.toHaveBeenCalled();
    expect(generator.drawFoldLine).toHaveBeenCalledTimes(4);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      1,
      [240, 56],
      [240, 184],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      2,
      [239, 56],
      [239, 184],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      3,
      [240, 216],
      [240, 344],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      4,
      [239, 216],
      [239, 344],
      true
    );
  });

  it("draws each fold line through the middle of the drawn texture", () => {
    const generator = makeGenerator();

    drawCross(generator, "1", 0, 0, true);

    expect(generator.drawLine).not.toHaveBeenCalled();
    expect(generator.drawFoldLine).toHaveBeenCalledTimes(8);
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      1,
      [240, 56],
      [240, 184],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      2,
      [239, 56],
      [239, 184],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      3,
      [240, 216],
      [240, 344],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      4,
      [239, 216],
      [239, 344],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      5,
      [219.75, 72],
      [219.75, 120],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      6,
      [259.25, 72],
      [259.25, 120],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      7,
      [219.75, 280],
      [219.75, 328],
      true
    );
    expect(generator.drawFoldLine).toHaveBeenNthCalledWith(
      8,
      [259.25, 280],
      [259.25, 328],
      true
    );
  });
});
