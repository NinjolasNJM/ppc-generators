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
import {
  bannerBasePatternId,
  defineBaseInput,
  defineInputRegion,
  drawCuboid,
  drawFace,
  makeTemplateBaseInputId,
  shieldBasePatternId,
  shieldBaseNoPatternId,
} from "./face";

const versionId = "minecraft-26-1-2-banner-shield";

function makeSelectedPattern(
  patternId: string,
  patternVersionId = versionId
): SelectedBannerShieldPattern {
  return {
    versionId: patternVersionId,
    patternId,
    blend: null,
  };
}

function makeGenerator(
  faceId: string,
  faceJson: string,
  baseId = bannerBasePatternId,
  baseTarget: "banner" | "shield" = "banner",
  selectedVersionId = versionId
): Generator {
  return {
    getStringInputValue: (id: string) => (id === faceId ? faceJson : null),
    getSelectInputValue: (id: string) => {
      if (id === "Version") {
        return selectedVersionId;
      }
      if (id === makeTemplateBaseInputId("1", baseTarget)) {
        return baseId;
      }
      return null;
    },
    drawTexture: vi.fn(),
  } as unknown as Generator;
}

describe("drawFace", () => {
  const source: [number, number, number, number] = [0, 0, 64, 64];
  const destination: [number, number, number, number] = [20, 30, 40, 50];

  it("draws the banner frame for banner faces", () => {
    const faceId = "BannerFaceTop1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")])
    );

    drawFace(
      generator,
      faceId,
      source,
      destination,
      undefined,
      "banner",
      makeTemplateBaseInputId("1", "banner")
    );

    expect(generator.drawTexture).toHaveBeenCalledTimes(2);
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      1,
      "minecraft-26.1.2-banner-patterns",
      [0, 0, 64, 64],
      destination,
      {}
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
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
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")]),
      shieldBasePatternId,
      "shield"
    );

    drawFace(
      generator,
      faceId,
      source,
      destination,
      undefined,
      "shield",
      makeTemplateBaseInputId("1", "shield")
    );

    expect(generator.drawTexture).toHaveBeenCalledTimes(2);
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      1,
      "minecraft-26.1.2-shield-patterns",
      [0, 192, 64, 64],
      destination,
      {}
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "minecraft-26.1.2-shield-patterns",
      [0, 0, 64, 64],
      destination,
      expect.objectContaining<DrawTextureOptions>({
        blend: undefined,
      })
    );
  });

  it("accepts a base input id directly and infers shield rendering from it", () => {
    const faceId = "PatternFace1";
    const generator = makeGenerator(faceId, "", shieldBasePatternId, "shield");

    drawFace(
      generator,
      faceId,
      source,
      destination,
      makeTemplateBaseInputId("1", "shield")
    );

    expect(generator.drawTexture).toHaveBeenCalledTimes(1);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "minecraft-26.1.2-shield-patterns",
      [0, 192, 64, 64],
      destination,
      {}
    );
  });

  it("draws partial source regions inside the selected pattern frame", () => {
    const faceId = "ShieldFaceRight1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")]),
      shieldBasePatternId,
      "shield"
    );

    drawFace(
      generator,
      faceId,
      [0, 32, 64, 32],
      destination,
      undefined,
      "shield",
      makeTemplateBaseInputId("1", "shield")
    );

    expect(generator.drawTexture).toHaveBeenCalledTimes(2);
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      1,
      "minecraft-26.1.2-shield-patterns",
      [0, 224, 64, 32],
      destination,
      {}
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "minecraft-26.1.2-shield-patterns",
      [0, 32, 64, 32],
      destination,
      expect.objectContaining<DrawTextureOptions>({
        blend: undefined,
      })
    );
  });

  it("draws matching pattern ids from the currently selected texture version", () => {
    const faceId = "ShieldFaceTop1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")]),
      shieldBasePatternId,
      "shield",
      "vanilla-tweaks-26-1-2-banner-shield"
    );

    drawFace(
      generator,
      faceId,
      source,
      destination,
      undefined,
      "shield",
      makeTemplateBaseInputId("1", "shield")
    );

    expect(generator.drawTexture).toHaveBeenCalledTimes(2);
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      1,
      "vanilla-tweaks-26.1.2-shield-patterns",
      [0, 0, 64, 64],
      destination,
      {}
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "vanilla-tweaks-26.1.2-shield-patterns",
      [128, 0, 128, 128],
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

    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "minecraft-26.1.2-banner-patterns",
      [64, 0, 64, 64],
      destination,
      expect.objectContaining<DrawTextureOptions>({
        blend: { kind: "MultiplyHex", hex: "#ff0000" },
      })
    );
  });

  it("draws the default standalone banner base for custom versions without custom base frames", () => {
    const faceId = "BannerFaceTop1";
    const generator = makeGenerator(
      faceId,
      "",
      bannerBasePatternId,
      "banner",
      "custom"
    );

    drawFace(
      generator,
      faceId,
      source,
      destination,
      undefined,
      "banner",
      makeTemplateBaseInputId("1", "banner")
    );

    expect(generator.drawTexture).toHaveBeenCalledTimes(1);
    expect(generator.drawTexture).toHaveBeenCalledWith(
      "default-banner-base",
      [0, 0, 64, 64],
      destination,
      {}
    );
  });
});

