import type {
  MinecraftSkinInitialSelection,
  MinecraftSkinOption,
  MinecraftSkinTextureChoiceOption,
} from "@genroot/builder/modules/modelControls";
import { defaultSkinNames, getSkinUrl } from "./index";

export const defaultMinecraftSkinInitialSelection: MinecraftSkinInitialSelection =
  {
    kind: "preset",
    presetName: "Default",
  };

export function makeDefaultMinecraftSkinOptions(): MinecraftSkinOption[] {
  return defaultSkinNames.map(
    (name): MinecraftSkinOption => ({
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

export function makeTextureOption(
  textureId: string
): MinecraftSkinTextureChoiceOption {
  return {
    kind: "textureChoice",
    id: textureId,
    label: textureId,
    textureId,
  };
}
