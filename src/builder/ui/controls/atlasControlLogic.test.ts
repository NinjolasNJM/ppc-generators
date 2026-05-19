import { describe, expect, it } from "vitest";
import { packAtlasImages } from "./atlasControlLogic";

describe("packAtlasImages", () => {
  it("packs multiple same-size images into a single row when possible", () => {
    const atlas = packAtlasImages(
      [
        { name: "first", width: 16, height: 16 },
        { name: "second", width: 16, height: 16 },
      ],
      16,
      16
    );

    expect(atlas).toEqual({
      atlasWidth: 32,
      atlasHeight: 16,
      frames: [
        {
          id: "first",
          name: "first",
          rectangle: [0, 0, 16, 16],
          frameIndex: 0,
          frameCount: 1,
        },
        {
          id: "second",
          name: "second",
          rectangle: [16, 0, 16, 16],
          frameIndex: 0,
          frameCount: 1,
        },
      ],
    });
  });

  it("wraps when the current row is full and preserves image sizes", () => {
    const atlas = packAtlasImages(
      [
        { name: "wide", width: 20, height: 10 },
        { name: "tall", width: 12, height: 12 },
        { name: "third", width: 16, height: 8 },
      ],
      16,
      16
    );

    expect(atlas).toEqual({
      atlasWidth: 32,
      atlasHeight: 20,
      frames: [
        {
          id: "wide",
          name: "wide",
          rectangle: [0, 0, 20, 10],
          frameIndex: 0,
          frameCount: 1,
        },
        {
          id: "tall",
          name: "tall",
          rectangle: [20, 0, 12, 12],
          frameIndex: 0,
          frameCount: 1,
        },
        {
          id: "third",
          name: "third",
          rectangle: [0, 12, 16, 8],
          frameIndex: 0,
          frameCount: 1,
        },
      ],
    });
  });

  it("uses the widest image when estimating atlas width", () => {
    const atlas = packAtlasImages(
      [
        { name: "wide", width: 48, height: 16 },
        { name: "small", width: 16, height: 16 },
      ],
      16,
      16
    );

    expect(atlas.atlasWidth).toBe(48);
    expect(atlas.frames[0]).toEqual({
      id: "wide",
      name: "wide",
      rectangle: [0, 0, 48, 16],
      frameIndex: 0,
      frameCount: 1,
    });
    expect(atlas.frames[1]).toEqual({
      id: "small",
      name: "small",
      rectangle: [0, 16, 16, 16],
      frameIndex: 0,
      frameCount: 1,
    });
  });

  it("keeps duplicate file names stable by making frame ids unique", () => {
    const atlas = packAtlasImages(
      [
        { name: "shared", width: 16, height: 16 },
        { name: "shared", width: 16, height: 16 },
        { name: "shared", width: 16, height: 16 },
      ],
      16,
      16
    );

    expect(atlas.frames.map((frame) => frame.id)).toEqual([
      "shared",
      "shared_1",
      "shared_2",
    ]);
    expect(atlas.frames.map((frame) => frame.name)).toEqual([
      "shared",
      "shared",
      "shared",
    ]);
  });

  it("rejects empty image lists", () => {
    expect(() => packAtlasImages([], 16, 16)).toThrow(
      "No images to pack into atlas"
    );
  });
});
