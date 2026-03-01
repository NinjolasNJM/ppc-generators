import React from "react";

import {
  type Texture,
  makeTextureFromImage,
  makeTextureFromUrl,
} from "@genroot/builder/modules/texture";
import { makeImageFromUrl } from "@genroot/builder/modules/image";
import { convertToStandardSkin } from "@genroot/builder/modules/minecraftSkinConverter";
import { fetchSkinImage } from "@genroot/builder/modules/minecraftSkin";
import { defaultSkinNames } from "@genroot/generators/_common/skins";
import { type SelectOption, Select } from "../form/select";
import { Button, type ButtonState } from "../button/button";
import { ArrowPathIconWithSpin } from "../icon";
import {
  type ModelType,
  resolveBundledMinecraftSkin,
} from "./minecraftSkinResolver";

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
  textures,
  onChange,
}: {
  id: string;
  choices: string[];
  standardWidth: number;
  standardHeight: number;
  modelType: ModelType;
  textures: Map<string, Texture>;
  onChange: (image: Texture | null) => void;
}) {
  const currentTexture = textures.get(id) ?? null;
  const onChangeRef = React.useRef(onChange);

  const inferredPresetName = React.useMemo(() => {
    if (!currentTexture) {
      return null;
    }

    const loadedImageUrl = currentTexture.imageWithCanvas.image.src;
    const modelTypes: ModelType[] = ["Wide", "Slim"];

    for (const presetName of defaultSkinNames) {
      for (const candidateModelType of modelTypes) {
        const bundledSkinUrl = resolveBundledMinecraftSkin(
          presetName,
          candidateModelType
        );
        if (
          loadedImageUrl === bundledSkinUrl ||
          loadedImageUrl.endsWith(bundledSkinUrl) ||
          bundledSkinUrl.endsWith(loadedImageUrl)
        ) {
          return presetName;
        }
      }
    }

    return null;
  }, [currentTexture]);
  const [selectedChoiceId, setSelectedChoiceId] = React.useState(
    inferredPresetName ?? ""
  );
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
  const selectedChoice =
    selectChoices.find((choice) => choice.id === selectedChoiceId) ??
    selectChoices[0];

  React.useEffect(() => {
    if (!inferredPresetName) {
      return;
    }
    setSelectedChoiceId((previousChoiceId) =>
      previousChoiceId === inferredPresetName
        ? previousChoiceId
        : inferredPresetName
    );
  }, [inferredPresetName]);

  const loadPreset = React.useCallback(
    async (presetName: string, currentModelType: ModelType) => {
      try {
        setLoadError(null);
        const url = resolveBundledMinecraftSkin(presetName, currentModelType);
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
      setSelectedChoiceId("");
      setLoadError(null);
      onChangeRef.current(texture);
    },
    [standardHeight, standardWidth]
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
    setSelectedChoiceId(choice.id);

    if (choice.id === "") {
      setLoadError(null);
      onChangeRef.current(null);
      return;
    }

    if (!defaultSet.has(choice.id)) {
      setLoadError(null);
      const texture = textures.get(choice.id) ?? null;
      onChangeRef.current(texture);
    }
  };

  React.useEffect(() => {
    if (defaultSet.has(selectedChoiceId)) {
      void loadPreset(selectedChoiceId, modelType);
    }
  }, [defaultSet, loadPreset, modelType, selectedChoiceId]);

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
