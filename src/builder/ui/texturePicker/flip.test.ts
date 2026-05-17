import { describe, expect, it } from "vitest";
import { makeNextFlip } from "./flip";

describe("makeNextFlip", () => {
  it("transitions through horizontal and vertical flips correctly", () => {
    expect(makeNextFlip("None", "Horizontal", "Rot0")).toEqual([
      "Horizontal",
      "Rot0",
    ]);
    expect(makeNextFlip("Horizontal", "Horizontal", "Rot0")).toEqual([
      "None",
      "Rot0",
    ]);
  });

  it("orients flips around quarter-turned textures", () => {
    expect(makeNextFlip("None", "Horizontal", "Rot90")).toEqual([
      "Vertical",
      "Rot90",
    ]);
    expect(makeNextFlip("None", "Vertical", "Rot270")).toEqual([
      "Horizontal",
      "Rot270",
    ]);
  });
});
