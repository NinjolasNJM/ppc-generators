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

// UI state for username-based skin fetching.
// This is intentionally explicit rather than a boolean so rendering and
// button behavior can respond to each state clearly.
type FetchState =
  | { kind: "Idle" }
  | { kind: "Fetching" }
  | { kind: "Error" }
  | { kind: "Success" };

// Input for loading a skin by Minecraft username.
// This sub-component only handles input/fetch UX and delegates image handling
// to the parent through callbacks.
function MinecraftSkinFetchInput({
  onImage,
  onError,
}: {
  // Called after a skin image was fetched successfully.
  onImage: (image: HTMLImageElement) => Promise<void>;

  // Called when fetch fails so the parent can show a global error message.
  onError: () => void;
}) {
  const [value, setValue] = React.useState("");
  const [fetchState, setFetchState] = React.useState<FetchState>({
    kind: "Idle",
  });

  // Trim whitespace for validation and UI state decisions.
  const username = value.trim();

  const onFetchSkin = async () => {
    // Enter loading state immediately so the spinner appears right away.
    setFetchState({ kind: "Fetching" });

    // Empty usernames should not trigger a network request.
    if (!username) {
      setFetchState({ kind: "Idle" });
      return;
    }

    try {
      // Fetch remote skin, then hand it to the parent for conversion/storage.
      const image = await fetchSkinImage(value);
      await onImage(image);
      setFetchState({ kind: "Success" });
    } catch (error) {
      console.error(error);
      onError();
      setFetchState({ kind: "Error" });
    }
  };

  // Disable fetch while loading or with an empty username.
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
            // Pressing Enter triggers the same action as the button.
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                void onFetchSkin();
              }
            }}
          />
          {/* Inline loading indicator so users know the fetch is in progress. */}
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
      {/* Localized fetch error specific to username lookup failures. */}
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
  // Keep the latest onChange callback in a ref so async work can safely use it
  // without needing to rebuild every callback/effect when parent props change.
  const onChangeRef = React.useRef(onChange);

  // Shared error message shown below the control.
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Built-in preset names (Default, Alex, etc.) are treated specially:
  // they have model-type variants and auto-swap when model type changes.
  const defaultSet = React.useMemo(() => new Set<string>(defaultSkinNames), []);

  // External choices that are not bundled defaults.
  const additionalChoices = React.useMemo(
    () => choices.filter((choice) => !defaultSet.has(choice)),
    [choices, defaultSet]
  );

  // The Select combines:
  // 1) "None" option, 2) built-in presets, 3) additional texture choices.
  const selectChoices: SelectOption[] = [
    { id: "", label: "None" },
    ...defaultSkinNames.map((name) => ({ id: name, label: name })),
    ...additionalChoices.map((choice) => ({ id: choice, label: choice })),
  ];

  // Map the discriminated selection union into a Select option id.
  // Custom uploads do not correspond to a dropdown option, so they map to "None".
  const selectedChoiceId =
    selection.kind === "preset"
      ? selection.presetName
      : selection.kind === "textureChoice"
      ? selection.textureId
      : "";

  // Fallback to the first option ("None") if the id is not present.
  const selectedChoice =
    selectChoices.find((choice) => choice.id === selectedChoiceId) ??
    selectChoices[0];

  const loadPreset = React.useCallback(
    async (presetName: string, currentModelType: ModelType) => {
      try {
        setLoadError(null);
        // Bundled presets resolve to a URL based on both name and model type.
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
      // Normalize uploaded/fetched skins into the standard sheet format expected
      // by the renderer before creating a texture.
      const converted = await convertToStandardSkin(image);
      const texture = makeTextureFromImage(
        converted,
        standardWidth,
        standardHeight
      );

      // Custom input supersedes dropdown selection.
      onSelectionChange({ kind: "custom" });
      setLoadError(null);
      onChangeRef.current(texture);
    },
    [onSelectionChange, standardHeight, standardWidth]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Use the first selected file only; this input is single-file by design.
    const file = e.target.files ? e.target.files[0] ?? null : null;
    if (!file) {
      return;
    }

    // FileReader converts the local file into a data URL we can load as an image.
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
    // "None" clears both selected skin metadata and active texture.
    if (choice.id === "") {
      onSelectionChange({ kind: "none" });
      setLoadError(null);
      onChangeRef.current(null);
      return;
    }

    // Built-in presets are loaded by effect so model-type swaps stay centralized.
    if (defaultSet.has(choice.id)) {
      onSelectionChange({ kind: "preset", presetName: choice.id });
      return;
    }

    // Non-default dropdown choices map directly to existing textures.
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
    // Keep bundled preset texture in sync with the selected model type.
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

          {/* Alternate input path: load by Minecraft username instead of file. */}
          <MinecraftSkinFetchInput
            onImage={onCustomImage}
            onError={() => setLoadError("Failed to fetch skin from username.")}
          />
        </div>
      </div>

      {/* Top-level error surface for preset/upload/fetch failures. */}
      {loadError ? <div className="text-red-500 mb-4">{loadError}</div> : null}
    </>
  );
}
