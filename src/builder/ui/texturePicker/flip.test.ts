import { describe, expect, it } from "vitest";
import { flipForRotation, makeNextFlip } from "./flip";

describe("makeNextFlip", () => {
  it("toggles horizontal from no flip without changing rotation", () => {
    expect(makeNextFlip("None", "Horizontal", "Rot0")).toEqual([
      "Horizontal",
      "Rot0",
    ]);
  });

  it("toggles vertical from no flip without changing rotation", () => {
    expect(makeNextFlip("None", "Vertical", "Rot90")).toEqual([
      "Vertical",
      "Rot90",
    ]);
  });

  it("cancels opposite flips by adding 180 degrees", () => {
    expect(makeNextFlip("Horizontal", "Vertical", "Rot0")).toEqual([
      "None",
      "Rot180",
    ]);
    expect(makeNextFlip("Vertical", "Horizontal", "Rot90")).toEqual([
      "None",
      "Rot270",
    ]);
  });

  it("cancels matching flips without changing rotation", () => {
    expect(makeNextFlip("Horizontal", "Horizontal", "Rot180")).toEqual([
      "None",
      "Rot180",
    ]);
    expect(makeNextFlip("Vertical", "Vertical", "Rot270")).toEqual([
      "None",
      "Rot270",
    ]);
  });
});

describe("flipForRotation", () => {
  it("keeps flips aligned for unrotated textures", () => {
    expect(flipForRotation("Horizontal", "Rot0")).toBe("Horizontal");
    expect(flipForRotation("Vertical", "Rot180")).toBe("Vertical");
  });

  it("swaps horizontal and vertical after a quarter turn", () => {
    expect(flipForRotation("Horizontal", "Rot90")).toBe("Vertical");
    expect(flipForRotation("Vertical", "Rot90")).toBe("Horizontal");
    expect(flipForRotation("Horizontal", "Rot270")).toBe("Vertical");
    expect(flipForRotation("Vertical", "Rot270")).toBe("Horizontal");
  });
});
