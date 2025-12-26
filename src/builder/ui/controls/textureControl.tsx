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

  // Merge defaults to the top of the choices, avoiding duplicates
  const defaultSet = new Set<string>(DEFAULT_SKIN_NAMES as unknown as string[]);
  const additionalChoices = choices.filter((c) => !defaultSet.has(c));

  const selectChoices: SelectOption[] = [
    makeNoneChoice,
    ...Array.from(defaultSet).map((n) => ({ id: n, label: n })),
    ...additionalChoices.map((choice) => ({ id: choice, label: choice })),
  ];

  const storedSkinVarId = `${id} Skin Name`;

  const getCurrentModelType = (): string => {
    const a = getModelSelectValue ? getModelSelectValue("Skin Model") : null;
    const b = getModelSelectValue ? getModelSelectValue("Skin Model Type") : null;
    return a ?? b ?? "Wide";
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

  // On mount: attempt to auto-detect if the provided `Skin` texture matches one
  // of the bundled default skins (wide or slim). If so, persist that default
  // skin name so we can auto-swap when the model type changes.
  React.useEffect(() => {
    const tryDetectDefaultSkin = async () => {
      try {
        // If enableMinecraftSkinInput is true, prefer the configured Default
        // bundled skin (if present) — or fall back to the first non-Steve
        // default — and load that immediately, ignoring the generator-provided
        // `Skin` texture.
        if (enableMinecraftSkinInput) {
          const hasDefault = Array.from(DEFAULT_SKIN_NAMES as unknown as string[]).includes(
            "Default"
          );
          const preferred = hasDefault
            ? "Default"
            : (Array.from(DEFAULT_SKIN_NAMES as unknown as string[]).find((n) => n !== "Steve") as string) ??
              (Array.from(DEFAULT_SKIN_NAMES as unknown as string[])[0] as string);

          setModelStringValue?.(storedSkinVarId, preferred);
          await loadDefaultSkin(preferred);
          return;
        }

        const currentTexture = textures.get(id);
        if (!currentTexture) return;

        const currentCanvas = currentTexture.imageWithCanvas.canvasWithContext.canvas;
        const currentData = currentCanvas.toDataURL();

        for (const name of Array.from(DEFAULT_SKIN_NAMES) as unknown as string[]) {
          try {
            const wideUrl = getSkinUrl(name, "Wide");
            const slimUrl = getSkinUrl(name, "Slim");

            const wideImg = await makeImageFromUrl(wideUrl);
            const wideCanvas = document.createElement("canvas");
            wideCanvas.width = wideImg.width;
            wideCanvas.height = wideImg.height;
            const wideCtx = wideCanvas.getContext("2d");
            if (!wideCtx) continue;
            wideCtx.drawImage(wideImg, 0, 0);
            const wideData = wideCanvas.toDataURL();
            if (wideData === currentData) {
              setModelStringValue?.(storedSkinVarId, name);
              // load correct variant for current model
              void loadDefaultSkin(name);
              return;
            }

            const slimImg = await makeImageFromUrl(slimUrl);
            const slimCanvas = document.createElement("canvas");
            slimCanvas.width = slimImg.width;
            slimCanvas.height = slimImg.height;
            const slimCtx = slimCanvas.getContext("2d");
            if (!slimCtx) continue;
            slimCtx.drawImage(slimImg, 0, 0);
            const slimData = slimCanvas.toDataURL();
            if (slimData === currentData) {
              setModelStringValue?.(storedSkinVarId, name);
              void loadDefaultSkin(name);
              return;
            }
          } catch (e) {
            // ignore and try next
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    void tryDetectDefaultSkin();
    // Only run once on mount or when the textures map changes for this id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textures, id, enableMinecraftSkinInput]);

  // React to model type changes: if a stored default skin name exists, swap to the appropriate variant
  React.useEffect(() => {
    const stored = getModelStringValue ? getModelStringValue(storedSkinVarId) : null;
    if (stored && defaultSet.has(stored)) {
      void loadDefaultSkin(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getModelSelectValue ? getModelSelectValue("Skin Model") : undefined, getModelSelectValue ? getModelSelectValue("Skin Model Type") : undefined, getModelStringValue ? getModelStringValue(storedSkinVarId) : undefined]);

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
