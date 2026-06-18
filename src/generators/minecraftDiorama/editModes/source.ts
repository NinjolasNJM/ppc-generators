import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import {
  drawRectangleButton,
  getEdgeControlThickness,
  getFaceId,
  makeBlockRegions,
  setDioramaDocument,
  type DioramaOptions,
} from "./shared";

type SourceRegionDef = {
  region: Region;
  faceIds: string[];
};

const minimumSourceSize = 0.5;
const sourceSize = 16;

export function clampSourceToBounds(
  [x, y, width, height]: Region
): Region {
  const clampedX = Math.max(
    0,
    Math.min(x, sourceSize - minimumSourceSize)
  );
  const clampedY = Math.max(
    0,
    Math.min(y, sourceSize - minimumSourceSize)
  );

  return [
    clampedX,
    clampedY,
    Math.max(
      minimumSourceSize,
      Math.min(width, sourceSize - clampedX)
    ),
    Math.max(
      minimumSourceSize,
      Math.min(height, sourceSize - clampedY)
    ),
  ];
}

export function getCurrentSource(generator: Generator): Region {
  const x = generator.defineAndGetRangeInput("Source X", {
    min: 0,
    max: sourceSize,
    value: 0,
    step: 0.5,
    showValue: true,
  });
  const y = generator.defineAndGetRangeInput("Source Y", {
    min: 0,
    max: sourceSize,
    value: 0,
    step: 0.5,
    showValue: true,
  });
  const width = generator.defineAndGetRangeInput("Source Width", {
    min: minimumSourceSize,
    max: sourceSize,
    value: 16,
    step: 0.5,
    showValue: true,
  });
  const height = generator.defineAndGetRangeInput("Source Height", {
    min: minimumSourceSize,
    max: sourceSize,
    value: 16,
    step: 0.5,
    showValue: true,
  });

  return clampSourceToBounds([x, y, width, height]);
}

export function drawSourceRegions(
  generator: Generator,
  options: DioramaOptions
) {
  if (options.editMode !== "Source") {
    return;
  }

  const regions = [
    ...makeFaceSourceRegions(options),
    ...makeColumnSourceRegions(options),
    ...makeRowSourceRegions(options),
  ];

  regions.forEach(({ region, faceIds }) => {
    if (options.showEditRegions) {
      drawRectangleButton(generator, region);
    }
    generator.defineRegionInput(region, () => {
      setSourceForFaces(generator, options, faceIds);
    });
  });
}

function makeFaceSourceRegions(options: DioramaOptions): SourceRegionDef[] {
  return makeBlockRegions(options).map(({ id, region }) => ({
    region,
    faceIds: [id],
  }));
}

function makeColumnSourceRegions(options: DioramaOptions): SourceRegionDef[] {
  const blockRegions = new Map(
    makeBlockRegions(options).map(({ id, region }) => [id, region])
  );
  const regions: SourceRegionDef[] = [];

  for (let column = 0; column < options.columns; column += 1) {
    const worldColumn = column + options.worldColumnOffset;
    const region = blockRegions.get(
      getFaceId(worldColumn, options.worldRowOffset)
    );
    if (!region) {
      continue;
    }
    const [x, y, width, height] = region;
    const regionHeight = getEdgeControlThickness(height);

    regions.push({
      region: [
        x,
        y >= regionHeight ? y - regionHeight : y,
        width,
        regionHeight,
      ],
      faceIds: Array.from({ length: options.rows }, (_, row) =>
        getFaceId(worldColumn, row + options.worldRowOffset)
      ),
    });
  }

  return regions;
}

function makeRowSourceRegions(options: DioramaOptions): SourceRegionDef[] {
  const blockRegions = new Map(
    makeBlockRegions(options).map(({ id, region }) => [id, region])
  );
  const regions: SourceRegionDef[] = [];

  for (let row = 0; row < options.rows; row += 1) {
    const worldRow = row + options.worldRowOffset;
    const region = blockRegions.get(
      getFaceId(options.worldColumnOffset, worldRow)
    );
    if (!region) {
      continue;
    }
    const [x, y, width, height] = region;
    const regionWidth = getEdgeControlThickness(width);

    regions.push({
      region: [x >= regionWidth ? x - regionWidth : x, y, regionWidth, height],
      faceIds: Array.from({ length: options.columns }, (_, column) =>
        getFaceId(column + options.worldColumnOffset, worldRow)
      ),
    });
  }

  return regions;
}

function setSourceForFaces(
  generator: Generator,
  options: DioramaOptions,
  faceIds: string[]
) {
  setDioramaDocument(generator, {
    ...options.document,
    sources: {
      ...options.document.sources,
      ...Object.fromEntries(
        faceIds.map((faceId) => [faceId, options.currentSource])
      ),
    },
  });
}
