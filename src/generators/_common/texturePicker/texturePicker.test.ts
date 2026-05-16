import { describe, expect, it } from "vitest";
import { makePreviewStyle } from "./previewStyle";

describe("makePreviewStyle", () => {
  it("applies the selected tint to the preview background", () => {
    const style = makePreviewStyle(
      {
        url: "https://example.com/texture.png",
        standardWidth: 16,
        standardHeight: 16,
      },
      {
        rectangle: [0, 0, 16, 16],
      },
      "Rot0",
      "None",
      "#ff00aa"
    );

    expect(style.backgroundColor).toBe("#ff00aa");
    expect(style.backgroundBlendMode).toBe("multiply");
  });
});
