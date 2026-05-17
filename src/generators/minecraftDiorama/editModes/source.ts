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
    step: 1,
    showValue: true,
  });
  const y = generator.defineAndGetRangeInput("Source Y", {
    min: 0,
    max: 16,
    value: 0,
    step: 1,
    showValue: true,
  });
  const width = generator.defineAndGetRangeInput("Source Width", {
    min: 0,
    max: 16,
    value: 16,
    step: 1,
    showValue: true,
  });
  const height = generator.defineAndGetRangeInput("Source Height", {
    min: 0,
    max: 16,
    value: 16,
    step: 1,
    showValue: true,
  });

  return [x, y, Math.min(width, 16 - x), Math.min(height, 16 - y)];
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

function makeColumnSourceRegions({
  ox,
  oy,
  width,
  height,
  columns,
  rows,
}: DioramaOptions): SourceRegionDef[] {
  const regionHeight = height / 4;
  const y = oy >= regionHeight ? oy - regionHeight : oy;
  const regions: SourceRegionDef[] = [];

  for (let column = 0; column < columns; column += 1) {
    regions.push({
      region: [ox + width * column, y, width, regionHeight],
      faceIds: Array.from({ length: rows }, (_, row) => getFaceId(column, row)),
    });
  }

  return regions;
}

function makeRowSourceRegions({
  ox,
  oy,
  width,
  height,
  columns,
  rows,
}: DioramaOptions): SourceRegionDef[] {
  const regionWidth = width / 4;
  const x = ox >= regionWidth ? ox - regionWidth : ox;
  const regions: SourceRegionDef[] = [];

  for (let row = 0; row < rows; row += 1) {
    regions.push({
      region: [x, oy + height * row, regionWidth, height],
      faceIds: Array.from({ length: columns }, (_, column) =>
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
