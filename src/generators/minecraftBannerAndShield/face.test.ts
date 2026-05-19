import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import { type DrawTextureOptions } from "@genroot/builder/modules/renderers/drawTexture";
import { currentBannerAndShieldTextureId } from "./constants";
import {
  decodeSelectedBannerShieldPatterns,
  encodeSelectedBannerShieldPattern,
  encodeSelectedBannerShieldPatterns,
  type SelectedBannerShieldPattern,
} from "./bannerTexturePicker/types";
import { defineInputRegion, drawFace } from "./face";

const versionId = "minecraft-26-1-2-banner-shield";

function makeSelectedPattern(patternId: string): SelectedBannerShieldPattern {
  return {
    versionId,
    patternId,
    blend: null,
  };
}

function makeGenerator(faceId: string, faceJson: string): Generator {
  return {
    getStringInputValue: (id: string) => (id === faceId ? faceJson : null),
    drawTexture: vi.fn(),
  } as unknown as Generator;
}

describe("drawFace", () => {
  const source: [number, number, number, number] = [0, 0, 16, 16];
  const destination: [number, number, number, number] = [20, 30, 40, 50];

  it("draws the banner frame for banner faces", () => {
    const faceId = "BannerFaceTop1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")])
    );

    drawFace(generator, faceId, source, destination);

    expect(generator.drawTexture).toHaveBeenCalledTimes(1);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "minecraft-26.1.2-banner-patterns",
      [64, 0, 64, 64],
      destination,
      expect.objectContaining<DrawTextureOptions>({
        blend: undefined,
      })
    );
  });

  it("draws the shield frame for shield faces", () => {
    const faceId = "ShieldFaceTop1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")])
    );

    drawFace(generator, faceId, source, destination);

    expect(generator.drawTexture).toHaveBeenCalledTimes(1);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "minecraft-26.1.2-shield-patterns",
      [0, 0, 64, 64],
      destination,
      expect.objectContaining<DrawTextureOptions>({
        blend: undefined,
      })
    );
  });

  it("scales partial source regions to match larger atlas frames", () => {
    const faceId = "ShieldFaceRight1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")])
    );

    drawFace(generator, faceId, [0, 8, 16, 8], destination);

    expect(generator.drawTexture).toHaveBeenCalledTimes(1);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "minecraft-26.1.2-shield-patterns",
      [0, 32, 64, 32],
      destination,
      expect.objectContaining<DrawTextureOptions>({
        blend: undefined,
      })
    );
  });

  it("applies tint blends", () => {
    const faceId = "BannerFaceTop1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([
        {
          ...makeSelectedPattern("base"),
          blend: "#ff0000",
        },
      ])
    );

    drawFace(generator, faceId, source, destination);

    expect(generator.drawTexture).toHaveBeenCalledWith(
      "minecraft-26.1.2-banner-patterns",
      [64, 0, 64, 64],
      destination,
      expect.objectContaining<DrawTextureOptions>({
        blend: { kind: "MultiplyHex", hex: "#ff0000" },
      })
    );
  });
});

describe("defineInputRegion", () => {
  const faceId = "BannerFaceTop1";
  const region: [number, number, number, number] = [0, 0, 16, 16];

  function makeRegionGenerator({
    currentPatternJson,
    faceJson,
  }: {
    currentPatternJson: string;
    faceJson: string;
  }) {
    let onRegionClick: (() => void) | undefined;
    let nextFaceJson: string | null = null;
    const generator = {
      defineRegionInput: vi.fn((_region: unknown, callback: () => void) => {
        onRegionClick = callback;
      }),
      getStringInputValue: vi.fn((id: string) => {
        if (id === currentBannerAndShieldTextureId) {
          return currentPatternJson;
        }
        if (id === faceId) {
          return faceJson;
        }
        return null;
      }),
      setStringInputValue: vi.fn((id: string, value: string) => {
        if (id === faceId) {
          nextFaceJson = value;
        }
      }),
    } as unknown as Generator;

    defineInputRegion(generator, faceId, region);

    const click = onRegionClick;
    if (!click) {
      throw new Error("Region callback was not registered");
    }

    return {
      click,
      getNextFacePatterns: () =>
        nextFaceJson ? decodeSelectedBannerShieldPatterns(nextFaceJson) : [],
    };
  }

  it("appends the selected pattern to the face", () => {
    const { click, getNextFacePatterns } = makeRegionGenerator({
      currentPatternJson: encodeSelectedBannerShieldPattern(
        makeSelectedPattern("base")
      ),
      faceJson: "",
    });

    click();

    expect(getNextFacePatterns()).toHaveLength(1);
    expect(getNextFacePatterns()[0]?.patternId).toBe("base");
  });

  it("erases the last face pattern when the picker selection is empty", () => {
    const faceJson = encodeSelectedBannerShieldPatterns([
      makeSelectedPattern("base"),
      makeSelectedPattern("border"),
    ]);
    const { click, getNextFacePatterns } = makeRegionGenerator({
      currentPatternJson: encodeSelectedBannerShieldPattern(
        makeSelectedPattern("")
      ),
      faceJson,
    });

    click();

    expect(getNextFacePatterns()).toHaveLength(1);
    expect(getNextFacePatterns()[0]?.patternId).toBe("base");
  });
});
