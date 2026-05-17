import React from "react";

import {
  type Texture,
  makeTextureFromUrl,
} from "@genroot/builder/modules/texture";
import { type SelectOption, Select } from "../form/select";
import {
  packAtlasImages,
  type AtlasImage,
} from "./atlasControlLogic";

export function AtlasControl({
  id,
  label,
  choices,
  standardWidth,
  standardHeight,
  textures,
  onChange,
}: {
  id: string;
  label?: string;
  choices: string[];
  standardWidth: number;
  standardHeight: number;
  textures: Map<string, Texture>;
  onChange: (texture: Texture | null, frames: string | null) => void;
}) {
  const baseId = React.useId();
  const legendId = `${baseId}-legend`;
  const selectId = `${baseId}-select`;
  const fileInputId = `${baseId}-file`;
  const selectChoices: SelectOption[] =
    choices.length > 0
      ? [
          { id: "", label: "None" },
          ...choices.map((choice) => ({ id: choice, label: choice })),
        ]
      : [];

  const acceptedFileTypes = ["image/png", "image/jpeg"];
  const acceptedFileExtensions = [".png", ".jpg", ".jpeg"];
  const acceptAttribute = "image/png,image/jpeg,.png,.jpg,.jpeg";

  const isSupportedFile = (file: File) => {
    const lowerFileName = file.name.toLowerCase();
    return (
      acceptedFileTypes.includes(file.type) ||
      acceptedFileExtensions.some((extension) =>
        lowerFileName.endsWith(extension)
      )
    );
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      image.src = url;
      (image as HTMLImageElement & { fileName?: string }).fileName = file.name;
    });
  };

  const createAtlas = (
    images: HTMLImageElement[]
  ): { url: string; framesJson: string; atlasWidth: number; atlasHeight: number } => {
    const atlasImages: AtlasImage[] = images.map((image, index) => ({
      name:
        (image as HTMLImageElement & { fileName?: string }).fileName ??
        `image_${index}`,
      width: image.width,
      height: image.height,
    }));

    const atlas = packAtlasImages(atlasImages, standardWidth, standardHeight);
    const { atlasWidth, atlasHeight, frames } = atlas;

    const canvas = document.createElement("canvas");
    canvas.width = atlasWidth;
    canvas.height = atlasHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    images.forEach((image, index) => {
      const [x, y] = frames[index]!.rectangle;
      context.drawImage(image, x, y);
    });

    const url = canvas.toDataURL("image/png");
    const framesJson = JSON.stringify(atlas);

    return { url, framesJson, atlasWidth, atlasHeight };
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) {
      onChange(null, null);
      return;
    }

    const supportedFiles = files.filter(isSupportedFile);
    if (supportedFiles.length === 0) {
      onChange(null, null);
      return;
    }

    const loadedImages = await Promise.allSettled(
      supportedFiles.map(loadImageFromFile)
    );

    const images = loadedImages
      .filter(
        (result): result is PromiseFulfilledResult<HTMLImageElement> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    if (images.length === 0) {
      onChange(null, null);
      return;
    }

    const { url, framesJson, atlasWidth, atlasHeight } = createAtlas(images);
    const texture = await makeTextureFromUrl(url, atlasWidth, atlasHeight);
    onChange(texture, framesJson);
  };

  const onChoiceChange = (choice: SelectOption) => {
    const texture = textures.get(choice.id) ?? null;
    onChange(texture, null);
  };

  return (
    <fieldset className="mb-4 min-w-0">
      <legend className="font-bold mb-1" id={legendId}>
        {label ?? id}
      </legend>
      <div className="flex flex-wrap">
        <div className="flex mb-4 space-x-4 items-center mr-4">
          {selectChoices.length > 0 ? (
            <>
              <Select
                id={selectId}
                ariaLabelledBy={legendId}
                choices={selectChoices}
                onChange={onChoiceChange}
              />
              <div>or</div>
            </>
          ) : null}

          <div>
            <label className="sr-only" htmlFor={fileInputId}>
              Select one or more {id} texture files
            </label>
            <input
              id={fileInputId}
              className="border border-gray-300 p-1 bg-white text-gray-400"
              type="file"
              accept={acceptAttribute}
              multiple
              onChange={onInputChange}
            />
            <p className="mt-2 text-sm text-gray-600">
              Select one or more texture files.
            </p>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
