import { type Rotation } from "./rotation";
import { SelectedTint } from "./tintSelector";

/** [x, y, width, height] */
type Rectangle = [number, number, number, number];

export type TextureFrame = {
  id: string;
  name: string;
  rectangle: Rectangle;
  frameIndex: number;
  frameCount: number;
};

export type SelectedTexture = {
  textureDefId: string;
  frame: TextureFrame;
  rotation: Rotation;
  blend?: SelectedTint;
};

export function encodeSelectedTexture(
  selectedTexture: SelectedTexture
): string {
  return JSON.stringify(selectedTexture);
}

export function decodeSelectedTexture(json: string): SelectedTexture {
  return JSON.parse(json);
}

export function encodeSelectedTextures(
  selectedTextures: SelectedTexture[]
): string {
  return JSON.stringify(selectedTextures);
}

export function decodeSelectedTextures(json: string): SelectedTexture[] {
  return JSON.parse(json);
}
