// Represents every supported way a Minecraft skin can be selected in the UI.
// This is a discriminated union (`kind`) so callers can branch safely by mode.
export type SkinSelection =
  | { kind: "none" } // No skin should be applied.
  | { kind: "preset"; presetName: string } // One of the configured preset options.
  | { kind: "texture"; textureId: string } // A texture option mapped to an existing texture id.
  | { kind: "custom" }; // A user-provided skin (uploaded file or fetched by username).

// Prefix used to build stable, namespaced persistence keys per control id.
export const MINECRAFT_SKIN_SELECTION_KEY_PREFIX = "__minecraftSkinSelection:";

export const defaultMinecraftSkinSelection: SkinSelection = { kind: "none" };

// Builds the persisted key for this control instance.
// `id` lets multiple Minecraft skin controls coexist without key collisions.
export function getMinecraftSkinSelectionKey(id: string): string {
  return `${MINECRAFT_SKIN_SELECTION_KEY_PREFIX}${id}`;
}

// Parses persisted JSON into a validated `SkinSelection`.
// Important: this function is intentionally defensive because persisted values
// can be missing, malformed, or from older app versions.
export function parseMinecraftSkinSelection(
  value: string | null
): SkinSelection | null {
  if (!value) {
    return null;
  }

  try {
    // Parse as `unknown` first, then validate shape manually.
    const parsed: unknown = JSON.parse(value);

    // Non-object JSON values (string/number/array/null) are invalid here.
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Pull discriminator in a safe way before narrowing.
    const kind = "kind" in parsed ? parsed.kind : null;

    // `none` and `custom` require no extra payload fields.
    if (kind === "none" || kind === "custom") {
      return { kind };
    }

    // `preset` must include a string preset name.
    if (
      kind === "preset" &&
      "presetName" in parsed &&
      typeof parsed.presetName === "string"
    ) {
      return { kind: "preset", presetName: parsed.presetName };
    }

    // `texture` must include a string texture id.
    if (
      kind === "texture" &&
      "textureId" in parsed &&
      typeof parsed.textureId === "string"
    ) {
      return { kind: "texture", textureId: parsed.textureId };
    }
  } catch {
    // Ignore malformed persisted values and fall back to the safe default.
  }

  return null;
}

// Serializes the validated selection shape for persistence.
// This mirrors `parseMinecraftSkinSelection` for read/write symmetry.
export function serializeMinecraftSkinSelection(
  selection: SkinSelection
): string {
  return JSON.stringify(selection);
}
