import React from "react";
import { type Generator } from "@genroot/builder/modules/generator";
import { Select, type SelectOption } from "@genroot/builder/ui/form/select";
import {
  defaultTintChoiceGroups,
  type TintChoice,
  type TintChoiceGroup,
} from "./tints";
import {
  customChoice,
  flattenTintChoiceGroups,
  getColorFromSelectedTint,
  getTintFromOption,
  getTintInputValue,
  getTintSelectorStateFromValue,
  makeTintChoices,
  normalizeTint,
  type SelectedTint,
} from "./tintSelectorLogic";

type TintSelectorState = {
  selectedOption: SelectOption;
  selectedTint: SelectedTint;
  customTintInput: string;
  color: string | null;
};

function getStateFromValue(
  value: string | null,
  tintChoices: TintChoice[]
): TintSelectorState {
  return getTintSelectorStateFromValue(value, tintChoices);
}

export function TintSelector({
  value,
  onChange,
  label = "Tint",
  choiceGroups = defaultTintChoiceGroups,
  includeNoTint = true,
}: {
  value?: string | null;
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
    () => makeTintChoices(choiceGroups, includeNoTint),
    [choiceGroups, includeNoTint]
  );
  const isControlled = value !== undefined;

  const [state, setState] = React.useState<TintSelectorState>(() =>
    getStateFromValue(value ?? null, tintChoices)
  );

  React.useEffect(() => {
    if (isControlled) {
      setState(getStateFromValue(value ?? null, tintChoices));
    }
  }, [isControlled, value, tintChoices]);

  const { selectedTint, selectedOption, customTintInput, color } = state;

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customTintInput = e.target.value.replace(/^#/, "");
    const color = normalizeTint(customTintInput);
    const selectedOption = customChoice;
    const selectedTint: SelectedTint = { kind: "CustomTint", hex: color };
    const nextState = {
      selectedOption,
      selectedTint,
      customTintInput,
      color,
    };
    setState(nextState);
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
            const color = getColorFromSelectedTint(selectedTint);
            const nextState = {
              selectedOption,
              selectedTint,
              customTintInput: color ? color.replace(/^#/, "") : "",
              color,
            };
            setState(nextState);
            onChange(color);
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
