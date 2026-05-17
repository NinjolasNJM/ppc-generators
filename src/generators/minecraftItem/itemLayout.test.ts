import { describe, expect, it } from "vitest";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import {
  getFrameLogicalCrop,
  getFrameSourceCrop,
  getItemDimensions,
  getItemLayout,
  getLayerHalfDestination,
} from "./itemLayout";

function makeSelectedTexture(
  overrides: Partial<SelectedTexture> = {}
): SelectedTexture {
  return {
    textureDefId: "test-atlas",
    frame: {
      id: "large-item",
      label: "Large Item",
      rectangle: [100, 200, 32, 32],
      crop: [8, 4, 16, 20],
    },
    rotation: "Rot0",
    flip: "None",
    blend: null,
    ...overrides,
  };
}

describe("item texture layout", () => {
  it("uses atlas coordinates for source crop and logical coordinates for layout", () => {
    const selectedTexture = makeSelectedTexture();

    expect(getFrameSourceCrop(selectedTexture.frame)).toEqual([
      108, 204, 16, 20,
    ]);
    expect(getFrameLogicalCrop(selectedTexture.frame)).toEqual([4, 2, 8, 10]);
  });

  it("sizes items from the cropped area instead of the full frame", () => {
    const selectedTexture = makeSelectedTexture();

    expect(getItemDimensions(selectedTexture, 4)).toEqual({
      leftHalfWidth: 32,
      rightHalfWidth: 32,
      width: 64,
      height: 40,
    });
  });

  it("places a cropped layer while still drawing from the cropped atlas source", () => {
    const selectedTexture = makeSelectedTexture();
    const layout = getItemLayout([selectedTexture]);

    expect(
      getLayerHalfDestination(
        layout.leftBounds,
        layout.minY,
        selectedTexture,
        10,
        20,
        4,
        "None"
      )
    ).toEqual({
      source: [108, 204, 16, 20],
      x: 10,
      y: 20,
      width: 32,
      height: 40,
    });
  });

  it("accounts for flipped crops when positioning the mirrored half", () => {
    const selectedTexture = makeSelectedTexture({
      frame: {
        id: "offset-item",
        label: "Offset Item",
        rectangle: [0, 0, 16, 16],
        crop: [2, 3, 8, 9],
      },
    });
    const layout = getItemLayout([selectedTexture]);

    expect(layout.leftBounds).toEqual([2, 3, 8, 9]);
    expect(layout.rightBounds).toEqual([6, 3, 8, 9]);
    expect(
      getLayerHalfDestination(
        layout.rightBounds,
        layout.minY,
        selectedTexture,
        50,
        60,
        2,
        "Horizontal"
      )
    ).toEqual({
      source: [2, 3, 8, 9],
      x: 50,
      y: 60,
      width: 16,
      height: 18,
    });
  });
});
