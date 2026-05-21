import { describe, expect, it } from "vitest";
import {
  compositeBannerLayer,
  compositeBannerLayerNormalizedFormula,
  type RGB,
  type RGBA,
} from "./multiplyExample";

function expectPixelCloseTo(actual: RGBA, expected: RGBA): void {
  expect(actual.r).toBeCloseTo(expected.r, 0);
  expect(actual.g).toBeCloseTo(expected.g, 0);
  expect(actual.b).toBeCloseTo(expected.b, 0);
  expect(actual.a).toBeCloseTo(expected.a, 0);
}

describe("Minecraft banner multiply examples", () => {
  it("does not change the destination for fully transparent pattern pixels", () => {
    const destination: RGBA = { r: 100, g: 80, b: 60, a: 255 };
    const texture: RGBA = { r: 255, g: 0, b: 200, a: 0 };
    const dye: RGB = { r: 200, g: 40, b: 40 };

    expect(compositeBannerLayer(destination, texture, dye)).toEqual(destination);
  });

  it("matches the listed 50% transparent pattern pixel example", () => {
    const destination: RGBA = { r: 100, g: 80, b: 60, a: 255 };
    const texture: RGBA = { r: 200, g: 40, b: 40, a: 128 };
    const dye: RGB = { r: 255, g: 255, b: 255 };

    expectPixelCloseTo(compositeBannerLayer(destination, texture, dye), {
      r: 150,
      g: 60,
      b: 50,
      a: 255,
    });
  });

  it("normal formula agrees with the direct helper", () => {
    const destination: RGBA = { r: 100, g: 80, b: 60, a: 255 };
    const texture: RGBA = { r: 200, g: 40, b: 40, a: 128 };
    const dye: RGB = { r: 255, g: 255, b: 255 };

    expectPixelCloseTo(
      compositeBannerLayerNormalizedFormula({
        texture,
        dye,
        destination,
      }),
      compositeBannerLayer(destination, texture, dye)
    );
  });

  it("matches the blue base and cyan gradient middle pixel calculation", () => {
    const blueBase: RGBA = {
      r: (242 / 255) * 60,
      g: (242 / 255) * 68,
      b: (242 / 255) * 170,
      a: 255,
    };
    const gradientTexture: RGBA = { r: 242, g: 242, b: 242, a: 127 };
    const cyan: RGB = { r: 22, g: 156, b: 156 };

    expectPixelCloseTo(compositeBannerLayer(blueBase, gradientTexture, cyan), {
      r: 39,
      g: 106,
      b: 155,
      a: 255,
    });
  });
});
