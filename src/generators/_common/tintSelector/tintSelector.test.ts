import { describe, expect, it } from "vitest";
import { normalizeTint } from "./tintSelectorLogic";

describe("normalizeTint", () => {
  it("normalizes hex values with or without a leading hash", () => {
    expect(normalizeTint("ff00aa")).toBe("#ff00aa");
    expect(normalizeTint("#ff00aa")).toBe("#ff00aa");
  });

  it("rejects invalid or empty input", () => {
    expect(normalizeTint("")).toBe(null);
    expect(normalizeTint("not-a-color")).toBe(null);
  });
});
