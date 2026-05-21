import { describe, expect, it, vi } from "vitest";
import { type Generator } from "@genroot/builder/modules/generator";
import {
  decodeSelectedTextures,
  encodeSelectedTexture,
  encodeSelectedTextures,
  type SelectedTexture,
} from "@genroot/builder/ui/texturePicker/selectedTexture";
import { defineTextureInputRegion } from "./face";

const selectedTextureInputId = "Selected Texture";
const faceId = "Face";
const region: [number, number, number, number] = [0, 0, 16, 16];

function makeSelectedTexture({
  textureDefId = "textures",
  frameId = "stone",
  blend = null,
}: {
  textureDefId?: string;
  frameId?: string;
  blend?: string | null;
} = {}): SelectedTexture {
  return {
    textureDefId,
    frame: {
      id: frameId,
      label: frameId,
      rectangle: [0, 0, 16, 16],
      crop: [0, 0, 16, 16],
    },
    rotation: "Rot0",
    flip: "None",
    blend,
  };
}

function makeRegionGenerator({
  selectedTextureJson,
  faceJson,
}: {
  selectedTextureJson: string;
  faceJson: string;
}) {
  let onRegionClick: (() => void) | undefined;
  let nextFaceJson: string | null = null;
  const generator = {
    defineRegionInput: vi.fn((_region: unknown, callback: () => void) => {
      onRegionClick = callback;
    }),
    getStringInputValue: vi.fn((id: string) => {
      if (id === selectedTextureInputId) {
        return selectedTextureJson;
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

  defineTextureInputRegion(generator, selectedTextureInputId, faceId, region);

  const click = onRegionClick;
  if (!click) {
    throw new Error("Region callback was not registered");
  }

  return {
    click,
    getNextFaceTextures: () =>
      nextFaceJson ? decodeSelectedTextures(nextFaceJson) : [],
  };
}

describe("defineTextureInputRegion", () => {
  it("applies a tint-only selection to the top face texture", () => {
    const faceJson = encodeSelectedTextures([
      makeSelectedTexture({ frameId: "bottom", blend: "#111111" }),
      makeSelectedTexture({ frameId: "top", blend: null }),
    ]);
    const { click, getNextFaceTextures } = makeRegionGenerator({
      selectedTextureJson: encodeSelectedTexture(
        makeSelectedTexture({ textureDefId: "", frameId: "", blend: "#ff0000" })
      ),
      faceJson,
    });

    click();

    expect(getNextFaceTextures()).toHaveLength(2);
    expect(getNextFaceTextures()[0]?.blend).toBe("#111111");
    expect(getNextFaceTextures()[1]?.blend).toBe("#ff0000");
  });

  it("ignores incomplete custom tint selections", () => {
    const faceJson = encodeSelectedTextures([
      makeSelectedTexture({ frameId: "top", blend: null }),
    ]);
    const { click, getNextFaceTextures } = makeRegionGenerator({
      selectedTextureJson: encodeSelectedTexture(
        makeSelectedTexture({ textureDefId: "", frameId: "", blend: "#" })
      ),
      faceJson,
    });

    click();

    expect(getNextFaceTextures()).toHaveLength(1);
    expect(getNextFaceTextures()[0]?.blend).toBeNull();
  });
});
