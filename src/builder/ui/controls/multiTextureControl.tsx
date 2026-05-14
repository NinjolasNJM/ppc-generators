import React from "react";

import {
  type Texture,
  makeTextureFromUrl,
} from "@genroot/builder/modules/texture";
import { type SelectOption, Select } from "../form/select";

export function MultiTextureControl({
  id,
  choices,
  standardWidth,
  standardHeight,
  textures,
  onChange,
}: {
  id: string;
  choices: string[];
  standardWidth: number;
  standardHeight: number;
  textures: Map<string, Texture>;
  onChange: (texture: Texture | null, metadata: string | null) => void;
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

  const createAtlas = async (
    images: HTMLImageElement[]
  ): Promise<{ url: string; metadata: string; atlasWidth: number; atlasHeight: number }> => {
    if (images.length === 0) {
      throw new Error("No images to pack into atlas");
    }

    const estimateWidth = Math.max(
      standardWidth,
      standardHeight,
      Math.min(2048, Math.ceil(Math.sqrt(images.length)) * standardWidth)
    );
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let atlasHeight = 0;
    const entries: Array<{
      name: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    const positions = images.map((image) => {
      const width = image.width;
      const height = image.height;
      if (x + width > estimateWidth) {
        x = 0;
        y += rowHeight;
        atlasHeight += rowHeight;
        rowHeight = 0;
      }

      const position = { x, y, width, height };
      entries.push({
        name:
          (image as HTMLImageElement & { fileName?: string }).fileName ||
          `image_${entries.length}`,
        x,
        y,
        width,
        height,
      });

      x += width;
      rowHeight = Math.max(rowHeight, height);
      return position;
    });

    atlasHeight += rowHeight;
    const atlasWidth = estimateWidth;

    const canvas = document.createElement("canvas");
    canvas.width = atlasWidth;
    canvas.height = atlasHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    images.forEach((image, index) => {
      const { x, y } = positions[index]!;
      context.drawImage(image, x, y);
    });

    const url = canvas.toDataURL("image/png");
    const metadata = JSON.stringify({
      atlasWidth,
      atlasHeight,
      tiles: entries,
    });
    return { url, metadata, atlasWidth, atlasHeight };
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) {
      onChange(null, null);
      return;
    }

    try {
      const images = await Promise.all(files.map(loadImageFromFile));
      const { url, metadata, atlasWidth, atlasHeight } = await createAtlas(
        images
      );
      const texture = await makeTextureFromUrl(url, atlasWidth, atlasHeight);
      onChange(texture, metadata);
    } catch (error) {
      console.error(error);
    }
  };

  const onChoiceChange = (choice: SelectOption) => {
    const texture = textures.get(choice.id) ?? null;
    onChange(texture, null);
  };

  return (
    <fieldset className="mb-4 min-w-0">
      <legend className="font-bold mb-1" id={legendId}>
        {id}
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
              Upload {id} texture files
            </label>
            <input
              id={fileInputId}
              className="border border-gray-300 p-1 bg-white text-gray-400"
              type="file"
              multiple
              onChange={onInputChange}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
