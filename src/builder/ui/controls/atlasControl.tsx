import React from "react";

import {
  type Texture,
  makeTextureFromUrl,
} from "@genroot/builder/modules/texture";
import {
  type Rectangle,
  imageToTextureFrames,
} from "@genroot/builder/modules/textureData";
import { packImages } from "@genroot/builder/modules/texturePacking";
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
  const displayLabel = label ?? id;
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
      acceptedFileExtensions.some((extension) =>
        lowerFileName.endsWith(extension)
      )
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

  const getFrameCrop = (
    image: HTMLImageElement,
    [frameX, frameY, frameWidth, frameHeight]: Rectangle
  ): Rectangle => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return [0, 0, frameWidth, frameHeight];
    }

    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(
      frameX,
      frameY,
      frameWidth,
      frameHeight
    ).data;

    let minX = frameWidth;
    let minY = frameHeight;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < frameHeight; y += 1) {
      for (let x = 0; x < frameWidth; x += 1) {
        const alpha = pixels[(y * frameWidth + x) * 4 + 3] ?? 0;
        if (alpha === 0) {
          continue;
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    return maxX === -1
      ? [0, 0, frameWidth, frameHeight]
      : [minX, minY, maxX - minX + 1, maxY - minY + 1];
  };

  // Pack images into a single atlas and emit metadata for each tile.
  // Each tile is saved as a TextureFrame so generator scripts can use the
  // existing drawTexture rectangle shape.
  const createAtlas = (
    images: HTMLImageElement[]
  ): {
    url: string;
    framesJson: string;
    atlasWidth: number;
    atlasHeight: number;
  } => {
    if (images.length === 0) {
      throw new Error("No images to pack into atlas");
    }

    const estimateWidth = Math.max(
      standardWidth,
      standardHeight,
      Math.min(2048, Math.ceil(Math.sqrt(images.length)) * standardWidth)
    );

    const sourceFrameMap = new Map<
      string,
      { sourceIndex: number; sourceRectangle: Rectangle }
    >();

    const packableImages = images.flatMap((image, index) => {
      const id =
        (image as HTMLImageElement & { fileName?: string }).fileName ||
        `image_${index}`;
      const frames = imageToTextureFrames(id, image.width, image.height);

      return frames.map((frame) => {
        const crop = getFrameCrop(image, frame.rectangle);

        sourceFrameMap.set(frame.id, {
          sourceIndex: index,
          sourceRectangle: frame.rectangle,
        });

        return {
          id: frame.id,
          label: frame.label,
          rectangle: [
            0,
            0,
            frame.rectangle[2],
            frame.rectangle[3],
          ] satisfies Rectangle,
          crop,
          sourceIndex: index,
        };
      });
    });

    const packedAtlas = packImages(packableImages, estimateWidth);
    const atlasWidth = packedAtlas.atlasWidth;
    const atlasHeight = packedAtlas.atlasHeight;

    const canvas = document.createElement("canvas");
    canvas.width = atlasWidth;
    canvas.height = atlasHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    packedAtlas.frames.forEach((frame) => {
      const sourceInfo = sourceFrameMap.get(frame.id);
      if (!sourceInfo) {
        return;
      }

      const image = images[sourceInfo.sourceIndex];
      if (!image) {
        return;
      }

      const [sx, sy, sw, sh] = sourceInfo.sourceRectangle;
      context.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        frame.rectangle[0],
        frame.rectangle[1],
        sw,
        sh
      );
    });

    const url = canvas.toDataURL("image/png");
    const framesJson = JSON.stringify({
      atlasWidth,
      atlasHeight,
      frames: packedAtlas.frames,
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
        {displayLabel}
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
