import React from "react";
import { type Generator } from "@genroot/builder/modules/generator";
import { hexToRGB } from "@genroot/builder/modules/renderers/drawTexture";
import {
  defaultTintChoiceGroups,
  type TintChoice,
  type TintChoiceGroup,
} from "./tints";
import {
  type SelectOptionGroup,
  type SelectOption,
  type SelectOptionOrGroup,
  Select,
} from "@genroot/builder/ui/form/select";

type SelectedTint =
  | { kind: "NoTint" }
  | { kind: "CustomTint"; hex: string | null }
  | { kind: "SelectedTint"; hex: string };

function makeOptions(tints: TintChoice[]): SelectOption[] {
  return tints.map((tint) => {
    const choice: SelectOption = { id: tint.id, label: tint.label };
    return choice;
  });
}

function isValidTint(tint: string): boolean {
  const value = hexToRGB(tint);
  return value !== null;
}

function normalizeTint(tint: string): string | null {
  const trimmed = tint.trim();
  if (trimmed.length === 0) {
    return null;
  } else {
    const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (isValidTint(normalized)) {
      return normalized;
    } else {
      return null;
    }
  }
}

const noneChoice: SelectOption = { id: "None", label: "No tint" };

const customChoice: SelectOption = { id: "Custom", label: "Custom tint" };

function flattenTintChoiceGroups(
  choiceGroups: TintChoiceGroup[]
): TintChoice[] {
  return choiceGroups.flatMap((group) => group.options);
}

function makeChoiceGroups(
  choiceGroups: TintChoiceGroup[]
): SelectOptionGroup[] {
  return choiceGroups.map((group) => ({
    id: group.id,
    label: group.label,
    options: makeOptions(group.options),
  }));
}

function makeChoices(
  choiceGroups: TintChoiceGroup[],
  includeNoTint: boolean
): SelectOptionOrGroup[] {
  return [
    ...(includeNoTint ? [noneChoice] : []),
    customChoice,
    ...makeChoiceGroups(choiceGroups),
  ];
}

function getTintFromOption(
  option: SelectOption,
  tintChoices: TintChoice[]
): SelectedTint {
  switch (option.id) {
    case "None":
      return { kind: "NoTint" };
    case "Custom":
      return { kind: "CustomTint", hex: null };
    default: {
      const tint = tintChoices.find((tint) => tint.id === option.id);
      if (!tint) {
        return { kind: "NoTint" };
      }
      return { kind: "SelectedTint", hex: tint.color };
    }
  }
}

function getColorFromSelectedTint(selectedTint: SelectedTint): string | null {
  switch (selectedTint.kind) {
    case "NoTint":
      return null;
    case "CustomTint":
      return selectedTint.hex;
    case "SelectedTint":
      return selectedTint.hex;
  }
}

type TintSelectorState = {
  selectedOption: SelectOption;
  selectedTint: SelectedTint;
  customTintInput: string;
  color: string | null;
};

