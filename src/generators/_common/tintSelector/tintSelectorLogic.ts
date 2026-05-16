import { type SelectOption } from "@genroot/builder/ui/form/select";
import { type Tint, tintGroups, tints } from "./tints";

export type SelectedTint =
  | { kind: "NoTint" }
  | { kind: "CustomTint"; hex: string | null }
  | { kind: "SelectedTint"; hex: string };

function makeOptions(tints: Tint[]): SelectOption[] {
  return tints.map((tint) => {
    const choice: SelectOption = { id: tint.id, label: tint.biome };
    return choice;
  });
}

function isValidTint(tint: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(tint);
}

export function normalizeTint(tint: string): string | null {
  const trimmed = tint.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (isValidTint(normalized)) {
    return normalized;
  }

  return null;
}

export const noneChoice: SelectOption = { id: "None", label: "No tint" };

export const customChoice: SelectOption = {
  id: "Custom",
  label: "Custom tint",
};

export const grassChoices = {
  id: "Grass",
  label: "Grass",
  options: makeOptions(tintGroups.grass),
};

export const foliageChoices = {
  id: "Foliage",
  label: "Foliage",
  options: makeOptions(tintGroups.foliage),
};

export const waterChoices = {
  id: "Water",
  label: "Water",
  options: makeOptions(tintGroups.water),
};

export const choices = [
  noneChoice,
  customChoice,
  grassChoices,
  foliageChoices,
  waterChoices,
];

export function getTintFromOption(option: SelectOption): SelectedTint {
  switch (option.id) {
    case "None":
      return { kind: "NoTint" };
    case "Custom":
      return { kind: "CustomTint", hex: null };
    default: {
      const tint = tints.find((tint) => tint.id === option.id);
      if (!tint) {
        return { kind: "NoTint" };
      }

      return { kind: "SelectedTint", hex: tint.color };
    }
  }
}

export function getColorFromSelectedTint(
  selectedTint: SelectedTint
): string | null {
  switch (selectedTint.kind) {
    case "NoTint":
      return null;
    case "CustomTint":
      return selectedTint.hex;
    case "SelectedTint":
      return selectedTint.hex;
  }
}
