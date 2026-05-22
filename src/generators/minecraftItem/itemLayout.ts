import { type Flip } from "@genroot/builder/ui/texturePicker/flip";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import {
  getFrameLogicalBounds,
  getFrameLogicalCrop,
  getFrameSourceCrop,
  getLayerHalfDestination,
  getTextureHalfCropBounds,
  getTextureLayout,
  getTransformedCrop,
  type Rectangle,
  rotateCrop,
  flipCrop,
  getCropBounds,
} from "../_common/plugins/texturePicker/textureLayout";

export type { Rectangle };
export {
  flipCrop,
  getCropBounds,
  getFrameLogicalBounds,
  getFrameLogicalCrop,
  getFrameSourceCrop,
  getLayerHalfDestination,
  getTransformedCrop,
  rotateCrop,
};

export function getItemLayers(
  selectedTextureFrame: SelectedTexture
): SelectedTexture[] {
  return selectedTextureFrame.itemLayers ?? [selectedTextureFrame];
}

export function getItemHalfCropBounds(
  layers: SelectedTexture[],
  appliedFlip: Flip
): Rectangle {
  return getTextureHalfCropBounds(layers, appliedFlip);
}

export function getItemLayout(layers: SelectedTexture[]): {
  leftBounds: Rectangle;
  rightBounds: Rectangle;
  height: number;
  minY: number;
} {
  const anchorLayers = layers.length > 0 ? [layers[0]!] : layers;
  return getTextureLayout(anchorLayers);
}

export function getItemDimensions(
  selectedTextureFrame: SelectedTexture,
  scale: number
): {
  leftHalfWidth: number;
  rightHalfWidth: number;
  width: number;
  height: number;
} {
  const layers = getItemLayers(selectedTextureFrame);
  const { leftBounds, rightBounds, height } = getItemLayout(layers);
  const leftHalfWidth = leftBounds[2] * scale;
  const rightHalfWidth = rightBounds[2] * scale;
  return {
    leftHalfWidth,
    rightHalfWidth,
    width: leftHalfWidth + rightHalfWidth,
    height: height * scale,
  };
}
