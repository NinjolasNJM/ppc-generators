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
  type SelectedTexture,
  encodeSelectedTexture,
  decodeSelectedTexture,
  encodeSelectedTextures,
  decodeSelectedTextures,
} from "@genroot/builder/ui/texturePicker/selectedTexture";
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
  "16 May 2026 NinjolasNJM - Automated gap removal, reworked custom sizes, and various other improvements.",
];

const thumbnail: ThumbnailDef = {
  url: thumnbailImage.src,
};

const instructions: InstructionsDef = `
## Item Sizes

The generator supports four standard sizes:

- **Medium (400% scale)** - Most items in the hand, in item frames, or dropped on the ground
- **Large (700% scale)** - Most tools and weapons in the hand
- **Small (200% scale)** - Items in a shelf
- **Extra Large (1400% scale)** - Spears in the hand

The generator also supports custom sizes from 50% to 1600%.
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
    standardHeight: 512,
  },
];

function getFrameCrop(frame: TextureFrame): Rectangle {
  return frame.crop;
}

const script: ScriptDef = (generator: Generator) => {
  const drawItem = (
    textureId: string,
    frame: TextureFrame,
    crop: Rectangle,
    x: number,
    y: number,
    width: number,
    height: number,
    flippedSide: "Left" | "Right",
    blend?: Blend
  ) => {
    const [sourceX, sourceY] = frame.rectangle;
    const [cropX, cropY, cropWidth, cropHeight] = crop;
    const sourceRectangle: Rectangle = [
      sourceX + cropX,
      sourceY + cropY,
      cropWidth,
      cropHeight,
    ];
    const halfWidth = width / 2;
    const leftFlip = flippedSide === "Left" ? "Horizontal" : undefined;
    const rightFlip = flippedSide === "Right" ? "Horizontal" : undefined;

    generator.drawTexture(
      textureId,
      sourceRectangle,
      [x, y, halfWidth, height],
      {
        flip: leftFlip,
        blend,
      }
    );
    generator.drawTexture(
      textureId,
      sourceRectangle,
      [x + halfWidth, y, halfWidth, height],
      {
        flip: rightFlip,
        blend,
      }
    );
  };

  const pageMargin = 30;
  const itemMargin = 5;
  const innerPageWidth = A4.px.width - pageMargin * 2;
  const innerPageHeight = A4.px.height - pageMargin * 2;
  const defaultFrameSize = 16;

  const getFrameSizeScale = (frame: TextureFrame) =>
    defaultFrameSize / frame.rectangle[2];

  const getItemFrameSizeScale = (layers: SelectedTexture[]) =>
    getFrameSizeScale(layers[0]!.frame);

  const getItemDimensions = (selectedTextureFrame: SelectedTexture) => {
    const layers = getItemLayers(selectedTextureFrame);
    const scale =
      (selectedTextureFrame.itemScale ?? defaultItemScale) *
      getItemFrameSizeScale(layers);
    const [, , cropWidth, cropHeight] = getItemCropBounds(layers);
    return {
      width: cropWidth * scale * 2,
      height: cropHeight * scale,
    };
  };

  const getItemLayers = (selectedTextureFrame: SelectedTexture) =>
    selectedTextureFrame.itemLayers ?? [selectedTextureFrame];

  const doFrameSizesMatch = (a: TextureFrame, b: TextureFrame) =>
    a.rectangle[2] === b.rectangle[2] && a.rectangle[3] === b.rectangle[3];

  const canOverlayItem = (
    previousItem: SelectedTexture,
    newLayer: SelectedTexture
  ) =>
    getItemLayers(previousItem).every((layer) =>
      doFrameSizesMatch(layer.frame, newLayer.frame)
    );

  const getItemCropBounds = (layers: SelectedTexture[]): Rectangle => {
    const crops = layers.map((layer) => getFrameCrop(layer.frame));
    const minX = Math.min(...crops.map(([x]) => x));
    const minY = Math.min(...crops.map(([, y]) => y));
    const maxX = Math.max(...crops.map(([x, , width]) => x + width));
    const maxY = Math.max(...crops.map(([, y, , height]) => y + height));
    return [minX, minY, maxX - minX, maxY - minY];
  };

  const clipCropToFrame = (
    frame: TextureFrame,
    crop: Rectangle
  ): Rectangle | null => {
    const [, , frameWidth, frameHeight] = frame.rectangle;
    const [cropX, cropY, cropWidth, cropHeight] = crop;
    const x = Math.max(0, cropX);
    const y = Math.max(0, cropY);
    const right = Math.min(frameWidth, cropX + cropWidth);
    const bottom = Math.min(frameHeight, cropY + cropHeight);
    if (right <= x || bottom <= y) {
      return null;
    }
    return [x, y, right - x, bottom - y];
  };

  const getLayerDestination = (
    itemCropBounds: Rectangle,
    layerFrame: TextureFrame,
    x: number,
    y: number,
    scale: number
  ) => {
    const [itemCropX, itemCropY] = itemCropBounds;
    const layerCrop = clipCropToFrame(layerFrame, itemCropBounds);
    if (!layerCrop) {
      return null;
    }
    const [layerCropX, layerCropY, layerCropWidth, layerCropHeight] = layerCrop;
    return {
      crop: layerCrop,
      x: x + (layerCropX - itemCropX) * scale * 2,
      y: y + (layerCropY - itemCropY) * scale,
      width: layerCropWidth * scale * 2,
      height: layerCropHeight * scale,
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
    selectedTextureFrames: SelectedTexture[],
    showFolds: boolean
  ) => {
    const makeNewPageSkyline = (): SkylineNode[] => [
      { x: pageMargin, y: pageMargin, width: innerPageWidth },
    ];

    const pages: Array<{
      id: string;
      placements: Array<{
        index: number;
        selectedTextureFrame: SelectedTexture;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    }> = [];

    let currentPage = {
      id: "Page 1",
      placements: [] as Array<{
        index: number;
        selectedTextureFrame: SelectedTexture;
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

    selectedTextureFrames.forEach((selectedTextureFrame, index) => {
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
        index,
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
        const { index, selectedTextureFrame, x, y, width, height } = placement;
        const flippedSide = selectedTextureFrame.itemFlippedSide ?? "Right";
        const layers = getItemLayers(selectedTextureFrame);
        const itemScale =
          (selectedTextureFrame.itemScale ?? defaultItemScale) *
          getItemFrameSizeScale(layers);
        const itemCropBounds = getItemCropBounds(layers);

        layers.forEach((layer) => {
          const layerDestination = getLayerDestination(
            itemCropBounds,
            layer.frame,
            x,
            y,
            itemScale
          );
          if (!layerDestination) {
            return;
          }
          const layerBlend: Blend | undefined = layer.blend
            ? { kind: "MultiplyHex", hex: layer.blend }
            : undefined;

          drawItem(
            layer.textureDefId,
            layer.frame,
            layerDestination.crop,
            layerDestination.x,
            layerDestination.y,
            layerDestination.width,
            layerDestination.height,
            flippedSide,
            layerBlend
          );
        });
        if (showFolds) {
          generator.drawTexture(
            "CenterFold",
            [0, 0, 2, height],
            [x + width / 2 - 1, y, 2, height]
          );
        }
        generator.defineRegionInput([x, y, width, height], () => {
          const nextSelectedTextureFrames = selectedTextureFrames.map(
            (frame, frameIndex): SelectedTexture => {
              if (frameIndex !== index) {
                return frame;
              }

              const itemFlippedSide: "Left" | "Right" =
                (frame.itemFlippedSide ?? "Right") === "Right"
                  ? "Left"
                  : "Right";

              return { ...frame, itemFlippedSide };
            }
          );
          generator.setStringInputValue(
            "SelectedTextureFrames",
            encodeSelectedTextures(nextSelectedTextureFrames)
          );
        });
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
  const defaultItemScale = 4;
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
  const selectedCustomScalePercent =
    generator.getNumberVariable("Custom Scale (%)") ?? 400;

  if (selectedItemSize === sizeCustom) {
    generator.defineRangeInput("Custom Scale (%)", {
      min: 50,
      max: 1600,
      value: selectedCustomScalePercent,
      step: 50,
      showValue: true,
    });
  }

  const selectedItemScale =
    selectedItemSize === sizeCustom
      ? selectedCustomScalePercent / 100
      : scaleBySize.get(selectedItemSize) ?? defaultItemScale;

  // Show the Texture Picker
  // When a texture is selected, we need to encode it into a string variable

  const currentTextureJson = generator.getStringInputValue(
    "SelectedTextureFrame"
  );
  const currentTexture = currentTextureJson
    ? decodeSelectedTexture(currentTextureJson)
    : null;

  generator.defineCustomStringInput("SelectedTextureFrame", (onChange) => {
    if (!textureVersion) {
      return null;
    }
    return (
      <TexturePicker
        versionId={versionId}
        enableRotation={false}
        selectedTexture={currentTexture}
        onChange={(selectedTexture) => {
          onChange(encodeSelectedTexture(selectedTexture));
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
  const selectedTextureFrame: SelectedTexture | null = selectedTextureJson
    ? decodeSelectedTexture(selectedTextureJson)
    : null;

  // Decode the added textures

  const selectedTextureFramesJson = generator.getStringInputValue(
    "SelectedTextureFrames"
  );
  const selectedTextureFrames: SelectedTexture[] = selectedTextureFramesJson
    ? decodeSelectedTextures(selectedTextureFramesJson)
    : [];

  const addSelectedTextureFrame = (textureFrame: SelectedTexture) => [
    ...selectedTextureFrames,
    textureFrame,
  ];

  // Show a button which adds the selected texture to the page

  generator.defineButtonInput(
    "Add Item",
    () => {
      if (selectedTextureFrame) {
        const newSelectedTextureFrame: SelectedTexture = {
          ...selectedTextureFrame,
          itemScale: selectedItemScale,
          itemLayers: undefined,
        };
        generator.setStringInputValue(
          "SelectedTextureFrames",
          encodeSelectedTextures(
            addSelectedTextureFrame(newSelectedTextureFrame)
          )
        );
      }
    },
    "Blue"
  );

  // Show a button which overlays the selected texture onto the last added texture

  generator.defineButtonInput(
    "Overlay Item",
    () => {
      if (selectedTextureFrame) {
        const newLayer: SelectedTexture = {
          ...selectedTextureFrame,
          itemScale: selectedItemScale,
          itemLayers: undefined,
        };
        const previousItem = selectedTextureFrames.at(-1);
        const newSelectedTextureFrames: SelectedTexture[] =
          previousItem && canOverlayItem(previousItem, newLayer)
            ? [
                ...selectedTextureFrames.slice(0, -1),
                {
                  ...newLayer,
                  itemFlippedSide: newLayer.itemFlippedSide,
                  itemScale: selectedItemScale,
                  itemLayers: [...getItemLayers(previousItem), newLayer],
                },
              ]
            : addSelectedTextureFrame(newLayer);
        generator.setStringInputValue(
          "SelectedTextureFrames",
          encodeSelectedTextures(newSelectedTextureFrames)
        );
      }
    },
    "Green"
  );

  // Show a button which removes the last placed item or top overlay layer

  generator.defineButtonInput(
    "Remove Item",
    () => {
      const previousItem = selectedTextureFrames.at(-1);
      if (!previousItem) {
        return;
      }

      const previousLayers = getItemLayers(previousItem);
      const newSelectedTextureFrames: SelectedTexture[] =
        previousLayers.length > 1
          ? [
              ...selectedTextureFrames.slice(0, -1),
              {
                ...previousItem,
                itemLayers: previousLayers.slice(0, -1),
              },
            ]
          : selectedTextureFrames.slice(0, -1);

      generator.setStringInputValue(
        "SelectedTextureFrames",
        encodeSelectedTextures(newSelectedTextureFrames)
      );
    },
    "Red"
  );

  // Show a button which allows the items to be cleared

  generator.defineText("");

  generator.defineButtonInput(
    "Clear",
    () => {
      generator.setStringInputValue(
        "SelectedTextureFrames",
        encodeSelectedTextures([])
      );
    },
    "Red"
  );

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
