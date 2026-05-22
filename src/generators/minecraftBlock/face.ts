import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import { type DrawTextureOptions } from "@genroot/builder/modules/renderers/drawTexture";
import {
  defineTextureInputRegion,
  drawTextureFace,
  drawTextureFaceWithTransform,
  getSelectedTextureInputCrop,
  getTopTextureFaceCrop,
  type FaceTextureTransform,
} from "../_common/plugins/texturePicker/face";
import { currentBlockTextureId } from "./constants";

export type { FaceTextureTransform };

export function defineInputRegion(
  generator: Generator,
  faceId: string,
  region: Region
) {
  defineTextureInputRegion(generator, currentBlockTextureId, faceId, region);
}

export function drawFace(
  generator: Generator,
  faceId: string,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions
) {
  drawTextureFace(generator, faceId, source, destination, options);
}

export function drawFaceWithTextureTransform(
  generator: Generator,
  faceId: string,
  source: Region,
  destination: Region,
  transform: FaceTextureTransform
) {
  drawTextureFaceWithTransform(
    generator,
    faceId,
    source,
    destination,
    transform
  );
}

export function getFaceCrop(
  generator: Generator,
  faceId: string
): Region | null {
  return getTopTextureFaceCrop(generator, faceId, 16);
}

export function getCurrentTextureCrop(generator: Generator): Region | null {
  return getSelectedTextureInputCrop(generator, currentBlockTextureId, 16);
}
