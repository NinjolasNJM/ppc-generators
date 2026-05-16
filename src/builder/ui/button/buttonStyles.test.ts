import { describe, expect, it } from "vitest";
import { makeButtonClassNames } from "./buttonStyles";

describe("makeButtonClassNames", () => {
  it("keeps the icon button compact", () => {
    expect(
      makeButtonClassNames({
        size: "Icon",
        color: "Blue",
      })
    ).toContain("px-4 py-2 ");
  });

  it("keeps the existing small size unchanged", () => {
    expect(
      makeButtonClassNames({
        size: "Small",
        color: "Blue",
      })
    ).toContain("px-8 py-2 ");
  });
});
