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
import { A4 } from "@genroot/builder/modules/modelPage";
import { type Blend } from "@genroot/builder/modules/renderers/drawTexture";
import { allTextureDefs, versionIds, findVersion } from "./ui/textureVersions";
import {
  type SelectedTextureWithBlend,
  encodeSelectedTextureWithBlend,
  decodeSelectedTextureWithBlend,
  encodeSelectedTextureWithBlendArray,
  decodeSelectedTextureWithBlendArray,
} from "./selectedTextureWithBlend";
import { TexturePicker } from "./ui/texturePicker";
import {
  parseAtlas,
  updateCustomTextureAtlas,
  updateCustomTextureUrl,
} from "../_common/customTextureVersion";

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

The generator supports four standard sizes:

* **Medium** - Good for general items (400% scale)
* **Large** - Good for weapons and tools (700% scale)
* **Extra Large** - Good for spears and oversized items (1400% scale)
* **Small** - Good for blocks as items (200% scale)

You can also choose a custom scale from 100% to 1600%.
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

  const pageMargin = 30;
  const itemMargin = 5;
  const innerPageWidth = A4.px.width - pageMargin * 2;
  const innerPageHeight = A4.px.height - pageMargin * 2;
  const defaultItemScale = 4;

  type SkylineNode = { x: number; y: number; width: number };

  const getItemScale = (selectedTextureFrame: SelectedTextureWithBlend) =>
    selectedTextureFrame.itemScale ?? defaultItemScale;

  const getItemSize = (selectedTextureFrame: SelectedTextureWithBlend) =>
    16 * getItemScale(selectedTextureFrame);

  const getSkylineY = (
    skyline: SkylineNode[],
    startIndex: number,
    requiredWidth: number
  ) => {
    let coveredWidth = 0;
    let y = skyline[startIndex]!.y;
    let index = startIndex;

    while (coveredWidth < requiredWidth) {
      if (index >= skyline.length) {
        return Infinity;
      }
      const node = skyline[index]!;
      y = Math.max(y, node.y);
      coveredWidth += node.width;
      index += 1;
    }

    return y;
  };

  const mergeSkyline = (skyline: SkylineNode[]) => {
    for (let index = 0; index < skyline.length - 1; index += 1) {
      const current = skyline[index]!;
      const next = skyline[index + 1]!;

      if (current.y === next.y) {
        current.width += next.width;
        skyline.splice(index + 1, 1);
        index -= 1;
      }
    }
  };

  const addSkylineNode = (
    skyline: SkylineNode[],
    x: number,
    y: number,
    width: number
  ) => {
    const right = x + width;
    let index = 0;

    while (index < skyline.length) {
      const node = skyline[index]!;
      const nodeRight = node.x + node.width;

      if (nodeRight <= x) {
        index += 1;
        continue;
      }

      if (node.x >= right) {
        break;
      }

      if (node.x < x) {
        const leftWidth = x - node.x;
        const rightWidth = nodeRight - right;
        node.width = leftWidth;

        if (rightWidth > 0) {
          skyline.splice(index + 1, 0, {
            x: right,
            y: node.y,
            width: rightWidth,
          });
        }
        index += 1;
        continue;
      }

      if (nodeRight > right) {
        const remainingWidth = nodeRight - right;
        skyline.splice(index, 1, {
          x: right,
          y: node.y,
          width: remainingWidth,
        });
        break;
      }

      skyline.splice(index, 1);
    }

    const insertIndex = skyline.findIndex((node) => node.x > x);
    const newNode: SkylineNode = { x, y, width };

    if (insertIndex === -1) {
      skyline.push(newNode);
    } else {
      skyline.splice(insertIndex, 0, newNode);
    }

    mergeSkyline(skyline);
  };

  const placeRect = (
    skyline: SkylineNode[],
    requiredWidth: number,
    requiredHeight: number
  ) => {
    let bestX = -1;
    let bestY = Infinity;
    let bestIndex = -1;

    for (let index = 0; index < skyline.length; index += 1) {
      const node = skyline[index]!;
      const rectRight = node.x + requiredWidth;

      if (rectRight > pageMargin + innerPageWidth) {
        continue;
      }

      const y = getSkylineY(skyline, index, requiredWidth);
      if (y + requiredHeight > pageMargin + innerPageHeight) {
        continue;
      }

      if (y < bestY || (y === bestY && node.x < bestX)) {
        bestX = node.x;
        bestY = y;
        bestIndex = index;
      }
    }

    if (bestIndex === -1) {
      return null;
    }

    addSkylineNode(skyline, bestX, bestY + requiredHeight, requiredWidth);
    return { x: bestX, y: bestY };
  };

  const drawItems = (
    selectedTextureFrames: SelectedTextureWithBlend[],
    showFolds: boolean
  ) => {
    const makeNewPageSkyline = (): SkylineNode[] => [
      { x: pageMargin, y: pageMargin, width: innerPageWidth },
    ];

    const pages: Array<{
      id: string;
      placements: Array<{
        selectedTextureFrame: SelectedTextureWithBlend;
        x: number;
        y: number;
        size: number;
      }>;
    }> = [];

    let currentPage = {
      id: "Page 1",
      placements: [] as Array<{
        selectedTextureFrame: SelectedTextureWithBlend;
        x: number;
        y: number;
        size: number;
      }>,
    };
    let skyline = makeNewPageSkyline();

    const pushPage = () => {
      pages.push(currentPage);
      const nextPageIndex = pages.length + 1;
      currentPage = {
        id: `Page ${nextPageIndex}`,
        placements: [],
      };
      skyline = makeNewPageSkyline();
    };

    selectedTextureFrames.forEach((selectedTextureFrame) => {
      if (!selectedTextureFrame.selectedTexture) {
        return;
      }

      const size = getItemSize(selectedTextureFrame);
      const requiredWidth = size * 2 + itemMargin * 2;
      const requiredHeight = size + itemMargin * 2;
      let placement = placeRect(skyline, requiredWidth, requiredHeight);

      if (!placement && currentPage.placements.length > 0) {
        pushPage();
        placement = placeRect(skyline, requiredWidth, requiredHeight);
      }

      if (!placement) {
        placement = { x: pageMargin, y: pageMargin };
      }

      currentPage.placements.push({
        selectedTextureFrame,
        x: placement.x + itemMargin,
        y: placement.y + itemMargin,
        size,
      });
    });

    if (currentPage.placements.length > 0 || pages.length === 0) {
      pages.push(currentPage);
    }

    pages.forEach((page) => {
      generator.usePage(page.id);
      generator.drawImage("Background", [0, 0]);
      page.placements.forEach((placement) => {
        const { selectedTextureFrame, x, y, size } = placement;
        if (!selectedTextureFrame.selectedTexture) {
          return;
        }
        const { textureDefId, frame } = selectedTextureFrame.selectedTexture;
        const blend: Blend | undefined = selectedTextureFrame.blend
          ? { kind: "MultiplyHex", hex: selectedTextureFrame.blend }
          : undefined;
        drawItem(textureDefId, frame.rectangle, x, y, size, showFolds, blend);
      });
      generator.drawImage("Title", [0, 0]);
    });
  };

  const sizeMedium = "Medium (400%)";
  const sizeLarge = "Large (700%)";
  const sizeExtraLarge = "Extra Large (1400%)";
  const sizeSmall = "Small (200%)";
  const sizeCustom = "Custom";
  const sizes = [sizeMedium, sizeLarge, sizeExtraLarge, sizeSmall, sizeCustom];
  const scaleBySize = new Map([
    [sizeMedium, 4],
    [sizeLarge, 7],
    [sizeExtraLarge, 14],
    [sizeSmall, 2],
  ]);

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

    const customAtlas = parseAtlas(generator.getStringInputValue("custom Frames"));
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

  // Show a drop down of sizes

  generator.defineSelectInput("Item Size", sizes);

  const selectedItemSize =
    generator.getSelectInputValue("Item Size") ?? sizeMedium;
  const selectedCustomScalePercent =
    generator.getNumberVariable("Custom Scale (%)") ?? 400;

  if (selectedItemSize === sizeCustom) {
    generator.defineRangeInput("Custom Scale (%)", {
      min: 100,
      max: 1600,
      value: selectedCustomScalePercent,
      step: 100,
    });
  }

  const selectedItemScale =
    selectedItemSize === sizeCustom
      ? selectedCustomScalePercent / 100
      : scaleBySize.get(selectedItemSize) ?? defaultItemScale;

  // Decode the current selected texture

  const currentTextureJson = generator.getStringInputValue(
    "SelectedTextureFrame"
  );
  const currentTexture: SelectedTextureWithBlend | null = currentTextureJson
    ? decodeSelectedTextureWithBlend(currentTextureJson)
    : null;
  if (
    currentTexture !== null &&
    currentTexture.selectedTexture !== null &&
    currentTexture.selectedTexture.textureDefId !== versionId
  ) {
    // Clear stale selections when the active texture version changes.
    generator.setStringInputValue("SelectedTextureFrame", "");
  }
  const resolvedCurrentTextureJson = generator.getStringInputValue(
    "SelectedTextureFrame"
  );
  const resolvedCurrentTexture: SelectedTextureWithBlend | null =
    resolvedCurrentTextureJson
      ? decodeSelectedTextureWithBlend(resolvedCurrentTextureJson)
      : null;

  // Show the Texture Picker
  // When a texture is selected, we need to encode it into a string variable

  generator.defineCustomStringInput("SelectedTextureFrame", (onChange) => {
    if (!textureVersion) {
      return null;
    }
    return (
      <TexturePicker
        textureVersion={textureVersion}
        blend={resolvedCurrentTexture ? resolvedCurrentTexture.blend : null}
        onSelect={(selectedTexture) => {
          const newTexture: SelectedTextureWithBlend = {
            selectedTexture,
            blend: resolvedCurrentTexture ? resolvedCurrentTexture.blend : null,
          };
          onChange(encodeSelectedTextureWithBlend(newTexture));
        }}
        onBlendSelected={(blend) => {
          const newTexture: SelectedTextureWithBlend = {
            selectedTexture: resolvedCurrentTexture
              ? resolvedCurrentTexture.selectedTexture
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

  const selectedTextureFrame: SelectedTextureWithBlend | null =
    resolvedCurrentTexture;

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
      const newSelectedTextureFrames: SelectedTextureWithBlend[] = [
        ...selectedTextureFrames,
        {
          ...selectedTextureFrame,
          itemScale: selectedItemScale,
        },
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
