import { describe, expect, it } from "vitest";
import { makeFrameLabel, tilesToTextureFrames } from "./textureData";

describe("tilesToTextureFrames", () => {
  it("preserves frame indices for multi-frame textures", () => {
    const frames = tilesToTextureFrames(
      [
        {
          name: "animated_block",
          x: 0,
          y: 0,
          width: 16,
          height: 32,
          frames: [
            { x: 0, y: 0, width: 16, height: 16 },
            { x: 0, y: 16, width: 16, height: 16 },
          ],
        },
      ],
      16
    );

    expect(frames).toHaveLength(2);
    expect(frames[0]).toEqual({
      id: "animated_block_0",
      name: "animated_block",
      rectangle: [0, 0, 16, 16],
      frameIndex: 0,
      frameCount: 2,
    });
    expect(frames[1]).toEqual({
      id: "animated_block_1",
      name: "animated_block",
      rectangle: [0, 16, 16, 16],
      frameIndex: 1,
      frameCount: 2,
    });
  });

  it("keeps a large single-frame texture as a single frame", () => {
    const frames = tilesToTextureFrames(
      [
        {
          name: "large_single_frame",
          x: 0,
          y: 0,
          width: 32,
          height: 32,
          frames: [{ x: 0, y: 0, width: 32, height: 32 }],
        },
      ],
      16
    );

    expect(frames).toHaveLength(1);
    expect(frames[0]).toEqual({
      id: "large_single_frame",
      name: "large_single_frame",
      rectangle: [0, 0, 32, 32],
      frameIndex: 0,
      frameCount: 1,
    });
  });
});

describe("makeFrameLabel", () => {
  it("adds a frame suffix only for multi-frame textures", () => {
    expect(
      makeFrameLabel({
        id: "animated_block_1",
        name: "animated_block",
        rectangle: [0, 16, 16, 16],
        frameIndex: 1,
        frameCount: 2,
      })
    ).toBe("animated block (Frame 2)");

    expect(
      makeFrameLabel({
        id: "large_single_frame",
        name: "large_single_frame",
        rectangle: [0, 0, 32, 32],
        frameIndex: 0,
        frameCount: 1,
      })
    ).toBe("large single frame");
  });
});