describe("defineBaseInput", () => {
  it("keeps the default banner base available for custom textures", () => {
    const generator = {
      getSelectInputValue: vi.fn((id: string) =>
        id === "Version" ? "custom" : null
      ),
      defineSelectInput: vi.fn(),
    } as unknown as Generator;

    defineBaseInput(generator, "1", "banner");

    expect(generator.defineSelectInput).toHaveBeenCalledWith(
      makeTemplateBaseInputId("1", "banner"),
      [bannerBasePatternId]
    );
  });

  it("keeps both default shield bases available for custom textures", () => {
    const generator = {
      getSelectInputValue: vi.fn((id: string) =>
        id === "Version" ? "custom" : null
      ),
      defineSelectInput: vi.fn(),
    } as unknown as Generator;

    defineBaseInput(generator, "1", "shield");

    expect(generator.defineSelectInput).toHaveBeenCalledWith(
      makeTemplateBaseInputId("1", "shield"),
      [shieldBasePatternId, shieldBaseNoPatternId]
    );
  });
});

describe("drawCuboid", () => {
  it("uses the existing cuboid layout while drawing pattern textures", () => {
    const faceId = "BannerFace1";
    const generator = makeGenerator(
      faceId,
      encodeSelectedBannerShieldPatterns([makeSelectedPattern("base")])
    );

    drawCuboid(
      generator,
      faceId,
      "banner",
      {
        front: [0, 0, 16, 16],
        back: [0, 0, 16, 16],
        top: [0, 0, 16, 16],
        bottom: [0, 0, 16, 16],
        left: [0, 0, 16, 16],
        right: [0, 0, 16, 16],
      },
      [10, 20],
      [40, 50, 3]
    );

    expect(generator.drawTexture).toHaveBeenCalledTimes(12);
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      1,
      "minecraft-26.1.2-banner-patterns",
      [0, 0, 16, 16],
      [13, 23, 40, 50],
      expect.objectContaining<DrawTextureOptions>({
        flip: "None",
        rotateLegacy: 0,
        blend: { kind: "None" },
      })
    );
    expect(generator.drawTexture).toHaveBeenNthCalledWith(
      2,
      "minecraft-26.1.2-banner-patterns",
      [64, 0, 16, 16],
      [13, 23, 40, 50],
      expect.objectContaining<DrawTextureOptions>({
        flip: "None",
        rotateLegacy: 0,
        blend: { kind: "None" },
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
