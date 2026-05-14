import React from "react";

import {
  type Texture,
  makeTextureFromUrl,
} from "@genroot/builder/modules/texture";
import { type TextureFrame } from "@genroot/builder/modules/textureData";
import { type SelectOption, Select } from "../form/select";

/**
 * AtlasControl accepts multiple image files and packs them into a single atlas.
 *
 * The selected images are merged into one atlas texture, and metadata is emitted
 * as a JSON string containing atlas dimensions and `frames` information. Scripts
 * can read `${id} Frames` and use each frame's rectangle with generator.drawTexture.
 */
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

  // Only PNG and JPEG image files are supported for atlas input.
  // Browsers can use the accept attribute to limit selection,
  // but we also validate files after selection.
  const acceptedFileTypes = ["image/png", "image/jpeg"];
  const acceptedFileExtensions = [".png", ".jpg", ".jpeg"];
  const acceptAttribute = "image/png,image/jpeg,.png,.jpg,.jpeg";

  const isSupportedFile = (file: File) => {
    const lowerFileName = file.name.toLowerCase();
    return (
      acceptedFileTypes.includes(file.type) ||
      acceptedFileExtensions.some((extension) => lowerFileName.endsWith(extension))
    );
  };

  // Load a file into an image and attach the original file name.
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

  // Pack images into a single atlas and emit metadata for each tile.
  // Each tile is saved as a TextureFrame so generator scripts can use the
  // existing drawTexture rectangle shape.
  const createAtlas = (
    images: HTMLImageElement[]
  ): { url: string; framesJson: string; atlasWidth: number; atlasHeight: number } => {
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
    const tiles: TextureFrame[] = [];

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
      const fileName =
        (image as HTMLImageElement & { fileName?: string }).fileName ||
        `image_${tiles.length}`;
      tiles.push({
        id: fileName,
        name: fileName,
        rectangle: [x, y, width, height],
        frameIndex: 0,
        frameCount: 1,
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
    const framesJson = JSON.stringify({
      atlasWidth,
      atlasHeight,
      frames: tiles,
    });
    return { url, framesJson, atlasWidth, atlasHeight };
  };

  // When files are selected, load only supported image files and skip invalid ones.
  // If no valid images remain, emit null to clear the current texture state.
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
        {label}
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
              accept={acceptAttribute}
              multiple
              onChange={onInputChange}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
