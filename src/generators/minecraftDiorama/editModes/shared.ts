import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import { type Flip } from "@genroot/builder/modules/renderers/drawTexture";

export type EditMode =
  | "Blocks"
  | "Tabs"
  | "Folds"
  | "Source"
  | "Destination"
  | "Transform";

export type DestinationSize = {
  width: number;
  height: number;
};

export type FaceRotation = 0 | 90 | 180 | 270;

export type FaceTransform = {
  rotate: FaceRotation;
  flip: Flip;
};

export type BlockPreset = "Full Blocks" | "Quarter Blocks";

export type DioramaDocument = {
  preset: BlockPreset;
  sources: Record<string, Region>;
  destinationColumns: Record<string, number>;
  destinationRows: Record<string, number>;
  transforms: Record<string, FaceTransform>;
};

export type DioramaOptions = {
  ox: number;
  oy: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
  worldColumnOffset: number;
  worldRowOffset: number;
  editMode: EditMode | string | null;
  showEditRegions: boolean;
  document: DioramaDocument;
  currentSource: Region;
  currentDestination: DestinationSize;
  currentTransform: FaceTransform;
};

export type RegionDef = {
  id: string;
  region: Region;
  rotation: 0 | 1 | 2 | 3;
};

const dioramaDocumentInputId = "DioramaDocument";

export const defaultSource: Region = [0, 0, 16, 16];
export const defaultDestination: DestinationSize = { width: 16, height: 16 };
export const defaultTransform: FaceTransform = { rotate: 0, flip: "None" };
export const defaultPreset: BlockPreset = "Full Blocks";
export const blockPresets: BlockPreset[] = ["Full Blocks", "Quarter Blocks"];
const maxEdgeRegionThickness = (16 * 800) / 100 / 4;
const minimumSourceSize = 0.5;

export function getFaceId(column: number, row: number): string {
  return `BlockFace${column} ${row}`;
}

function encodeDioramaDocument(document: DioramaDocument): string {
  return JSON.stringify(document);
}

function decodeDioramaDocument(json: string | null): DioramaDocument {
  if (!json) {
    return makeEmptyDioramaDocument();
  }

  try {
    const parsed = JSON.parse(json) as Partial<DioramaDocument>;
    const preset = sanitizePreset(parsed.preset);
    return {
      preset,
      sources: sanitizeSources(parsed.sources),
      destinationColumns: sanitizeDestinations(
        parsed.destinationColumns,
        getDefaultDestinationForPreset(preset).width
      ),
      destinationRows: sanitizeDestinations(
        parsed.destinationRows,
        getDefaultDestinationForPreset(preset).height
      ),
      transforms: sanitizeTransforms(parsed.transforms),
    };
  } catch {
    return makeEmptyDioramaDocument();
  }
}

export function makeEmptyDioramaDocument(
  preset: BlockPreset = defaultPreset
): DioramaDocument {
  return {
    preset,
    sources: {},
    destinationColumns: {},
    destinationRows: {},
    transforms: {},
  };
}

export function sanitizePreset(preset: unknown): BlockPreset {
  return preset === "Quarter Blocks" ? "Quarter Blocks" : defaultPreset;
}

function sanitizeSources(
  sources: Partial<DioramaDocument>["sources"]
): DioramaDocument["sources"] {
  return Object.fromEntries(
    Object.entries(sources ?? {}).map(([id, source]) => [
      id,
      sanitizeSource(Array.isArray(source) ? source : defaultSource),
    ])
  );
}

export function sanitizeSource([x, y, width, height]: Region): Region {
  const sourceX = sanitizeNumber(x, defaultSource[0]);
  const sourceY = sanitizeNumber(y, defaultSource[1]);
  const sourceWidth = sanitizeNumber(width, defaultSource[2]);
  const sourceHeight = sanitizeNumber(height, defaultSource[3]);
  const clampedX = Math.max(0, Math.min(15.5, roundToHalf(sourceX)));
  const clampedY = Math.max(0, Math.min(15.5, roundToHalf(sourceY)));

  return [
    clampedX,
    clampedY,
    Math.max(
      minimumSourceSize,
      Math.min(roundToHalf(sourceWidth), 16 - clampedX)
    ),
    Math.max(
      minimumSourceSize,
      Math.min(roundToHalf(sourceHeight), 16 - clampedY)
    ),
  ];
}

function sanitizeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function sanitizeDestinations(
  destinations:
    | Partial<DioramaDocument>["destinationColumns"]
    | Partial<DioramaDocument>["destinationRows"],
  defaultValue: number
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(destinations ?? {})
      .map(([id, destination]) => [
        id,
        Math.max(1, Math.round(sanitizeNumber(destination, 16))),
      ])
      .filter(([, destination]) => destination !== defaultValue)
  );
}

function sanitizeTransforms(
  transforms: Partial<DioramaDocument>["transforms"]
): DioramaDocument["transforms"] {
  return Object.fromEntries(
    Object.entries(transforms ?? {})
      .map(
        ([id, transform]): [string, FaceTransform] => [
          id,
          sanitizeTransform(transform),
        ]
      )
      .filter(([, transform]) => !isDefaultTransform(transform))
  );
}

function sanitizeTransform(transform: unknown): FaceTransform {
  if (!transform || typeof transform !== "object") {
    return defaultTransform;
  }

  const candidate = transform as Partial<FaceTransform>;
  return {
    rotate: sanitizeFaceRotation(candidate.rotate),
    flip: sanitizeFlip(candidate.flip),
  };
}

function sanitizeFaceRotation(rotation: unknown): FaceRotation {
  switch (rotation) {
    case 90:
      return 90;
    case 180:
      return 180;
    case 270:
      return 270;
    case 0:
    default:
      return 0;
  }
}

function sanitizeFlip(flip: unknown): Flip {
  switch (flip) {
    case "Horizontal":
      return "Horizontal";
    case "Vertical":
      return "Vertical";
    case "None":
    default:
      return "None";
  }
}

