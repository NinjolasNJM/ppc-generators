import { describe, expect, it } from "vitest";
import { makeNextFlip, flipForRotation } from "./flip";

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
});

describe("flipForRotation", () => {
  it("swaps flips for rotated textures", () => {
    expect(flipForRotation("Horizontal", "Rot90")).toBe("Vertical");
    expect(flipForRotation("Vertical", "Rot90")).toBe("Horizontal");
  });
});
