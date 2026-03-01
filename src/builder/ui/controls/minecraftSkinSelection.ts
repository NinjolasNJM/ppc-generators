export type SkinSelection =
  | { kind: "none" }
  | { kind: "preset"; presetName: string }
  | { kind: "textureChoice"; textureId: string }
  | { kind: "custom" };

export const MINECRAFT_SKIN_SELECTION_KEY_PREFIX = "__minecraftSkinSelection:";

export const defaultMinecraftSkinSelection: SkinSelection = {
  kind: "preset",
  presetName: "Default",
};

export function getMinecraftSkinSelectionKey(id: string): string {
  return `${MINECRAFT_SKIN_SELECTION_KEY_PREFIX}${id}`;
}

export function parseMinecraftSkinSelection(
  value: string | null
): SkinSelection {
  // Keep default behavior deterministic when no selection metadata exists yet.
  if (!value) {
    return defaultMinecraftSkinSelection;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object") {
      return defaultMinecraftSkinSelection;
    }

    const kind = "kind" in parsed ? parsed.kind : null;

    if (kind === "none" || kind === "custom") {
      return { kind };
    }

    if (
      kind === "preset" &&
      "presetName" in parsed &&
      typeof parsed.presetName === "string"
    ) {
      return { kind: "preset", presetName: parsed.presetName };
    }

    if (
      kind === "textureChoice" &&
      "textureId" in parsed &&
      typeof parsed.textureId === "string"
    ) {
      return { kind: "textureChoice", textureId: parsed.textureId };
    }
  } catch {
    // Ignore malformed persisted values and fall back to the safe default.
  }

  return defaultMinecraftSkinSelection;
}

export function serializeMinecraftSkinSelection(
  selection: SkinSelection
): string {
  return JSON.stringify(selection);
}
