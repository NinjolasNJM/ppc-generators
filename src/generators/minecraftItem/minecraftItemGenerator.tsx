"use client";

import type {
  GeneratorDef,
  ImageDef,
  HistoryDef,
  TextureDef,
  ScriptDef,
  InstructionsDef,
  ThumbnailDef,
} from "@genroot/builder/modules/generatorDef";
import { type Generator } from "@genroot/builder/modules/generator";
import { type Blend } from "@genroot/builder/modules/renderers/drawTexture";
import {
  allTextureDefs,
  versionIdsItemsFirst as versionIds,
  findVersion,
} from "../_common/textures/textureVersions";
import {
  type SelectedTextureWithBlend,
  encodeSelectedTextureWithBlend,
  decodeSelectedTextureWithBlend,
  encodeSelectedTextureWithBlendArray,
  decodeSelectedTextureWithBlendArray,
} from "../_common/plugins/texturePicker/selectedTextureWithBlend";
import {
  parseAtlas,
  updateCustomTextureAtlas,
  updateCustomTextureUrl,
} from "../_common/textures/customTextureVersion";
import { TexturePicker } from "../_common/plugins/texturePicker/texturePicker";

/** [x, y, width, height] */
type Rectangle = [number, number, number, number];

import thumnbailImage from "./thumbnail/v2-thumbnail-256.jpeg";
import backgroundImage from "./images/Background.png";
import titleImage from "./images/Title.png";
import centerFoldTexture from "./textures/CenterFold.png";

const id = "minecraft-item";

const name = "Minecraft Item";

const history: HistoryDef = [
  "26 Jan 2022 lostminer - First release.",
  "05 Feb 2022 NinjolasNJM - Added fold lines and gap removal feature.",
];

const thumbnail: ThumbnailDef = {
  url: thumnbailImage.src,
};

const instructions: InstructionsDef = `
## Item Sizes

The Scope of this PR will be to add various crucial features that were left out
This includes a rework of the sizing system, and with it, the positions of the
items on the page. The dynamic inclusion of sizing on items allows for the proper 
usage of items like spears along with the quality of life of being able to more
flexiblty use different item sizes, and will come in handy if support for 3D items 
is ever added. Layering items on top of each other also allows for items 
like potions to be generated for the first time.
List of features to add:
Rework sizing mechanic:
multiple sizes allowed on page as it is based on per item.
change the default item sizes and add new ones and subrtract old ones.
Fix spears
(auto) gap placement
Overlaying Textures

`;

const images: ImageDef[] = [
  { id: "Background", url: backgroundImage.src },
  { id: "Title", url: titleImage.src },
];

const textures: TextureDef[] = [
  ...allTextureDefs,
  {
    id: "CenterFold",
    url: centerFoldTexture.src,
    standardWidth: 2,
    standardHeight: 128,
  },
];

function makeRegionId(textureId: string, rectangle: Rectangle): string {
  const [tileX, tileY] = rectangle;
  return `${textureId}-${tileX}-${tileY}`;
}

function getTileWidth(rectangle: Rectangle): number {
  const [, , tileWidth] = rectangle;
  return tileWidth;
}

