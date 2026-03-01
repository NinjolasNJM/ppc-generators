import type {
  MinecraftSkinSelection,
  MinecraftSkinOptionPreset,
  MinecraftSkinOptionTexture,
} from "@genroot/builder/modules/modelControls";
import { defaultSkinNames, getSkinUrl } from "./index";

export const minecraftSkinSelectionPresetDefault: MinecraftSkinSelection =
  {
    kind: "preset",
    presetName: "Default",
  };

export function makeDefaultMinecraftSkinPresetOptions(): MinecraftSkinOptionPreset[] {
  return defaultSkinNames.map(
    (name): MinecraftSkinOptionPreset => ({
      kind: "preset",
      id: name,
      label: name,
      urls: {
        wide: getSkinUrl(name, "Wide"),
        slim: getSkinUrl(name, "Slim"),
      },
    })
  );
}

export function makeMinecraftSkinTextureOption(
  textureId: string
): MinecraftSkinOptionTexture {
  return {
    kind: "texture",
    id: textureId,
    label: textureId,
    textureId,
  };
}
