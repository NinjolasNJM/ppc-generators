import React from "react";

import {
  type Texture,
  makeTextureFromImage,
  makeTextureFromUrl,
} from "@genroot/builder/modules/texture";
import { makeImageFromUrl } from "@genroot/builder/modules/image";
import { convertToStandardSkin } from "@genroot/builder/modules/minecraftSkinConverter";
import { fetchSkinImage } from "@genroot/builder/modules/minecraftSkin";
import { defaultSkinNames, getSkinUrl } from "@genroot/generators/_common/skins";
import { type SelectOption, Select } from "../form/select";
import { Button, type ButtonState } from "../button/button";
import { ArrowPathIconWithSpin } from "../icon";
import { type SkinSelection } from "./minecraftSkinSelection";

type ModelType = "Wide" | "Slim";

type FetchState =
  | { kind: "Idle" }
  | { kind: "Fetching" }
  | { kind: "Error" }
  | { kind: "Success" };

function MinecraftSkinFetchInput({
  onImage,
  onError,
}: {
  onImage: (image: HTMLImageElement) => Promise<void>;
  onError: () => void;
}) {
  const [value, setValue] = React.useState("");
  const [fetchState, setFetchState] = React.useState<FetchState>({
    kind: "Idle",
  });

  const username = value.trim();

  const onFetchSkin = async () => {
    setFetchState({ kind: "Fetching" });

    if (!username) {
      setFetchState({ kind: "Idle" });
      return;
    }

    try {
      const image = await fetchSkinImage(value);
      await onImage(image);
      setFetchState({ kind: "Success" });
    } catch (error) {
      console.error(error);
      onError();
      setFetchState({ kind: "Error" });
    }
  };

  const buttonState: ButtonState =
    !username || fetchState.kind === "Fetching" ? "Disabled" : "Ready";

  return (
    <div className="relative">
      <div className="flex">
        <div className="relative">
          <input
            className="border border-gray-300 p-2 mr-2 w-60"
            placeholder="Enter username"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                void onFetchSkin();
              }
            }}
          />
          {fetchState.kind === "Fetching" ? (
            <span className="absolute top-2 right-4">
              <ArrowPathIconWithSpin />
            </span>
          ) : null}
        </div>

        <Button
          size="Small"
          state={buttonState}
          onClick={() => void onFetchSkin()}
        >
          Fetch skin
        </Button>
      </div>
      {fetchState.kind === "Error" ? (
        <div className="text-red-500 absolute top-18">
          There was a problem fetching the skin.
          <br />
          Check the username and try again.
        </div>
      ) : null}
    </div>
  );
}

export function MinecraftSkinControl({
  id,
  choices,
  standardWidth,
  standardHeight,
  modelType,
  selection,
  textures,
  onSelectionChange,
  onChange,
}: {
  id: string;
  choices: string[];
  standardWidth: number;
  standardHeight: number;
  modelType: ModelType;
  selection: SkinSelection;
  textures: Map<string, Texture>;
  onSelectionChange: (selection: SkinSelection) => void;
  onChange: (image: Texture | null) => void;
}) {
  const onChangeRef = React.useRef(onChange);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const defaultSet = React.useMemo(() => new Set<string>(defaultSkinNames), []);
  const additionalChoices = React.useMemo(
    () => choices.filter((choice) => !defaultSet.has(choice)),
    [choices, defaultSet]
  );

  const selectChoices: SelectOption[] = [
    { id: "", label: "None" },
    ...defaultSkinNames.map((name) => ({ id: name, label: name })),
    ...additionalChoices.map((choice) => ({ id: choice, label: choice })),
  ];

  const selectedChoiceId =
    selection.kind === "preset"
      ? selection.presetName
      : selection.kind === "textureChoice"
      ? selection.textureId
      : "";

  const selectedChoice =
    selectChoices.find((choice) => choice.id === selectedChoiceId) ??
    selectChoices[0];

  const loadPreset = React.useCallback(
    async (presetName: string, currentModelType: ModelType) => {
      try {
        setLoadError(null);
        const url = getSkinUrl(presetName, currentModelType);
        const texture = await makeTextureFromUrl(
          url,
          standardWidth,
          standardHeight
        );
        onChangeRef.current(texture);
      } catch (error) {
        console.error(error);
        setLoadError("Failed to load bundled skin preset.");
      }
    },
    [standardHeight, standardWidth]
  );

  const onCustomImage = React.useCallback(
    async (image: HTMLImageElement) => {
      const converted = await convertToStandardSkin(image);
      const texture = makeTextureFromImage(
        converted,
        standardWidth,
        standardHeight
      );
      onSelectionChange({ kind: "custom" });
      setLoadError(null);
      onChangeRef.current(texture);
    },
    [onSelectionChange, standardHeight, standardWidth]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] ?? null : null;
    if (!file) {
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      const result = event.target ? event.target.result : null;

      if (typeof result !== "string") {
        return;
      }

      try {
        const image = await makeImageFromUrl(result);
        await onCustomImage(image);
      } catch (error) {
        console.error(error);
        setLoadError("Failed to load uploaded skin.");
      }
    };

    fileReader.readAsDataURL(file);
  };

  const onChoiceChange = (choice: SelectOption) => {
    if (choice.id === "") {
      onSelectionChange({ kind: "none" });
      setLoadError(null);
      onChangeRef.current(null);
      return;
    }

    if (defaultSet.has(choice.id)) {
      onSelectionChange({ kind: "preset", presetName: choice.id });
      return;
    }

    onSelectionChange({ kind: "textureChoice", textureId: choice.id });
    setLoadError(null);

    const texture = textures.get(choice.id) ?? null;
    onChangeRef.current(texture);
  };

  // Preset swapping behavior:
  // - Bundled presets (Default, Alex, etc.) have Wide and Slim variants.
  // - When model type changes, swap to the matching bundled variant automatically.
  // - Custom/uploaded/non-bundled textures do not auto-swap because there is no
  //   guaranteed paired Wide/Slim asset.
  const selectedPresetName =
    selection.kind === "preset" ? selection.presetName : null;

  React.useEffect(() => {
    if (selectedPresetName) {
      void loadPreset(selectedPresetName, modelType);
    }
  }, [loadPreset, modelType, selectedPresetName]);

  return (
    <>
      <div className="font-bold mb-1">{id}</div>
      <div className="flex flex-wrap">
        <div className="flex mb-4 space-x-4 items-center mr-4">
          <Select
            choices={selectChoices}
            value={selectedChoice}
            onChange={onChoiceChange}
          />
          <div>or</div>
          <input
            className="border border-gray-300 p-1 bg-white text-gray-400"
            type="file"
            onChange={onInputChange}
          />
        </div>

        <div className="flex mb-4 space-x-4 items-center">
          <div>or</div>
          <MinecraftSkinFetchInput
            onImage={onCustomImage}
            onError={() => setLoadError("Failed to fetch skin from username.")}
          />
        </div>
      </div>
      {loadError ? <div className="text-red-500 mb-4">{loadError}</div> : null}
    </>
  );
}
