import React from "react";
import { Select } from "@genroot/builder/ui/form/select";
import {
  choices,
  customChoice,
  getColorFromSelectedTint,
  getTintFromOption,
  noneChoice,
  normalizeTint,
  type SelectedTint,
} from "./tintSelectorLogic";
import { type SelectOption } from "@genroot/builder/ui/form/select";

type TintSelectorState = {
  selectedOption: SelectOption;
  selectedTint: SelectedTint;
  color: string | null;
};

export function TintSelector({
  onChange,
  labelId = "minecraft-block-tint-label",
  label = "Tint",
}: {
  onChange: (hex: string | null) => void;
  labelId?: string;
  label?: string;
}) {
  const [state, setState] = React.useState<TintSelectorState>({
    selectedOption: noneChoice,
    selectedTint: { kind: "NoTint" },
    color: null,
  });

  const { selectedTint, selectedOption, color } = state;

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const color = normalizeTint(value);
    const selectedOption = customChoice;
    const selectedTint: SelectedTint = { kind: "CustomTint", hex: color };
    setState({ selectedOption, selectedTint, color });
    if (color) {
      onChange(color);
    }
  };

  return (
    <div>
      <div id={labelId} className="font-bold mb-1">
        {label}
      </div>
      <div className="flex space-x-4">
        <Select
          choices={choices}
          value={selectedOption}
          ariaLabelledBy={labelId}
          onChange={(selectedOption) => {
            const selectedTint = getTintFromOption(selectedOption);
            const color = getColorFromSelectedTint(selectedTint);
            setState({ selectedOption, selectedTint, color });
            onChange(color);
          }}
        />

        {selectedTint.kind === "CustomTint" ? (
          <div>
            <span className="mr-1">#</span>
            <input
              placeholder="Enter hex color"
              className="p-2 border border-gray-300"
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