const script: ScriptDef = (generator: Generator) => {
  const getSelectInputAsNumberWithDefault = (
    id: string,
    defaultValue: number
  ) => {
    const value = generator.getSelectInputValue(id);
    return value ? parseInt(value, 10) : defaultValue;
  };

  const drawItem = (
    textureId: string,
    rectangle: Rectangle,
    x: number,
    y: number,
    size: number,
    showFolds: boolean,
    blend?: Blend
  ) => {
    const tileWidth = getTileWidth(rectangle);
    const regionId = makeRegionId(textureId, rectangle);
    const textureOffset = getSelectInputAsNumberWithDefault(regionId, 0);
    const offset = (textureOffset * size) / tileWidth;
    generator.drawTexture(textureId, rectangle, [x + offset, y, size, size], {
      blend,
    });
    generator.drawTexture(
      textureId,
      rectangle,
      [x + size - offset, y, size, size],
      {
        flip: "Horizontal",
        blend,
      }
    );
    if (showFolds) {
      generator.drawTexture(
        "CenterFold",
        [0, 0, 2, size],
        [x + size - 1, y, 2, size]
      );
    }
  };

  const getSizeFromLabel = (sizeLabel: string | null | undefined) => {
    if (sizeLabel === sizeSmall) return 16 * 2;
    if (sizeLabel === sizeMedium) return 16 * 4;
    if (sizeLabel === sizeLarge) return 16 * 7;
    return 16 * 4;
  };

  const getLayoutForSize = (size: number) => {
    if (size <= 16 * 2) {
      return { maxCols: 6, maxRows: 13, border: 25 };
    }
    if (size <= 16 * 4) {
      return { maxCols: 4, maxRows: 10, border: 15 };
    }
    return { maxCols: 2, maxRows: 6, border: 20 };
  };

  const getItemSize = (selectedTextureFrame: SelectedTextureWithBlend) =>
    getSizeFromLabel(selectedTextureFrame.itemSize);

  const drawItems = (
    selectedTextureFrames: SelectedTextureWithBlend[],
    showFolds: boolean
  ) => {
    const maxItemSize = selectedTextureFrames.reduce(
      (maxSize, frame) =>
        frame.selectedTexture
          ? Math.max(maxSize, getItemSize(frame))
          : maxSize,
      0
    );
    const defaultItemSize = getSizeFromLabel(sizeMedium);
    const effectiveMaxSize = maxItemSize || defaultItemSize;
    const { maxCols, maxRows, border } = getLayoutForSize(effectiveMaxSize);
    const cellWidth = effectiveMaxSize * 2;
    const cellHeight = effectiveMaxSize;
    const maxItemsPerPage = maxCols * maxRows;
    const itemCount = selectedTextureFrames.length;
    const pageCount =
      itemCount > 0 ? Math.floor((itemCount - 1) / maxItemsPerPage) + 1 : 0;

    for (let page = 1; page <= pageCount; page++) {
      generator.usePage(`Page ${page}`);
      generator.drawImage("Background", [0, 0]);
      selectedTextureFrames.forEach((selectedTextureFrame, index) => {
        if (!selectedTextureFrame.selectedTexture) return;

        const { textureDefId, frame } = selectedTextureFrame.selectedTexture;
        const page = Math.floor(index / maxItemsPerPage) + 1;
        const pageId = `Page ${page}`;
        const col = index % maxCols;
        const row = Math.floor(index / maxCols) % maxRows;
        const size = getItemSize(selectedTextureFrame);
        const itemWidth = size * 2;
        const x = border + col * (cellWidth + border) + (cellWidth - itemWidth) / 2;
        const y = border + row * (cellHeight + border) + (cellHeight - size) / 2;

        const blend: Blend | undefined = selectedTextureFrame.blend
          ? { kind: "MultiplyHex", hex: selectedTextureFrame.blend }
          : undefined;

        generator.usePage(pageId);
        drawItem(textureDefId, frame.rectangle, x, y, size, showFolds, blend);
        generator.drawImage("Title", [0, 0]);
      });
    }
  };

  const sizeSmall = "Standard (200%)";
  const sizeMedium = "Medium (400%)";
  const sizeLarge = "Large (700%)";
  const sizes = [sizeSmall, sizeMedium, sizeLarge];

  // Show a drop down of different texture versions

  generator.defineSelectInput("Version", versionIds);

  const versionId = generator.getSelectInputValue("Version") ?? "";

  if (versionId === "custom") {
    generator.defineAtlasInput("custom", {
      label: "Custom",
      standardWidth: 32,
      standardHeight: 32,
      choices: [],
    });

    const customAtlas = parseAtlas(
      generator.getStringInputValue("custom Frames")
    );

    const customTexture = generator.getTexture("custom");
    if (customTexture) {
      const textureUrl = customTexture.imageWithCanvas.image.src;
      if (customAtlas && customAtlas.frames.length > 0) {
        updateCustomTextureAtlas(textureUrl, customAtlas);
      } else {
        updateCustomTextureUrl(textureUrl);
      }
    }
  }

  // Get the current selected version

  const textureVersion = findVersion(versionId);

  // Show a drop down for the size of the next item added

  generator.defineSelectInput("Item Size", sizes);

  const selectedItemSize =
    generator.getSelectInputValue("Item Size") ?? sizeMedium;

  // Show the Texture Picker
  // When a texture is selected, we need to encode it into a string variable

  const currentTextureJson = generator.getStringInputValue(
    "SelectedTextureFrame"
  );
  const currentTexture = currentTextureJson
    ? decodeSelectedTextureWithBlend(currentTextureJson)
    : null;

  generator.defineCustomStringInput("SelectedTextureFrame", (onChange) => {
    if (!textureVersion) {
      return null;
    }
    return (
      <TexturePicker
        versionId={versionId}
        enableRotation={false}
        blend={currentTexture ? currentTexture.blend : null}
        onTextureSelected={(selectedTexture) => {
          const newTexture: SelectedTextureWithBlend = {
            selectedTexture,
            blend: currentTexture ? currentTexture.blend : null,
          };
          onChange(encodeSelectedTextureWithBlend(newTexture));
        }}
        onBlendSelected={(blend) => {
          const newTexture: SelectedTextureWithBlend = {
            selectedTexture: currentTexture
              ? currentTexture.selectedTexture
              : null,
            blend,
          };
          onChange(encodeSelectedTextureWithBlend(newTexture));
        }}
      />
    );
  });

  // Define the Show Folds Variable

  generator.defineBooleanInput("Show Folds", true);

  const showFolds = generator.getBooleanInputValueWithDefault(
    "Show Folds",
    true
  );

  // Decode the selected texture

  const selectedTextureJson = generator.getStringInputValue(
    "SelectedTextureFrame"
  );
  const selectedTextureFrame: SelectedTextureWithBlend | null =
    selectedTextureJson
      ? decodeSelectedTextureWithBlend(selectedTextureJson)
      : null;

  // Decode the added textures

  const selectedTextureFramesJson = generator.getStringInputValue(
    "SelectedTextureFrames"
  );
  const selectedTextureFrames: SelectedTextureWithBlend[] =
    selectedTextureFramesJson
      ? decodeSelectedTextureWithBlendArray(selectedTextureFramesJson)
      : [];

  // Show a button which adds the selected texture to the page

  generator.defineButtonInput("Add Item", () => {
    if (selectedTextureFrame) {
      const newSelectedTextureFrame: SelectedTextureWithBlend = {
        ...selectedTextureFrame,
        itemSize: selectedItemSize,
      };
      const newSelectedTextureFrames: SelectedTextureWithBlend[] = [
        ...selectedTextureFrames,
        newSelectedTextureFrame,
      ];
      generator.setStringInputValue(
        "SelectedTextureFrames",
        encodeSelectedTextureWithBlendArray(newSelectedTextureFrames)
      );
    }
  });

  // Show a button which allows the items to be cleared

  generator.defineButtonInput("Clear", () => {
    generator.setStringInputValue(
      "SelectedTextureFrames",
      encodeSelectedTextureWithBlendArray([])
    );
  });

  // Show a blank page initially

  if (selectedTextureFrames.length === 0) {
    generator.usePage("Page 1");
    generator.drawImage("Background", [0, 0]);
    generator.drawImage("Title", [0, 0]);
  }

  drawItems(selectedTextureFrames, showFolds);
};

export const generator: GeneratorDef = {
  id,
  name,
  history,
  thumbnail,
  video: null,
  instructions,
  images,
  textures,
  script,
};
