import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import { type DrawTextureOptions } from "@genroot/builder/modules/renderers/drawTexture";
import {
  defineTextureInputRegion,
  drawTextureFace,
  drawTextureFaceWithTransform,
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
