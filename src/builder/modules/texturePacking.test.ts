import { describe, expect, it, vi } from "vitest";
import { packImages } from "./texturePacking";

describe("packImages", () => {
  it("packs by height and preserves crop data", () => {
    const atlas = packImages(
      [
        {
          id: "tall",
          label: "Tall",
          rectangle: [0, 0, 16, 32],
          crop: [1, 2, 14, 28],
          sourceIndex: 0,
        },
        {
          id: "short",
          label: "Short",
          rectangle: [0, 0, 16, 16],
          crop: [3, 4, 10, 11],
          sourceIndex: 1,
        },
      ],
      32
    );

    expect(atlas).toEqual({
      atlasWidth: 32,
      atlasHeight: 32,
      frames: [
        {
          id: "short",
          label: "Short",
          rectangle: [0, 0, 16, 16],
          crop: [3, 4, 10, 11],
        },
        {
          id: "tall",
          label: "Tall",
          rectangle: [16, 0, 16, 32],
          crop: [1, 2, 14, 28],
        },
      ],
    });
  });

  it("skips images that cannot fit the atlas width", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const atlas = packImages(
      [
        {
          id: "too-wide",
          rectangle: [0, 0, 64, 16],
          crop: [0, 0, 64, 16],
          sourceIndex: 0,
        },
        {
          id: "fits",
          rectangle: [0, 0, 16, 16],
          crop: [0, 0, 16, 16],
          sourceIndex: 1,
        },
      ],
      32
    );

    expect(atlas.frames.map((frame) => frame.id)).toEqual(["fits"]);
    expect(warn).toHaveBeenCalledWith(
      "Skipping image too-wide because width 64 exceeds canvas width 32"
    );

    warn.mockRestore();
  });
});
