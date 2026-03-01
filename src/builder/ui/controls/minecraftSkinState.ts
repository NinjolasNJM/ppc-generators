export type SkinSelectionSource = "preset" | "custom";

export type SkinSelectionState = {
  source: SkinSelectionSource;
  presetName: string | null;
};

export const initialSkinSelectionState: SkinSelectionState = {
  source: "custom",
  presetName: null,
};

export function selectPreset(presetName: string): SkinSelectionState {
  return {
    source: "preset",
    presetName,
  };
}

export function selectCustom(): SkinSelectionState {
  return {
    source: "custom",
    presetName: null,
  };
}