function getCustomTintInput(value: string | null): string {
  return value?.replace(/^#/, "") ?? "";
}

function normalizeHexForComparison(value: string): string {
  return (normalizeTint(value) ?? value).toUpperCase();
}

function getStateFromValue(
  value: string | null,
  tintChoices: TintChoice[]
): TintSelectorState {
  if (value === null) {
    return {
      selectedOption: noneChoice,
      selectedTint: { kind: "NoTint" },
      customTintInput: "",
      color: null,
    };
  }

  const normalizedValue = normalizeHexForComparison(value);
  const tint = tintChoices.find(
    (tint) => normalizeHexForComparison(tint.color) === normalizedValue
  );
  if (tint) {
    return {
      selectedOption: { id: tint.id, label: tint.label },
      selectedTint: { kind: "SelectedTint", hex: tint.color },
      customTintInput: "",
      color: tint.color,
    };
  }

  return {
    selectedOption: customChoice,
    selectedTint: { kind: "CustomTint", hex: value },
    customTintInput: getCustomTintInput(value),
    color: value,
  };
}

function getTintChoiceValue(
  value: string,
  tintChoices: TintChoice[]
): string | null {
  const normalizedValue = value.trim().toLowerCase();
  const tint = tintChoices.find(
    (tint) =>
      tint.id.toLowerCase() === normalizedValue ||
      tint.label.toLowerCase() === normalizedValue
  );
  return tint?.color ?? null;
}

function getTintInputValue(
  storedValue: string | null,
  defaultValue: string | null,
  tintChoices: TintChoice[]
): string | null {
  if (storedValue === null) {
    return defaultValue;
  }

  if (storedValue.trim().length === 0) {
    return null;
  }

  return (
    getTintChoiceValue(storedValue, tintChoices) ??
    normalizeTint(storedValue) ??
    storedValue
  );
}

export function TintSelector({
  value,
  onChange,
  label = "Tint",
  choiceGroups = defaultTintChoiceGroups,
  includeNoTint = true,
}: {
  value: string | null;
  onChange: (hex: string | null) => void;
  label?: string;
  choiceGroups?: TintChoiceGroup[];
  includeNoTint?: boolean;
}) {
  const tintChoices = React.useMemo(
    () => flattenTintChoiceGroups(choiceGroups),
    [choiceGroups]
  );
  const choices = React.useMemo(
    () => makeChoices(choiceGroups, includeNoTint),
    [choiceGroups, includeNoTint]
  );
  const [state, setState] = React.useState<TintSelectorState>({
    selectedOption: noneChoice,
    selectedTint: { kind: "NoTint" },
    customTintInput: "",
    color: null,
  });

  React.useEffect(() => {
    setState(getStateFromValue(value, tintChoices));
  }, [value, tintChoices]);

  const { selectedTint, selectedOption, customTintInput, color } = state;

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customTintInput = e.target.value.replace(/^#/, "");
    const color = normalizeTint(customTintInput);
    const selectedOption = customChoice;
    const selectedTint: SelectedTint = { kind: "CustomTint", hex: color };
    setState({ selectedOption, selectedTint, customTintInput, color });
    if (color) {
      onChange(color);
    } else if (customTintInput.trim().length === 0) {
      onChange(null);
    }
  };

  return (
    <div>
      <div className="font-bold mb-1">{label}</div>
      <div className="flex space-x-4">
        <Select
          choices={choices}
          value={selectedOption}
          onChange={(selectedOption) => {
            const selectedTint = getTintFromOption(selectedOption, tintChoices);
            if (selectedTint) {
              const color = getColorFromSelectedTint(selectedTint);
              setState({
                selectedOption,
                selectedTint,
                customTintInput: getCustomTintInput(color),
                color,
              });
              onChange(color);
            }
          }}
        />

        {selectedTint.kind === "CustomTint" ? (
          <div>
            <span className="mr-1">#</span>
            <input
              placeholder="Enter hex color"
              className="p-2 border border-gray-300"
              value={customTintInput}
              onChange={onInputChange}
            />
          </div>
        ) : null}

        {color ? (
          <div className="border bg-white p-1">
            <div className="w-8 h-8" style={{ backgroundColor: color }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function defineTintInput(
  generator: Generator,
  id: string,
  {
    defaultValue = null,
    label = id,
    choiceGroups,
    includeNoTint = true,
  }: {
    defaultValue?: string | null;
    label?: string;
    choiceGroups?: TintChoiceGroup[];
    includeNoTint?: boolean;
  } = {}
): string | null {
  const tintChoices = flattenTintChoiceGroups(
    choiceGroups ?? defaultTintChoiceGroups
  );
  const storedValue = generator.getStringInputValue(id);
  const value = getTintInputValue(storedValue, defaultValue, tintChoices);

  generator.defineCustomStringInput(id, (onChange) => (
    <TintSelector
      value={value}
      label={label}
      choiceGroups={choiceGroups}
      includeNoTint={includeNoTint}
      onChange={(hex) => {
        onChange(hex ?? "");
      }}
    />
  ));

  return value;
}
