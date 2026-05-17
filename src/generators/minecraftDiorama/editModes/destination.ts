import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import {
  defaultDestination,
  drawRectangleButton,
  getFaceId,
  makeBlockRegions,
  setDioramaDocument,
  type DestinationSize,
  type DioramaOptions,
} from "./shared";

type DestinationRegionDef = {
  region: Region;
  column: number | null;
  row: number | null;
};

export function getCurrentDestination(generator: Generator): DestinationSize {
  const width = generator.defineAndGetRangeInput("Destination Width", {
    min: 1,
    max: 32,
    value: defaultDestination.width,
    step: 1,
    showValue: true,
  });
  const height = generator.defineAndGetRangeInput("Destination Height", {
    min: 1,
    max: 32,
    value: defaultDestination.height,
    step: 1,
    showValue: true,
  });

  return { width, height };
}

export function drawDestinationRegions(
  generator: Generator,
  options: DioramaOptions
) {
  if (options.editMode !== "Destination") {
    return;
  }

  const regions = [
    ...makeFaceDestinationRegions(options),
    ...makeColumnDestinationRegions(options),
    ...makeRowDestinationRegions(options),
  ];

  regions.forEach(({ region, column, row }) => {
    if (options.showEditRegions) {
      drawRectangleButton(generator, region);
    }
    generator.defineRegionInput(region, () => {
      setDestination(generator, options, { column, row });
    });
  });
}

function makeFaceDestinationRegions(
  options: DioramaOptions
): DestinationRegionDef[] {
  return makeBlockRegions(options).map(({ id, region }) => ({
    region,
    ...getFacePosition(id),
  }));
}

function makeColumnDestinationRegions(
  options: DioramaOptions
): DestinationRegionDef[] {
  const blockRegions = new Map(
    makeBlockRegions(options).map(({ id, region }) => [id, region])
  );
  const regionHeight = options.height / 4;
  const y = options.oy >= regionHeight ? options.oy - regionHeight : options.oy;
  const regions: DestinationRegionDef[] = [];

  for (let column = 0; column < options.columns; column += 1) {
    const region = blockRegions.get(getFaceId(column, 0));
    if (!region) {
      continue;
    }
    const [x, , width] = region;
    regions.push({
      region: [x, y, width, regionHeight],
      column,
      row: null,
    });
  }

  return regions;
}

function makeRowDestinationRegions(
  options: DioramaOptions
): DestinationRegionDef[] {
  const blockRegions = new Map(
    makeBlockRegions(options).map(({ id, region }) => [id, region])
  );
  const regionWidth = options.width / 4;
  const x = options.ox >= regionWidth ? options.ox - regionWidth : options.ox;
  const regions: DestinationRegionDef[] = [];

  for (let row = 0; row < options.rows; row += 1) {
    const region = blockRegions.get(getFaceId(0, row));
    if (!region) {
      continue;
    }
    const [, y, , height] = region;
    regions.push({
      region: [x, y, regionWidth, height],
      column: null,
      row,
    });
  }

  return regions;
}

function setDestination(
  generator: Generator,
  options: DioramaOptions,
  target: Pick<DestinationRegionDef, "column" | "row">
) {
  const destinationColumns = { ...options.document.destinationColumns };
  const destinationRows = { ...options.document.destinationRows };

  if (target.column !== null) {
    setDestinationValue(
      destinationColumns,
      target.column,
      options.currentDestination.width
    );
  }
  if (target.row !== null) {
    setDestinationValue(
      destinationRows,
      target.row,
      options.currentDestination.height
    );
  }

  setDioramaDocument(generator, {
    ...options.document,
    destinationColumns,
    destinationRows,
  });
}

function setDestinationValue(
  destinations: Record<string, number>,
  index: number,
  value: number
) {
  if (value === defaultDestination.width) {
    delete destinations[index];
  } else {
    destinations[index] = value;
  }
}

function getFacePosition(
  id: string
): Pick<DestinationRegionDef, "column" | "row"> {
  const match = /^BlockFace(\d+) (\d+)$/.exec(id);
  if (!match) {
    return { column: null, row: null };
  }
  return {
    column: parseInt(match[1] ?? "0", 10),
    row: parseInt(match[2] ?? "0", 10),
  };
}
