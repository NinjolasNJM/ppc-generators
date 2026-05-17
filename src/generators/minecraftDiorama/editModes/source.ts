import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import {
  drawRectangleButton,
  getFaceId,
  makeBlockRegions,
  setDioramaDocument,
  type DioramaOptions,
} from "./shared";

type SourceRegionDef = {
  region: Region;
  faceIds: string[];
};

export function getCurrentSource(generator: Generator): Region {
  const x = generator.defineAndGetRangeInput("Source X", {
    min: 0,
    max: 16,
    value: 0,
    step: 0.5,
    showValue: true,
  });
  const y = generator.defineAndGetRangeInput("Source Y", {
    min: 0,
    max: 16,
    value: 0,
    step: 0.5,
    showValue: true,
  });
  const width = generator.defineAndGetRangeInput("Source Width", {
    min: 0.5,
    max: 16,
    value: 16,
    step: 0.5,
    showValue: true,
  });
  const height = generator.defineAndGetRangeInput("Source Height", {
    min: 0.5,
    max: 16,
    value: 16,
    step: 0.5,
    showValue: true,
  });

  const clampedX = Math.min(x, 15.5);
  const clampedY = Math.min(y, 15.5);

  return [
    clampedX,
    clampedY,
    Math.max(0.5, Math.min(width, 16 - clampedX)),
    Math.max(0.5, Math.min(height, 16 - clampedY)),
  ];
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
    const region = blockRegions.get(getFaceId(column, 0));
    if (!region) {
      continue;
    }
    const [x, y, width, height] = region;
    const regionHeight = height / 4;

    regions.push({
      region: [
        x,
        y >= regionHeight ? y - regionHeight : y,
        width,
        regionHeight,
      ],
      faceIds: Array.from({ length: options.rows }, (_, row) =>
        getFaceId(column, row)
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
    const region = blockRegions.get(getFaceId(0, row));
    if (!region) {
      continue;
    }
    const [x, y, width, height] = region;
    const regionWidth = width / 4;

    regions.push({
      region: [x >= regionWidth ? x - regionWidth : x, y, regionWidth, height],
      faceIds: Array.from({ length: options.columns }, (_, column) =>
        getFaceId(column, row)
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
