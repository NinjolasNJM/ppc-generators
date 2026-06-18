import { describe, expect, it } from "vitest";
import {
  getColumnCountThatFits,
  makeEdgeControlRegions,
  makeEdgeRegions,
  makeEmptyDioramaDocument,
  sanitizeSource,
  type DioramaOptions,
} from "./shared";

function makeOptions(options: Partial<DioramaOptions> = {}): DioramaOptions {
  return {
    ox: 42,
    oy: 41,
    width: 168,
    height: 168,
    columns: 1,
    rows: 1,
    worldColumnOffset: 0,
    worldRowOffset: 0,
    editMode: "Tabs",
    showEditRegions: false,
    document: makeEmptyDioramaDocument(),
    currentSource: [0, 0, 16, 16],
    currentDestination: { width: 16, height: 16 },
    currentTransform: { rotate: 0, flip: "None" },
    ...options,
  };
}

function findRegion(
  regions: ReturnType<typeof makeEdgeRegions>,
  id: string
): [number, number, number, number] {
  const region = regions.find((candidate) => candidate.id === id)?.region;
  if (!region) {
    throw new Error(`Region not found: ${id}`);
  }
  return region;
}

describe("diorama edit mode shared helpers", () => {
  it("caps actual tab regions at the 800% tab height", () => {
    const regions = makeEdgeRegions(makeOptions());

    expect(findRegion(regions, "North0 0")).toEqual([42, 41, 168, 32]);
    expect(findRegion(regions, "East0 0")).toEqual([42, 41, 32, 168]);
  });

  it("caps edge control regions at the 800% tab height", () => {
    const regions = makeEdgeControlRegions(makeOptions());

    expect(findRegion(regions, "North0 0")).toEqual([42, 41, 168, 32]);
    expect(findRegion(regions, "East0 0")).toEqual([42, 41, 32, 168]);
  });

  it("keeps small destination tabs proportional to their face", () => {
    const document = makeEmptyDioramaDocument();
    document.destinationColumns = { 0: 2 };
    document.destinationRows = { 0: 2 };

    const regions = makeEdgeRegions(
      makeOptions({
        width: 128,
        height: 128,
        document,
      })
    );

    expect(findRegion(regions, "North0 0")).toEqual([42, 41, 16, 8]);
    expect(findRegion(regions, "East0 0")).toEqual([42, 41, 8, 16]);
  });

  it("keeps one-source-pixel destination tabs at least one scaled source pixel thick", () => {
    const document = makeEmptyDioramaDocument();
    document.destinationColumns = { 0: 1 };
    document.destinationRows = { 0: 1 };

    const regions = makeEdgeRegions(
      makeOptions({
        width: 128,
        height: 128,
        document,
      })
    );

    expect(findRegion(regions, "North0 0")).toEqual([42, 41, 8, 8]);
    expect(findRegion(regions, "East0 0")).toEqual([42, 41, 8, 8]);
  });

  it("keeps saved source regions in normalized 16px face units", () => {
    expect(sanitizeSource([16, 0, 16, 16])).toEqual([15.5, 0, 0.5, 16]);
  });

  it("uses world offsets when reading destination sizes", () => {
    const document = makeEmptyDioramaDocument();
    document.destinationColumns = { 2: 8 };
    document.destinationRows = { 3: 8 };

    const regions = makeEdgeRegions(
      makeOptions({
        width: 128,
        height: 128,
        worldColumnOffset: 2,
        worldRowOffset: 3,
        document,
      })
    );

    expect(findRegion(regions, "North2 3")).toEqual([42, 41, 64, 32]);
    expect(findRegion(regions, "East2 3")).toEqual([42, 41, 32, 64]);
  });

  it("counts only full columns that fit the page", () => {
    const document = makeEmptyDioramaDocument();
    document.destinationColumns = { 1: 8 };

    expect(
      getColumnCountThatFits({
        baseWidth: 320,
        width: 128,
        document,
      })
    ).toBe(3);
  });
});