export function isDefaultTransform(transform: FaceTransform): boolean {
  return (
    transform.rotate === defaultTransform.rotate &&
    transform.flip === defaultTransform.flip
  );
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
  worldColumnOffset,
  worldRowOffset,
  document,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];
  const columnWidths = makeColumnWidths({
    width,
    columns,
    worldColumnOffset,
    document,
  });
  const rowHeights = makeRowHeights({
    height,
    rows,
    worldRowOffset,
    document,
  });
  const columnOffsets = makeOffsets(columnWidths);
  const rowOffsets = makeOffsets(rowHeights);

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const columnOffset = columnOffsets[column] ?? 0;
      const rowOffset = rowOffsets[row] ?? 0;
      const columnWidth = columnWidths[column] ?? width;
      const rowHeight = rowHeights[row] ?? height;

      regions.push({
        id: getFaceId(column + worldColumnOffset, row + worldRowOffset),
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
  worldColumnOffset,
  worldRowOffset,
  document,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];
  const columnWidths = makeColumnWidths({
    width,
    columns,
    worldColumnOffset,
    document,
  });
  const rowHeights = makeRowHeights({
    height,
    rows,
    worldRowOffset,
    document,
  });
  const columnOffsets = makeOffsets(columnWidths);
  const rowOffsets = makeOffsets(rowHeights);
  const getColumnSize = (column: number) =>
    columnWidths[Math.max(0, Math.min(columns - 1, column))] ?? width;
  const getRowSize = (row: number) =>
    rowHeights[Math.max(0, Math.min(rows - 1, row))] ?? height;
  const getTabWidth = (column: number) =>
    getEdgeTabThickness(width, getColumnSize(column));
  const getTabHeight = (row: number) =>
    getEdgeTabThickness(height, getRowSize(row));
  const getColumnOffset = (column: number) => {
    if (column < 0) {
      return -getTabWidth(column);
    }
    if (column >= columns) {
      return getTotalSize(columnWidths);
    }
    return columnOffsets[column] ?? 0;
  };
  const getRowOffset = (row: number) => {
    if (row < 0) {
      return -getTabHeight(row);
    }
    if (row >= rows) {
      return getTotalSize(rowHeights);
    }
    return rowOffsets[row] ?? 0;
  };

  const makeNorth = (column: number, row: number): RegionDef => ({
    id: `North${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      ox + getColumnOffset(column),
      oy + getRowOffset(row),
      getColumnSize(column),
      getTabHeight(row),
    ],
    rotation: 2,
  });
  const makeSouth = (column: number, row: number): RegionDef => ({
    id: `South${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      ox + getColumnOffset(column),
      row < 0
        ? oy - getTabHeight(row)
        : oy + getRowOffset(row) + getRowSize(row) - getTabHeight(row),
      getColumnSize(column),
      getTabHeight(row),
    ],
    rotation: 0,
  });
  const makeEast = (column: number, row: number): RegionDef => ({
    id: `East${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      ox + getColumnOffset(column),
      oy + getRowOffset(row),
      getTabWidth(column),
      getRowSize(row),
    ],
    rotation: 1,
  });
  const makeWest = (column: number, row: number): RegionDef => ({
    id: `West${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      column < 0
        ? ox - getTabWidth(column)
        : ox +
          getColumnOffset(column) +
          getColumnSize(column) -
          getTabWidth(column),
      oy + getRowOffset(row),
      getTabWidth(column),
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

export function makeEdgeControlRegions({
  ox,
  oy,
  width,
  height,
  columns,
  rows,
  worldColumnOffset,
  worldRowOffset,
  document,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];
  const columnWidths = makeColumnWidths({
    width,
    columns,
    worldColumnOffset,
    document,
  });
  const rowHeights = makeRowHeights({
    height,
    rows,
    worldRowOffset,
    document,
  });
  const columnOffsets = makeOffsets(columnWidths);
  const rowOffsets = makeOffsets(rowHeights);
  const getColumnSize = (column: number) =>
    columnWidths[Math.max(0, Math.min(columns - 1, column))] ?? width;
  const getRowSize = (row: number) =>
    rowHeights[Math.max(0, Math.min(rows - 1, row))] ?? height;
  const getTabWidth = (column: number) =>
    getEdgeControlThickness(getColumnSize(column));
  const getTabHeight = (row: number) =>
    getEdgeControlThickness(getRowSize(row));
  const getColumnOffset = (column: number) => {
    if (column < 0) {
      return -getTabWidth(column);
    }
    if (column >= columns) {
      return getTotalSize(columnWidths);
    }
    return columnOffsets[column] ?? 0;
  };
  const getRowOffset = (row: number) => {
    if (row < 0) {
      return -getTabHeight(row);
    }
    if (row >= rows) {
      return getTotalSize(rowHeights);
    }
    return rowOffsets[row] ?? 0;
  };

  const makeNorth = (column: number, row: number): RegionDef => ({
    id: `North${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      ox + getColumnOffset(column),
      oy + getRowOffset(row),
      getColumnSize(column),
      getTabHeight(row),
    ],
    rotation: 2,
  });
  const makeSouth = (column: number, row: number): RegionDef => ({
    id: `South${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      ox + getColumnOffset(column),
      row < 0
        ? oy - getTabHeight(row)
        : oy + getRowOffset(row) + getRowSize(row) - getTabHeight(row),
      getColumnSize(column),
      getTabHeight(row),
    ],
    rotation: 0,
  });
  const makeEast = (column: number, row: number): RegionDef => ({
    id: `East${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      ox + getColumnOffset(column),
      oy + getRowOffset(row),
      getTabWidth(column),
      getRowSize(row),
    ],
    rotation: 1,
  });
  const makeWest = (column: number, row: number): RegionDef => ({
    id: `West${column + worldColumnOffset} ${row + worldRowOffset}`,
    region: [
      column < 0
        ? ox - getTabWidth(column)
        : ox +
          getColumnOffset(column) +
          getColumnSize(column) -
          getTabWidth(column),
      oy + getRowOffset(row),
      getTabWidth(column),
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
    lineDash: [2, 2],
    lineDashOffset: 3,
    width: 1,
  });
}

export function getEdgeControlThickness(faceSize: number): number {
  return Math.min(faceSize / 4, maxEdgeRegionThickness);
}

function getEdgeTabThickness(baseSize: number, faceSize: number): number {
  const minimumSourcePixelThickness = baseSize / 16;
  return Math.max(
    minimumSourcePixelThickness,
    Math.min(baseSize / 4, maxEdgeRegionThickness, faceSize / 2)
  );
}

export function getColumnWidth(
  options: Pick<DioramaOptions, "width" | "document">,
  column: number
): number {
  return makeDestinationPixels(
    options.width,
    options.document.destinationColumns[column] ??
      getDefaultDestinationForPreset(options.document.preset).width
  );
}

export function getRowHeight(
  options: Pick<DioramaOptions, "height" | "document">,
  row: number
): number {
  return makeDestinationPixels(
    options.height,
    options.document.destinationRows[row] ??
      getDefaultDestinationForPreset(options.document.preset).height
  );
}

export function getSourceForFace(
  document: DioramaDocument,
  faceId: string
): Region {
  return document.sources[faceId] ?? getDefaultSourceForFace(document, faceId);
}

export function getTransformForFace(
  document: DioramaDocument,
  faceId: string
): FaceTransform {
  return document.transforms[faceId] ?? defaultTransform;
}

export function getDefaultDestinationForPreset(
  preset: BlockPreset
): DestinationSize {
  return preset === "Quarter Blocks"
    ? { width: 8, height: 8 }
    : defaultDestination;
}

function getDefaultSourceForFace(
  document: DioramaDocument,
  faceId: string
): Region {
  if (document.preset !== "Quarter Blocks") {
    return defaultSource;
  }

  const position = getFacePosition(faceId);
  if (!position) {
    return defaultSource;
  }

  return [(position.column % 2) * 8, (position.row % 2) * 8, 8, 8];
}

function getFacePosition(
  faceId: string
): { column: number; row: number } | null {
  const match = /^BlockFace(\d+) (\d+)$/.exec(faceId);
  if (!match) {
    return null;
  }

  return {
    column: parseInt(match[1] ?? "0", 10),
    row: parseInt(match[2] ?? "0", 10),
  };
}

export function getColumnCountThatFits({
  baseWidth,
  width,
  document,
}: Pick<DioramaOptions, "width" | "document"> & {
  baseWidth: number;
}): number {
  return getCountThatFits(baseWidth, (column) =>
    getColumnWidth({ width, document }, column)
  );
}

export function getRowCountThatFits({
  baseHeight,
  height,
  document,
}: Pick<DioramaOptions, "height" | "document"> & {
  baseHeight: number;
}): number {
  return getCountThatFits(baseHeight, (row) =>
    getRowHeight({ height, document }, row)
  );
}

function makeColumnWidths({
  width,
  columns,
  worldColumnOffset = 0,
  document,
}: Pick<DioramaOptions, "width" | "columns" | "document"> & {
  worldColumnOffset?: number;
}): number[] {
  return Array.from({ length: columns }, (_, column) =>
    getColumnWidth({ width, document }, column + worldColumnOffset)
  );
}

function makeRowHeights({
  height,
  rows,
  worldRowOffset = 0,
  document,
}: Pick<DioramaOptions, "height" | "rows" | "document"> & {
  worldRowOffset?: number;
}): number[] {
  return Array.from({ length: rows }, (_, row) =>
    getRowHeight({ height, document }, row + worldRowOffset)
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

function getCountThatFits(
  availableSize: number,
  getSize: (index: number) => number
): number {
  let count = 0;
  let usedSize = 0;

  while (usedSize < availableSize) {
    const nextSize = getSize(count);
    if (usedSize + nextSize > availableSize) {
      break;
    }
    usedSize += nextSize;
    count += 1;
  }

  return Math.max(1, count);
}
