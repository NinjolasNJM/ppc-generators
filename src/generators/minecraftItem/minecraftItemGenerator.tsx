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
import { type TextureFrame } from "@genroot/builder/modules/textureData";
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
import { A4 } from "@genroot/builder/modules/modelPage";
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

function getFrameCrop(frame: TextureFrame): Rectangle {
  return frame.crop ?? [0, 0, frame.rectangle[2], frame.rectangle[3]];
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
    frame: TextureFrame,
    x: number,
    y: number,
    width: number,
    height: number,
    showFolds: boolean,
    blend?: Blend
  ) => {
    const [sourceX, sourceY] = frame.rectangle;
    const [cropX, cropY, cropWidth, cropHeight] = getFrameCrop(frame);
    const sourceRectangle: Rectangle = [
      sourceX + cropX,
      sourceY + cropY,
      cropWidth,
      cropHeight,
    ];
    const tileWidth = getTileWidth(sourceRectangle);
    const regionId = makeRegionId(textureId, sourceRectangle);
    const halfWidth = width / 2;
    const textureOffset = getSelectInputAsNumberWithDefault(regionId, 0);
    const offset = (textureOffset * halfWidth) / tileWidth;

    generator.drawTexture(
      textureId,
      sourceRectangle,
      [x + offset, y, halfWidth, height],
      {
        blend,
      }
    );
    generator.drawTexture(
      textureId,
      sourceRectangle,
      [x + halfWidth - offset, y, halfWidth, height],
      {
        flip: "Horizontal",
        blend,
      }
    );
    if (showFolds) {
      generator.drawTexture(
        "CenterFold",
        [0, 0, 2, height],
        [x + halfWidth - 1, y, 2, height]
      );
    }
  };

  const pageMargin = 30;
  const itemMargin = 5;
  const innerPageWidth = A4.px.width - pageMargin * 2;
  const innerPageHeight = A4.px.height - pageMargin * 2;

  const getSizeFromLabel = (sizeLabel: string | null | undefined) => {
    if (sizeLabel === sizeSmall) return 16 * 2;
    if (sizeLabel === sizeMedium) return 16 * 4;
    if (sizeLabel === sizeLarge) return 16 * 8;
    return 16 * 4;
  };

  const getItemDimensions = (
    selectedTextureFrame: SelectedTextureWithBlend
  ) => {
    const size = getSizeFromLabel(selectedTextureFrame.itemSize);
    const frame = selectedTextureFrame.selectedTexture?.frame;
    if (!frame) {
      return { width: size * 2, height: size };
    }

    const [, , frameWidth, frameHeight] = frame.rectangle;
    const [, , cropWidth, cropHeight] = getFrameCrop(frame);
    return {
      width: ((size * cropWidth) / frameWidth) * 2,
      height: (size * cropHeight) / frameHeight,
    };
  };

  type SkylineNode = { x: number; y: number; width: number };

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
        width: number;
        height: number;
      }>;
    }> = [];

    let currentPage = {
      id: "Page 1",
      placements: [] as Array<{
        selectedTextureFrame: SelectedTextureWithBlend;
        x: number;
        y: number;
        width: number;
        height: number;
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

      const { width, height } = getItemDimensions(selectedTextureFrame);
      const requiredWidth = width + itemMargin * 2;
      const requiredHeight = height + itemMargin * 2;
      let placement = placeRect(skyline, requiredWidth, requiredHeight);

      if (!placement) {
        if (currentPage.placements.length > 0) {
          pushPage();
          placement = placeRect(skyline, requiredWidth, requiredHeight);
        }
      }

      if (!placement) {
        // Layout failed if the item is larger than a single page minus margins.
        placement = { x: pageMargin, y: pageMargin };
      }

      currentPage.placements.push({
        selectedTextureFrame,
        x: placement.x + itemMargin,
        y: placement.y + itemMargin,
        width,
        height,
      });
    });

    if (currentPage.placements.length > 0 || pages.length === 0) {
      pages.push(currentPage);
    }

    pages.forEach((page) => {
      generator.usePage(page.id);
      generator.drawImage("Background", [0, 0]);
      page.placements.forEach((placement) => {
        const { selectedTextureFrame, x, y, width, height } = placement;
        const { textureDefId, frame } = selectedTextureFrame.selectedTexture!;
        const blend: Blend | undefined = selectedTextureFrame.blend
          ? { kind: "MultiplyHex", hex: selectedTextureFrame.blend }
          : undefined;

        drawItem(textureDefId, frame, x, y, width, height, showFolds, blend);
      });
      generator.drawImage("Title", [0, 0]);
    });
  };

  const sizeSmall = "Standard (200%)";
  const sizeMedium = "Medium (400%)";
  const sizeLarge = "Large (800%)";
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
