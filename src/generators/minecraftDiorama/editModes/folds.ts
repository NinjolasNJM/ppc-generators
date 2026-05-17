import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import {
  drawRectangleButton,
  makeEdgeRegions,
  type DioramaOptions,
  type RegionDef,
} from "./shared";

export function drawFolds(generator: Generator, options: DioramaOptions) {
  const regions = makeEdgeRegions(options);

  regions.forEach(({ id, region, rotation }) => {
    const foldId = `Folds${id}`;
    const isFoldEnabled = generator.getBooleanInputValue(foldId) ?? false;

    if (options.editMode === "Folds") {
      if (options.showEditRegions) {
        drawRectangleButton(generator, region);
      }
      generator.defineRegionInput(region, () => {
        generator.setBooleanInputValue(foldId, !isFoldEnabled);
      });
    }

    if (isFoldEnabled) {
      drawFoldLine(generator, region, rotation);
    }
  });
}

function drawFoldLine(
  generator: Generator,
  [x, y, width, height]: Region,
  rotation: RegionDef["rotation"]
) {
  switch (rotation) {
    case 0:
      generator.drawFoldLine([x, y + height - 1], [x + width, y + height - 1]);
      break;
    case 1:
      generator.drawFoldLine([x, y], [x, y + height]);
      break;
    case 2:
      generator.drawFoldLine([x, y], [x + width, y]);
      break;
    case 3:
      generator.drawFoldLine([x + width - 1, y], [x + width - 1, y + height]);
      break;
  }
}
