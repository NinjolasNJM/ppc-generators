import { describe, expect, it } from "vitest";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import {
  getLayerHalfDestination,
  getLayerHalfDestinationWithScale,
  getTextureLayout,
} from "./textureLayout";

function makeSelectedTexture(
  crop: [number, number, number, number],
  overrides: Partial<SelectedTexture> = {}
): SelectedTexture {
  return {
    textureDefId: "test-atlas",
    frame: {
      id: "frame",
      label: "Frame",
      rectangle: [100, 200, 16, 16],
      crop,
    },
    rotation: "Rot0",
    flip: "None",
    blend: null,
    ...overrides,
  };
}

describe("texture layout", () => {
  it("uses the largest transformed crop bounds across layers", () => {
    const layout = getTextureLayout([
      makeSelectedTexture([2, 3, 8, 9]),
      makeSelectedTexture([0, 1, 12, 13]),
    ]);

    expect(layout).toEqual({
      leftBounds: [0, 1, 12, 13],
      rightBounds: [4, 1, 12, 13],
      height: 13,
      minY: 1,
    });
  });

  it("places a layer relative to shared crop bounds", () => {
    const layer = makeSelectedTexture([2, 3, 8, 9]);

    expect(
      getLayerHalfDestination([0, 1, 12, 13], 1, layer, 50, 60, 2, "None")
    ).toEqual({
      source: [102, 203, 8, 9],
      x: 54,
      y: 64,
      width: 16,
      height: 18,
    });
  });

  it("can scale width and height separately", () => {
    const layer = makeSelectedTexture([2, 3, 8, 9]);

    expect(
      getLayerHalfDestinationWithScale(
        [0, 1, 12, 13],
        1,
        layer,
        50,
        60,
        3,
        2,
        "None"
      )
    ).toEqual({
      source: [102, 203, 8, 9],
      x: 56,
      y: 64,
      width: 24,
      height: 18,
    });
  });
});
