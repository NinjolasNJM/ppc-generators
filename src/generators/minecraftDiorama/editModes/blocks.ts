import type { Generator } from "@genroot/builder/modules/generator";
import * as Face from "../../_common/plugins/texturePicker/face";
import {
  defaultSource,
  drawRectangleButton,
  makeBlockRegions,
  type DioramaOptions,
} from "./shared";

export function drawBlocks(generator: Generator, options: DioramaOptions) {
  const regions = makeBlockRegions(options);

  regions.forEach(({ id: faceId, region }) => {
    const source = options.document.sources[faceId] ?? defaultSource;

    if (options.editMode === "Blocks") {
      if (options.showEditRegions) {
        drawRectangleButton(generator, region);
      }
      Face.defineInputRegion(generator, faceId, region);
    }

    Face.drawFace(generator, faceId, source, region);
  });
}
