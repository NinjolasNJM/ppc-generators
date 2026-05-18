import type { Generator } from "@genroot/builder/modules/generator";
import * as Face from "../../minecraftBlock/face";
import {
  drawRectangleButton,
  getSourceForFace,
  getTransformForFace,
  makeBlockRegions,
  type DioramaOptions,
} from "./shared";

export function drawBlocks(generator: Generator, options: DioramaOptions) {
  const regions = makeBlockRegions(options);

  regions.forEach(({ id: faceId, region }) => {
    const source = getSourceForFace(options.document, faceId);
    const transform = getTransformForFace(options.document, faceId);

    if (options.editMode === "Blocks") {
      if (options.showEditRegions) {
        drawRectangleButton(generator, region);
      }
      Face.defineInputRegion(generator, faceId, region);
    }

    Face.drawFaceWithTextureTransform(
      generator,
      faceId,
      source,
      region,
      transform
    );
  });
}
