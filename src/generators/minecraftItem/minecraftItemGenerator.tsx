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
import {
  type Generator,
  type TexturePlugin,
} from "@genroot/builder/modules/generator";
import { type TextureFrame } from "@genroot/builder/modules/textureData";
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
import { itemTintChoiceGroups } from "../_common/plugins/texturePicker/tints";
import {
  makeNextFlip,
  type Flip,
} from "@genroot/builder/ui/texturePicker/flip";
import {
  rotationToDegrees,
  type Rotation,
} from "@genroot/builder/ui/texturePicker/rotation";
import {
  defineGlintControls,
  itemGlintTextureDefs,
} from "../_common/plugins/glint";

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
  ...itemGlintTextureDefs,
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
  const drawItemHalf = (
    selectedTexture: SelectedTexture,
    source: Rectangle,
    x: number,
    y: number,
    width: number,
    height: number,
    flip: Flip = "None",
    plugin?: TexturePlugin
  ) => {
    const {
      textureDefId,
      frame,
      rotation,
      flip: selectedFlip,
      blend,
    } = selectedTexture;
    const [nextFlip, nextRotation] = makeNextFlip(selectedFlip, flip, rotation);
    const [frameX, frameY] = frame.rectangle;
    const sourceScale = getFrameSourceScale(frame);
    const [sourceX, sourceY, sourceWidth, sourceHeight] = source;
    const sourceRectangle: Rectangle = [
      frameX + sourceX * sourceScale,
      frameY + sourceY * sourceScale,
      sourceWidth * sourceScale,
      sourceHeight * sourceScale,
    ];

    generator.drawTexture(
      textureDefId,
      sourceRectangle,
      [x, y, width, height],
      {
        flip: nextFlip,
        rotate: rotationToDegrees(nextRotation),
        blend: blend ? { kind: "MultiplyHex", hex: blend } : undefined,
        plugin,
      }
    );
  };

  const pageMargin = 30;
  const itemMargin = 5;
  const innerPageWidth = A4.px.width - pageMargin * 2;
  const innerPageHeight = A4.px.height - pageMargin * 2;
  const defaultFrameSize = 16;

  const getFrameSourceScale = (frame: TextureFrame) => {
    const [, , width, height] = frame.rectangle;
    return width === height &&
      width > 0 &&
      width % defaultFrameSize === 0 &&
      height % defaultFrameSize === 0
      ? width / defaultFrameSize
      : 1;
  };

  const getFrameLogicalCrop = (frame: TextureFrame): Rectangle => {
    const scale = getFrameSourceScale(frame);
    const [x, y, width, height] = getFrameCrop(frame);
    return [x / scale, y / scale, width / scale, height / scale];
  };

  const getFrameLogicalBounds = (frame: TextureFrame): Rectangle => {
    const scale = getFrameSourceScale(frame);
    const [, , width, height] = frame.rectangle;
    return [0, 0, width / scale, height / scale];
  };

  const rotateCrop = (
    crop: Rectangle,
    bounds: Rectangle,
    rotation: Rotation
  ): Rectangle => {
    const [x, y, width, height] = crop;
    const [, , boundsWidth, boundsHeight] = bounds;

    switch (rotation) {
      case "Rot0":
        return crop;
      case "Rot90":
        return [y, boundsWidth - (x + width), height, width];
      case "Rot180":
        return [
          boundsWidth - (x + width),
          boundsHeight - (y + height),
          width,
          height,
        ];
      case "Rot270":
        return [boundsHeight - (y + height), x, height, width];
    }
  };

  const flipCrop = (
    crop: Rectangle,
    bounds: Rectangle,
    flip: Flip
  ): Rectangle => {
    const [x, y, width, height] = crop;
    const [, , boundsWidth, boundsHeight] = bounds;

    switch (flip) {
      case "None":
        return crop;
      case "Horizontal":
        return [boundsWidth - (x + width), y, width, height];
      case "Vertical":
        return [x, boundsHeight - (y + height), width, height];
    }
  };

  const getTransformedCrop = (
    layer: SelectedTexture,
    appliedFlip: Flip
  ): Rectangle => {
    const [flip, rotation] = makeNextFlip(
      layer.flip,
      appliedFlip,
      layer.rotation
    );
    const crop = getFrameLogicalCrop(layer.frame);
    const bounds = getFrameLogicalBounds(layer.frame);
    const flippedCrop = flipCrop(crop, bounds, flip);
    return rotateCrop(flippedCrop, bounds, rotation);
  };

  const getCropBounds = (crops: Rectangle[]): Rectangle => {
    const minX = Math.min(...crops.map(([x]) => x));
    const minY = Math.min(...crops.map(([, y]) => y));
    const maxX = Math.max(...crops.map(([x, , width]) => x + width));
    const maxY = Math.max(...crops.map(([, y, , height]) => y + height));
    return [minX, minY, maxX - minX, maxY - minY];
  };

  const getItemHalfCropBounds = (
    layers: SelectedTexture[],
    appliedFlip: Flip
  ): Rectangle =>
    getCropBounds(
      layers.map((layer) => getTransformedCrop(layer, appliedFlip))
    );

  const getItemLayout = (layers: SelectedTexture[]) => {
    const leftBounds = getItemHalfCropBounds(layers, "None");
    const rightBounds = getItemHalfCropBounds(layers, "Horizontal");
    const minY = Math.min(leftBounds[1], rightBounds[1]);
    const maxY = Math.max(
      leftBounds[1] + leftBounds[3],
      rightBounds[1] + rightBounds[3]
    );

    return {
      leftBounds,
      rightBounds,
      height: maxY - minY,
      minY,
    };
  };

  const getItemDimensions = (selectedTextureFrame: SelectedTexture) => {
    const layers = getItemLayers(selectedTextureFrame);
    const scale = selectedTextureFrame.itemScale ?? defaultItemScale;
    const { leftBounds, rightBounds, height } = getItemLayout(layers);
    const leftHalfWidth = leftBounds[2] * scale;
    const rightHalfWidth = rightBounds[2] * scale;
    return {
      leftHalfWidth,
      rightHalfWidth,
      width: leftHalfWidth + rightHalfWidth,
      height: height * scale,
    };
  };

  const getItemLayers = (selectedTextureFrame: SelectedTexture) =>
    selectedTextureFrame.itemLayers ?? [selectedTextureFrame];

  const getLayerHalfDestination = (
    halfCropBounds: Rectangle,
    itemMinY: number,
    layer: SelectedTexture,
    x: number,
    y: number,
    scale: number,
    appliedFlip: Flip
  ) => {
    const [halfCropX] = halfCropBounds;
    const layerCrop = getFrameLogicalCrop(layer.frame);
    const [, rotation] = makeNextFlip(layer.flip, appliedFlip, layer.rotation);
    const [layerCropX, layerCropY] = getTransformedCrop(layer, appliedFlip);
    const [, , cropWidth, cropHeight] = layerCrop;
    const drawWidth = cropWidth * scale;
    const drawHeight = cropHeight * scale;
    const orientedX = x + (layerCropX - halfCropX) * scale;
    const orientedY = y + (layerCropY - itemMinY) * scale;
    const rotateOffset =
      rotation === "Rot90" || rotation === "Rot270"
        ? (drawWidth - drawHeight) / 2
        : 0;

    return {
      crop: layerCrop,
      x: orientedX - rotateOffset,
      y: orientedY + rotateOffset,
      width: drawWidth,
      height: drawHeight,
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
    showFolds: boolean,
    onToggleItemEnchantment: (itemIndex: number) => void,
    getGlintPlugin: (enabled: boolean) => TexturePlugin | undefined
  ) => {
    const makeNewPageSkyline = (): SkylineNode[] => [
      { x: pageMargin, y: pageMargin, width: innerPageWidth },
    ];

    const pages: Array<{
      id: string;
      placements: Array<{
        selectedTextureFrame: SelectedTexture;
        selectedTextureFrameIndex: number;
        x: number;
        y: number;
        leftHalfWidth: number;
        width: number;
        height: number;
      }>;
    }> = [];

    let currentPage = {
      id: "Page 1",
      placements: [] as Array<{
        selectedTextureFrame: SelectedTexture;
        selectedTextureFrameIndex: number;
        x: number;
        y: number;
        leftHalfWidth: number;
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

    selectedTextureFrames.forEach(
      (selectedTextureFrame, selectedTextureFrameIndex) => {
        const { leftHalfWidth, width, height } =
          getItemDimensions(selectedTextureFrame);
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
          selectedTextureFrameIndex,
          x: placement.x + itemMargin,
          y: placement.y + itemMargin,
          leftHalfWidth,
          width,
          height,
        });
      }
    );

    if (currentPage.placements.length > 0 || pages.length === 0) {
      pages.push(currentPage);
    }

    pages.forEach((page) => {
      generator.usePage(page.id);
      generator.drawImage("Background", [0, 0]);
      page.placements.forEach((placement) => {
        const {
          selectedTextureFrame,
          selectedTextureFrameIndex,
          x,
          y,
          leftHalfWidth,
          width,
          height,
        } = placement;
        const layers = getItemLayers(selectedTextureFrame);
        const itemScale = selectedTextureFrame.itemScale ?? defaultItemScale;
        const itemLayout = getItemLayout(layers);
        const glintPlugin = getGlintPlugin(
          selectedTextureFrame.enchanted ?? false
        );

        layers.forEach((layer) => {
          const leftDestination = getLayerHalfDestination(
            itemLayout.leftBounds,
            itemLayout.minY,
            layer,
            x,
            y,
            itemScale,
            "None"
          );
          const rightDestination = getLayerHalfDestination(
            itemLayout.rightBounds,
            itemLayout.minY,
            layer,
            x + leftHalfWidth,
            y,
            itemScale,
            "Horizontal"
          );

          drawItemHalf(
            layer,
            leftDestination.crop,
            leftDestination.x,
            leftDestination.y,
            leftDestination.width,
            leftDestination.height,
            "None",
            glintPlugin
          );
          drawItemHalf(
            layer,
            rightDestination.crop,
            rightDestination.x,
            rightDestination.y,
            rightDestination.width,
            rightDestination.height,
            "Horizontal",
            glintPlugin
          );
        });
        if (showFolds) {
          generator.drawTexture(
            "CenterFold",
            [0, 0, 2, height],
            [x + leftHalfWidth - 1, y, 2, height]
          );
        }
        generator.defineRegionInput([x, y, width, height], () => {
          onToggleItemEnchantment(selectedTextureFrameIndex);
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
      min: 100,
      max: 1600,
      value: selectedCustomScalePercent,
      step: 100,
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
        enableErase={false}
        selectedTexture={currentTexture}
        tintChoiceGroups={itemTintChoiceGroups}
        onChange={(selectedTexture) => {
          onChange(encodeSelectedTexture(selectedTexture));
        }}
      />
    );
  });

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

  const toggleItemEnchantment = (itemIndex: number) => {
    generator.setStringInputValue(
      "SelectedTextureFrames",
      encodeSelectedTextures(
        selectedTextureFrames.map((textureFrame, index) =>
          index === itemIndex
            ? {
                ...textureFrame,
                enchanted: !(textureFrame.enchanted ?? false),
              }
            : textureFrame
        )
      )
    );
  };

  // Show a button which adds the selected texture to the page

  generator.defineButtonInput(
    "Add Item",
    () => {
      if (selectedTextureFrame) {
        const newSelectedTextureFrame: SelectedTexture = {
          ...selectedTextureFrame,
          itemScale: selectedItemScale,
          itemLayers: undefined,
          enchanted: false,
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
          enchanted: undefined,
        };
        const previousItem = selectedTextureFrames.at(-1);
        const newSelectedTextureFrames: SelectedTexture[] = previousItem
          ? [
              ...selectedTextureFrames.slice(0, -1),
              {
                ...newLayer,
                itemScale: selectedItemScale,
                enchanted: previousItem.enchanted ?? false,
                itemLayers: [...getItemLayers(previousItem), newLayer],
              },
            ]
          : addSelectedTextureFrame({ ...newLayer, enchanted: false });
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
      if (selectedTextureFrame) {
        generator.setStringInputValue(
          "SelectedTextureFrame",
          encodeSelectedTexture({ ...selectedTextureFrame, blend: null })
        );
      }
    },
    "Red"
  );

  const glint = defineGlintControls(generator);

  // Define the Show Folds Variable

  generator.defineBooleanInput("Show Folds", true);

  const showFolds = generator.getBooleanInputValueWithDefault(
    "Show Folds",
    true
  );

  // Show a blank page initially

  if (selectedTextureFrames.length === 0) {
    generator.usePage("Page 1");
    generator.drawImage("Background", [0, 0]);
    generator.drawImage("Title", [0, 0]);
  }

  drawItems(
    selectedTextureFrames,
    showFolds,
    toggleItemEnchantment,
    glint.getPlugin
  );
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
