import { describe, expect, it } from "vitest";
import { matchesTextureSearch, normalizeTextureSearch } from "./textureSearch";

describe("normalizeTextureSearch", () => {
  it("treats underscores like spaces", () => {
    expect(normalizeTextureSearch("grass_block_top")).toBe("grass block top");
  });
});

describe("matchesTextureSearch", () => {
  it("matches humanized search text against underscored texture names", () => {
    expect(matchesTextureSearch("grass_block_top", "grass block")).toBe(true);
  });

  it("still matches raw underscored search text", () => {
    expect(matchesTextureSearch("grass_block_top", "grass_block")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesTextureSearch("grass_block_top", "stone")).toBe(false);
  });
});
