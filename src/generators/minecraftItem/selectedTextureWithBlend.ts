import { type SelectedTexture } from "@genroot/generators/_common/texturePicker/selectedTexture";

export type SelectedTextureWithBlend = {
  selectedTexture: SelectedTexture | null;
  blend: string | null;
};

export function decodeSelectedTextureWithBlend(
  json: string
): SelectedTextureWithBlend {
  return JSON.parse(json);
}

export function encodeSelectedTextureWithBlend(
  selectedTextures: SelectedTextureWithBlend
): string {
  return JSON.stringify(selectedTextures);
}

export function decodeSelectedTextureWithBlendArray(
  json: string
): SelectedTextureWithBlend[] {
  return JSON.parse(json);
}

export function encodeSelectedTextureWithBlendArray(
  selectedTextures: SelectedTextureWithBlend[]
): string {
  return JSON.stringify(selectedTextures);
}
