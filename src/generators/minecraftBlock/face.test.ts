import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { type DrawTextureOptions } from "@genroot/builder/modules/renderers/drawTexture";
import { encodeSelectedTextureWithBlendArray } from "./selectedTextureWithBlend";
import { drawFace } from "./face";

function makeGenerator(faceId: string, faceJson: string): Generator {
  return {
    getStringInputValue: (id: string) => (id === faceId ? faceJson : null),
    drawTexture: vi.fn(),
  } as unknown as Generator;
}

function makeFaceJson({
  rotation,
  flip,
}: {
  rotation: "Rot0" | "Rot90" | "Rot180" | "Rot270";
  flip: "None" | "Horizontal" | "Vertical";
}) {
  return encodeSelectedTextureWithBlendArray([
    {
      selectedTexture: {
        textureDefId: "test-texture",
        frame: {
          id: "frame",
          name: "frame",
          rectangle: [16, 32, 16, 16],
          frameIndex: 0,
          frameCount: 1,
        },
        rotation,
        flip,
      },
      blend: null,
    },
  ]);
}

function makeExpectedDestination(
  rotation: "Rot0" | "Rot90" | "Rot180" | "Rot270",
  destination: [number, number, number, number]
): [number, number, number, number] {
  const [dx, dy, dw, dh] = destination;
  switch (rotation) {
    case "Rot0":
    case "Rot180":
      return destination;
    case "Rot90":
    case "Rot270":
      return [dx + (dw - dh) / 2, dy - (dw - dh) / 2, dh, dw];
  }
}

describe("drawFace", () => {
  const source: [number, number, number, number] = [0, 0, 16, 16];
  const destination: [number, number, number, number] = [20, 30, 40, 50];
  const faceId = "BlockFaceTop1";

  const cases: Array<{
    name: string;
    rotation: "Rot0" | "Rot90" | "Rot180" | "Rot270";
    flip: "None" | "Horizontal" | "Vertical";
    expectedRotate: number;
  }> = [
    { name: "rot0 none", rotation: "Rot0", flip: "None", expectedRotate: 0 },
    {
      name: "rot0 horizontal",
      rotation: "Rot0",
      flip: "Horizontal",
      expectedRotate: 0,
    },
    {
      name: "rot0 vertical",
      rotation: "Rot0",
      flip: "Vertical",
      expectedRotate: 0,
    },
    {
      name: "rot90 none",
      rotation: "Rot90",
      flip: "None",
      expectedRotate: 90,
    },
    {
      name: "rot90 horizontal",
      rotation: "Rot90",
      flip: "Horizontal",
      expectedRotate: 90,
    },
    {
      name: "rot90 vertical",
      rotation: "Rot90",
      flip: "Vertical",
      expectedRotate: 90,
    },
    {
      name: "rot180 none",
      rotation: "Rot180",
      flip: "None",
      expectedRotate: 180,
    },
    {
      name: "rot180 horizontal",
      rotation: "Rot180",
      flip: "Horizontal",
      expectedRotate: 180,
    },
    {
      name: "rot180 vertical",
      rotation: "Rot180",
      flip: "Vertical",
      expectedRotate: 180,
    },
    {
      name: "rot270 none",
      rotation: "Rot270",
      flip: "None",
      expectedRotate: 270,
    },
    {
      name: "rot270 horizontal",
      rotation: "Rot270",
      flip: "Horizontal",
      expectedRotate: 270,
    },
    {
      name: "rot270 vertical",
      rotation: "Rot270",
      flip: "Vertical",
      expectedRotate: 270,
    },
  ];

  cases.forEach(({ name, rotation, flip, expectedRotate }) => {
    it(`forwards orientation correctly for ${name}`, () => {
      const generator = makeGenerator(faceId, makeFaceJson({ rotation, flip }));

      drawFace(generator, faceId, source, destination);

      expect(generator.drawTexture).toHaveBeenCalledTimes(1);
      expect(generator.drawTexture).toHaveBeenCalledWith(
        "test-texture",
        [16, 32, 16, 16],
        makeExpectedDestination(rotation, destination),
        expect.objectContaining<DrawTextureOptions>({
          rotate: expectedRotate,
          flip,
          blend: undefined,
        })
      );
    });
  });
});
