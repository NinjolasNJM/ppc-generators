import { describe, expect, it } from "vitest";
import { getCrossSeamGap } from "./shared";

const size = 128;
const textureSize = 16;
const baseScale = size / textureSize;
const centerX = 240;

type GapRow = {
  textureWidth: number;
  offsetsTested: string;
  scaledHalfWidth: string;
  canvasHalfWidth: number;
  unflippedSeamGapPx: number;
  flippedSeamGapPx: number;
};

function getUnflippedRenderedRange(x: number, width: number): [number, number] {
  const canvasWidth = Math.floor(width);
  return [Math.round(x), Math.round(x) + canvasWidth - 1];
}

function getFlippedRenderedRange(x: number, width: number): [number, number] {
  const canvasWidth = Math.floor(width);
  return [Math.round(x + width - canvasWidth), Math.round(x + width - 1)];
}

function getUnflippedSeamGap(width: number, scaleFactor: number): number {
  const scaledHalfWidth = width * baseScale * scaleFactor;
  const [, leftEnd] = getUnflippedRenderedRange(
    centerX - scaledHalfWidth,
    scaledHalfWidth
  );
  const [rightStart] = getUnflippedRenderedRange(centerX, scaledHalfWidth);
  return rightStart - leftEnd - 1;
}

function getFlippedSeamGap(width: number, scaleFactor: number): number {
  const scaledHalfWidth = width * baseScale * scaleFactor;
  const [, leftEnd] = getUnflippedRenderedRange(
    centerX - scaledHalfWidth,
    scaledHalfWidth
  );
  const [rightStart] = getFlippedRenderedRange(centerX, scaledHalfWidth);
  return rightStart - leftEnd - 1;
}

function getGapRows(scaleFactor: number): GapRow[] {
  return Array.from({ length: textureSize }, (_, index) => {
    const textureWidth = index + 1;
    const scaledHalfWidth = textureWidth * baseScale * scaleFactor;
    const offsetCount = textureSize - textureWidth + 1;
    const unflippedSeamGaps = new Set<number>();
    const flippedSeamGaps = new Set<number>();

    for (let offset = 0; offset < offsetCount; offset += 1) {
      unflippedSeamGaps.add(getUnflippedSeamGap(textureWidth, scaleFactor));
      flippedSeamGaps.add(getFlippedSeamGap(textureWidth, scaleFactor));
    }

    return {
      textureWidth,
      offsetsTested:
        offsetCount === 1 ? "0" : `0-${textureSize - textureWidth}`,
      scaledHalfWidth: scaledHalfWidth.toFixed(4),
      canvasHalfWidth: Math.floor(scaledHalfWidth),
      unflippedSeamGapPx:
        unflippedSeamGaps.size === 1
          ? Array.from(unflippedSeamGaps)[0]!
          : Number.NaN,
      flippedSeamGapPx:
        flippedSeamGaps.size === 1
          ? Array.from(flippedSeamGaps)[0]!
          : Number.NaN,
    };
  });
}

const runDiagnostics = process.env.CROSS_GAP_DIAGNOSTICS === "1";

(runDiagnostics ? describe : describe.skip)("cross gap diagnostics", () => {
  it("prints cross seam gaps for candidate width scales", () => {
    const cases = [
      ["sqrt(2)", Math.SQRT2],
      ["1.40625", 1.40625],
    ] as const;

    cases.forEach(([label, scaleFactor]) => {
      console.log(`\n${label}`);
      console.table(getGapRows(scaleFactor));
    });

    expect(cases).toHaveLength(2);
  });
});

describe("cross seam correction", () => {
  it("closes the seam for every 16x and 32x 1.40625 width case", () => {
    for (
      let textureWidth = 0.5;
      textureWidth <= textureSize;
      textureWidth += 0.5
    ) {
      const scaledHalfWidth = textureWidth * baseScale * 1.40625;
      const left = {
        x: centerX - scaledHalfWidth,
        width: scaledHalfWidth,
      };
      const right = {
        x: centerX,
        width: scaledHalfWidth,
      };

      expect(
        getCrossSeamGap(left, {
          x: right.x - getCrossSeamGap(left, right),
          width: right.width,
        })
      ).toBe(0);
    }
  });

  it("accounts for the horizontally flipped right half", () => {
    expect(getUnflippedSeamGap(3, 1.40625)).toBe(1);
    expect(getFlippedSeamGap(3, 1.40625)).toBe(2);
    expect(
      getCrossSeamGap(
        {
          x: centerX - 3 * baseScale * 1.40625,
          width: 3 * baseScale * 1.40625,
        },
        {
          x: centerX,
          width: 3 * baseScale * 1.40625,
        }
      )
    ).toBe(2);
  });
});
