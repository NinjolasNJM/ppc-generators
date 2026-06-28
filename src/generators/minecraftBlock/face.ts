import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import { type DrawTextureOptions } from "@genroot/builder/modules/renderers/drawTexture";
import {
  defineTextureInputRegion,
  drawTextureFace,
  drawTextureFaceWithTransform,
  type DefineTextureInputRegionOptions,
  getFaceTextures as getTextureFaceTextures,
  getSelectedTextureInputCrop,
  getTopTextureFaceCrop,
  type FaceTextureTransform,
} from "../_common/plugins/texturePicker/face";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { currentBlockTextureId } from "./constants";

export type { FaceTextureTransform };

export function defineInputRegion(
  generator: Generator,
  faceId: string,
  region: Region,
  options: DefineTextureInputRegionOptions = {}
) {
  defineTextureInputRegion(
    generator,
    currentBlockTextureId,
    faceId,
    region,
    options
  );
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

export function getFaceTextures(
  generator: Generator,
  faceId: string
): SelectedTexture[] {
  return getTextureFaceTextures(generator, faceId);
}
