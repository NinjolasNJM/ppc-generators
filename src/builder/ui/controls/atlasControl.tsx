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

    const sourceFrameMap = new Map<
      string,
      {
        sourceIndex: number;
        sourceRectangle: Rectangle;
        legacyName: string;
        frameIndex: number;
        frameCount: number;
      }
    >();

    const packableImages = images.flatMap((image, index) => {
      const imageName =
        (image as HTMLImageElement & { fileName?: string }).fileName ??
        `image_${index}`;
      const frames = imageToTextureFrames(imageName, image.width, image.height);

      return frames.map((frame, frameIndex) => {
        const crop = getFrameCrop(image, frame.rectangle);

        sourceFrameMap.set(frame.id, {
          sourceIndex: index,
          sourceRectangle: frame.rectangle,
          legacyName: frame.label,
          frameIndex,
          frameCount: frames.length,
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
    const widestFrame = packableImages.reduce(
      (max, frame) => Math.max(max, frame.rectangle[2]),
      0
    );
    const estimateWidth = Math.max(
      standardWidth,
      standardHeight,
      widestFrame,
      Math.min(
        2048,
        Math.ceil(Math.sqrt(packableImages.length)) * standardWidth
      )
    );

    const packedAtlas = packImages(packableImages, estimateWidth);
    const { atlasWidth, atlasHeight } = packedAtlas;

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
      frames: packedAtlas.frames.map((frame) => {
        const sourceInfo = sourceFrameMap.get(frame.id);
        return {
          ...frame,
          // Compatibility for the current pre-migration texture picker.
          name: sourceInfo?.legacyName ?? frame.label,
          frameIndex: sourceInfo?.frameIndex ?? 0,
          frameCount: sourceInfo?.frameCount ?? 1,
        };
      }),
    });

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
