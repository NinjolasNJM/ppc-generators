import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";

export type EditMode = "Blocks" | "Tabs" | "Folds" | "Source" | "Destination";

export type DestinationSize = {
  width: number;
  height: number;
};

export type DioramaDocument = {
  sources: Record<string, Region>;
  destinationColumns: Record<string, number>;
  destinationRows: Record<string, number>;
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
  currentDestination: DestinationSize;
};

export type RegionDef = {
  id: string;
  region: Region;
  rotation: 0 | 1 | 2 | 3;
};

const dioramaDocumentInputId = "DioramaDocument";

export const defaultSource: Region = [0, 0, 16, 16];
export const defaultDestination: DestinationSize = { width: 16, height: 16 };

export function getFaceId(column: number, row: number): string {
  return `BlockFace${column} ${row}`;
}

function encodeDioramaDocument(document: DioramaDocument): string {
  return JSON.stringify(document);
}

function decodeDioramaDocument(json: string | null): DioramaDocument {
  if (!json) {
    return { sources: {}, destinationColumns: {}, destinationRows: {} };
  }

  try {
    const parsed = JSON.parse(json) as Partial<DioramaDocument>;
    return {
      sources: parsed.sources ?? {},
      destinationColumns: parsed.destinationColumns ?? {},
      destinationRows: parsed.destinationRows ?? {},
    };
  } catch {
    return { sources: {}, destinationColumns: {}, destinationRows: {} };
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
  document,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];
  const columnWidths = makeColumnWidths({ width, columns, document });
  const rowHeights = makeRowHeights({ height, rows, document });
  const columnOffsets = makeOffsets(columnWidths);
  const rowOffsets = makeOffsets(rowHeights);

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const columnOffset = columnOffsets[column] ?? 0;
      const rowOffset = rowOffsets[row] ?? 0;
      const columnWidth = columnWidths[column] ?? width;
      const rowHeight = rowHeights[row] ?? height;

      regions.push({
        id: getFaceId(column, row),
        region: [ox + columnOffset, oy + rowOffset, columnWidth, rowHeight],
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
  document,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];
  const columnWidths = makeColumnWidths({ width, columns, document });
  const rowHeights = makeRowHeights({ height, rows, document });
  const columnOffsets = makeOffsets(columnWidths);
  const rowOffsets = makeOffsets(rowHeights);
  const getColumnSize = (column: number) =>
    columnWidths[Math.max(0, Math.min(columns - 1, column))] ?? width;
  const getRowSize = (row: number) =>
    rowHeights[Math.max(0, Math.min(rows - 1, row))] ?? height;
  const getColumnOffset = (column: number) => {
    if (column < 0) {
      return -getColumnSize(column);
    }
    if (column >= columns) {
      return getTotalSize(columnWidths);
    }
    return columnOffsets[column] ?? 0;
  };
  const getRowOffset = (row: number) => {
    if (row < 0) {
      return -getRowSize(row);
    }
    if (row >= rows) {
      return getTotalSize(rowHeights);
    }
    return rowOffsets[row] ?? 0;
  };

  const makeNorth = (column: number, row: number): RegionDef => ({
    id: `North${column} ${row}`,
    region: [
      ox + getColumnOffset(column),
      oy + getRowOffset(row),
      getColumnSize(column),
      getRowSize(row) / 4,
    ],
    rotation: 2,
  });
  const makeSouth = (column: number, row: number): RegionDef => ({
    id: `South${column} ${row}`,
    region: [
      ox + getColumnOffset(column),
      oy + getRowOffset(row) + (getRowSize(row) * 3) / 4,
      getColumnSize(column),
      getRowSize(row) / 4,
    ],
    rotation: 0,
  });
  const makeEast = (column: number, row: number): RegionDef => ({
    id: `East${column} ${row}`,
    region: [
      ox + getColumnOffset(column),
      oy + getRowOffset(row),
      getColumnSize(column) / 4,
      getRowSize(row),
    ],
    rotation: 1,
  });
  const makeWest = (column: number, row: number): RegionDef => ({
    id: `West${column} ${row}`,
    region: [
      ox + getColumnOffset(column) + (getColumnSize(column) * 3) / 4,
      oy + getRowOffset(row),
      getColumnSize(column) / 4,
      getRowSize(row),
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

export function getColumnWidth(
  options: Pick<DioramaOptions, "width" | "document">,
  column: number
): number {
  return makeDestinationPixels(
    options.width,
    options.document.destinationColumns[column] ?? defaultDestination.width
  );
}

export function getRowHeight(
  options: Pick<DioramaOptions, "height" | "document">,
  row: number
): number {
  return makeDestinationPixels(
    options.height,
    options.document.destinationRows[row] ?? defaultDestination.height
  );
}

function makeColumnWidths({
  width,
  columns,
  document,
}: Pick<DioramaOptions, "width" | "columns" | "document">): number[] {
  return Array.from({ length: columns }, (_, column) =>
    getColumnWidth({ width, document }, column)
  );
}

function makeRowHeights({
  height,
  rows,
  document,
}: Pick<DioramaOptions, "height" | "rows" | "document">): number[] {
  return Array.from({ length: rows }, (_, row) =>
    getRowHeight({ height, document }, row)
  );
}

function makeDestinationPixels(baseSize: number, destinationSize: number) {
  return Math.max(1, Math.round((baseSize * destinationSize) / 16));
}

function makeOffsets(sizes: number[]): number[] {
  const offsets: number[] = [];
  let offset = 0;
  sizes.forEach((size) => {
    offsets.push(offset);
    offset += size;
  });
  return offsets;
}

function getTotalSize(sizes: number[]): number {
  return sizes.reduce((total, size) => total + size, 0);
}
