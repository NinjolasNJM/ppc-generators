import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";

export type EditMode = "Blocks" | "Tabs" | "Folds" | "Source";

export type DioramaDocument = {
  sources: Record<string, Region>;
};

export type DioramaOptions = {
  ox: number;
  oy: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
  editMode: EditMode | string | null;
  showEditRegions: boolean;
  document: DioramaDocument;
  currentSource: Region;
};

export type RegionDef = {
  id: string;
  region: Region;
  rotation: 0 | 1 | 2 | 3;
};

const dioramaDocumentInputId = "DioramaDocument";

export const defaultSource: Region = [0, 0, 16, 16];

export function getFaceId(column: number, row: number): string {
  return `BlockFace${column} ${row}`;
}

function encodeDioramaDocument(document: DioramaDocument): string {
  return JSON.stringify(document);
}

function decodeDioramaDocument(json: string | null): DioramaDocument {
  if (!json) {
    return { sources: {} };
  }

  try {
    const parsed = JSON.parse(json) as Partial<DioramaDocument>;
    return {
      sources: parsed.sources ?? {},
    };
  } catch {
    return { sources: {} };
  }
}

export function getDioramaDocument(generator: Generator): DioramaDocument {
  return decodeDioramaDocument(
    generator.getStringInputValue(dioramaDocumentInputId)
  );
}

export function setDioramaDocument(
  generator: Generator,
  document: DioramaDocument
): void {
  generator.setStringInputValue(
    dioramaDocumentInputId,
    encodeDioramaDocument(document)
  );
}

export function makeBlockRegions({
  ox,
  oy,
  width,
  height,
  columns,
  rows,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      regions.push({
        id: getFaceId(column, row),
        region: [ox + width * column, oy + height * row, width, height],
        rotation: 0,
      });
    }
  }
  return regions;
}

export function makeEdgeRegions({
  ox,
  oy,
  width,
  height,
  columns,
  rows,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];

  const makeNorth = (column: number, row: number): RegionDef => ({
    id: `North${column} ${row}`,
    region: [ox + width * column, oy + height * row, width, height / 4],
    rotation: 2,
  });
  const makeSouth = (column: number, row: number): RegionDef => ({
    id: `South${column} ${row}`,
    region: [
      ox + width * column,
      oy + (height * 3) / 4 + height * row,
      width,
      height / 4,
    ],
    rotation: 0,
  });
  const makeEast = (column: number, row: number): RegionDef => ({
    id: `East${column} ${row}`,
    region: [ox + width * column, oy + height * row, width / 4, height],
    rotation: 1,
  });
  const makeWest = (column: number, row: number): RegionDef => ({
    id: `West${column} ${row}`,
    region: [
      ox + (width * 3) / 4 + width * column,
      oy + height * row,
      width / 4,
      height,
    ],
    rotation: 3,
  });

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      regions.push(
        makeNorth(column, row),
        makeSouth(column, row),
        makeEast(column, row),
        makeWest(column, row)
      );
    }
  }

  for (let column = 0; column < columns; column += 1) {
    regions.push(makeNorth(column, rows), makeSouth(column, -1));
  }
  for (let row = 0; row < rows; row += 1) {
    regions.push(makeEast(columns, row), makeWest(-1, row));
  }

  return regions;
}

export function drawRectangleButton(generator: Generator, region: Region) {
  generator.drawRectangle(region, {
    color: "#2d9cdb",
    lineDash: [3, 3],
    width: 1,
  });
}
