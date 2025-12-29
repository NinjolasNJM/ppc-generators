import React from "react";

import {
  type Texture,
  makeTextureFromUrl,
  makeTextureFromImage,
} from "@genroot/builder/modules/texture";
import { makeImageFromUrl } from "@genroot/builder/modules/image";
import { convertToStandardSkin } from "@genroot/builder/modules/minecraftSkinConverter";
import { fetchSkinImage } from "@genroot/builder/modules/minecraftSkin";
import { type SelectOption, Select } from "../form/select";
import { Button, type ButtonState } from "../button/button";
import { ArrowPathIconWithSpin } from "../icon";
import { DEFAULT_SKIN_NAMES, getSkinUrl } from "@genroot/generators/_common/skins";

type FetchState =
  | { kind: "Idle" }
  | { kind: "Fetching" }
  | { kind: "Error"; error: unknown }
  | { kind: "Success"; image: HTMLImageElement };

function MinecraftSkin({
  onChange,
}: {
  onChange: (image: HTMLImageElement) => void;
}) {
  const [value, setValue] = React.useState("");
  const [fetchState, setFetchState] = React.useState<FetchState>({
    kind: "Idle",
  });

  const username = value.trim();

  const onFetchSkin = async () => {
    setFetchState({ kind: "Fetching" });

    // If it's an empty string the do nothing
    if (!username) {
      return;
    }

    try {
      const image = await fetchSkinImage(value);
      onChange(image);
      setFetchState({ kind: "Success", image });
    } catch (error) {
      console.error(error);
      setFetchState({ kind: "Error", error });
    }
  };

  const buttonState: ButtonState =
    !username || fetchState.kind === "Fetching" ? "Disabled" : "Ready";

  const showSpinner = fetchState.kind === "Fetching";

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
                onFetchSkin();
              }
            }}
          />
          {showSpinner ? (
            <span className="absolute top-2 right-4">
              <ArrowPathIconWithSpin />
            </span>
          ) : null}
        </div>

        <Button size="Small" state={buttonState} onClick={onFetchSkin}>
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

export function TextureControl({
  id,
  choices,
  standardWidth,
  standardHeight,
  enableMinecraftSkinInput,
  textures,
  getModelSelectValue,
  getModelStringValue,
  setModelStringValue,
  onChange,
}: {
  id: string;
  choices: string[];
  standardWidth: number;
  standardHeight: number;
  enableMinecraftSkinInput: boolean;
  textures: Map<string, Texture>;
  getModelSelectValue?: (id: string) => string | null;
  getModelStringValue?: (id: string) => string | null;
  setModelStringValue?: (id: string, value: string | null) => void;
  onChange: (image: Texture | null) => void;
}) {
  const makeNoneChoice = { id: "", label: "None" };

  // Merge defaults to the top of the choices, avoiding duplicates — but only
  // when `enableMinecraftSkinInput` is enabled. Otherwise present only the
  // generator-provided choices.
  const defaultNames = enableMinecraftSkinInput
    ? (DEFAULT_SKIN_NAMES as unknown as string[])
    : [];
  const defaultSet = new Set<string>(defaultNames);
  const additionalChoices = choices.filter((c) => !defaultSet.has(c));

  const selectChoices: SelectOption[] = [
    makeNoneChoice,
    ...(enableMinecraftSkinInput ? Array.from(defaultSet).map((n) => ({ id: n, label: n })) : []),
    ...additionalChoices.map((choice) => ({ id: choice, label: choice })),
  ];

  const storedSkinVarId = `${id} Skin Name`;

  const getCurrentModelType = (): string => {
    const key = `${id} Model Type`;
    const v = getModelSelectValue ? getModelSelectValue(key) : null;
    return v ?? "Wide";
  };

  const loadDefaultSkin = async (name: string) => {
    try {
      const modelType = getCurrentModelType();
      const url = getSkinUrl(name, modelType);
      const texture = await makeTextureFromUrl(url, standardWidth, standardHeight);
      onChange(texture);
    } catch (error) {
      console.error(error);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] ?? null : null;
    if (!file) {
      return;
    }
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      const result = e.target ? e.target.result : null;

      if (typeof result !== "string") {
        return;
      }

      // Clear any stored default skin name because user uploaded a custom texture
      setModelStringValue?.(storedSkinVarId, null);

      if (enableMinecraftSkinInput) {
        try {
          const image = await makeImageFromUrl(result);
          const converted = await convertToStandardSkin(image);
          const texture = makeTextureFromImage(
            converted,
            standardWidth,
            standardHeight
          );
          onChange(texture);
        } catch (error) {
          console.error(error);
        }
      } else {
        makeTextureFromUrl(result, standardWidth, standardHeight)
          .then(onChange)
          .catch((error) => console.error(error));
      }
    };

    fileReader.readAsDataURL(file);
  };

  const onChoiceChange = (choice: SelectOption) => {
    // If the user chooses a default skin name - load wide/slim automatically
    if (defaultSet.has(choice.id)) {
      // Persist the chosen name so we can swap variants when model type changes
      setModelStringValue?.(storedSkinVarId, choice.id);
      void loadDefaultSkin(choice.id);
      return;
    }

    // Otherwise select a named texture from the textures map
    const texture = textures.get(choice.id) ?? null;
    // Clear stored default name because this is a named texture or "None"
    setModelStringValue?.(storedSkinVarId, null);
    onChange(texture);
  };

  // NOTE: initial auto-detection removed — default detection was causing
  // implicit overrides of generator-provided `Skin` textures. The control
  // will still swap wide/slim variants when a user explicitly chooses a
  // bundled default (persisted via the `${id} Skin Name` variable).

  // React to model type changes: if a stored default skin name exists, swap to the appropriate variant
  React.useEffect(() => {
    const stored = getModelStringValue ? getModelStringValue(storedSkinVarId) : null;
    if (stored && defaultSet.has(stored)) {
      void loadDefaultSkin(stored);
    }
    // React when the per-texture model type changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getModelSelectValue ? getModelSelectValue(`${id} Model Type`) : undefined, getModelStringValue ? getModelStringValue(storedSkinVarId) : undefined]);

  return (
    <>
      <div className="font-bold mb-1">{id}</div>
      <div className="flex flex-wrap">
        <div className="flex mb-4 space-x-4 items-center mr-4">
          {selectChoices.length > 0 ? (
            <>
              <Select choices={selectChoices} onChange={onChoiceChange} />
              <div>or</div>
            </>
          ) : null}

          <input
            className="border border-gray-300 p-1 bg-white text-gray-400"
            type="file"
            onChange={onInputChange}
          />
        </div>
        {enableMinecraftSkinInput ? (
          <div className="flex mb-4 space-x-4 items-center">
            <div>or</div>
            <MinecraftSkin
              onChange={(image) => {
                // Using fetched image counts as a custom skin, so clear the stored default
                setModelStringValue?.(storedSkinVarId, null);
                const texture = makeTextureFromImage(image, 64, 64);
                onChange(texture);
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
