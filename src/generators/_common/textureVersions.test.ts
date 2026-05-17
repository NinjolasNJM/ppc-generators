import { describe, expect, it } from "vitest";
import { makeTextureVersions } from "./textureVersions";

describe("makeTextureVersions", () => {
  it("converts generated texture data into texture versions", () => {
    const textureVersions = makeTextureVersions([
      [
        {
          textureDef: {
            id: "example-texture",
            url: "https://example.com/texture.png",
            standardWidth: 16,
            standardHeight: 16,
          },
          tiles: [
            {
              name: "example_tile",
              x: 0,
              y: 0,
              width: 16,
              height: 16,
              frames: [{ x: 0, y: 0, width: 16, height: 16 }],
            },
          ],
        },
        16,
      ],
    ]);

    expect(textureVersions).toEqual([
      {
        textureDef: {
          id: "example-texture",
          url: "https://example.com/texture.png",
          standardWidth: 16,
          standardHeight: 16,
        },
        frames: [
          {
            id: "example_tile",
            name: "example_tile",
            rectangle: [0, 0, 16, 16],
            frameIndex: 0,
            frameCount: 1,
          },
        ],
      },
    ]);
  });
});
