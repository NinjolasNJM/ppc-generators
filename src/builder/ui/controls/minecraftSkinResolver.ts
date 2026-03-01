import { getSkinUrl } from "@genroot/generators/_common/skins";

export type ModelType = "Wide" | "Slim";

export function resolveBundledMinecraftSkin(
  presetName: string,
  modelType: ModelType
): string {
  return getSkinUrl(presetName, modelType);
}
