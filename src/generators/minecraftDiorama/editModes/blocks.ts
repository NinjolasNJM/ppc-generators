import type { Generator } from "@genroot/builder/modules/generator";
import * as Face from "../../_common/plugins/texturePicker/face";
import {
  drawRectangleButton,
  getSourceForFace,
  makeBlockRegions,
  type DioramaOptions,
} from "./shared";

export function drawBlocks(generator: Generator, options: DioramaOptions) {
  const regions = makeBlockRegions(options);

  regions.forEach(({ id: faceId, region }) => {
    const source = getSourceForFace(options.document, faceId);

    if (options.editMode === "Blocks") {
      if (options.showEditRegions) {
        drawRectangleButton(generator, region);
      }
      Face.defineInputRegion(generator, faceId, region);
    }

    Face.drawFace(generator, faceId, source, region);
  });
}
