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
import { A4 } from "@genroot/builder/modules/modelPage";
import { type Blend } from "@genroot/builder/modules/renderers/drawTexture";
import { type Flip } from "../_common/texturePicker/flip";
import { rotationToDegrees } from "../_common/texturePicker/rotation";
import { type Rotation } from "../_common/texturePicker/rotation";
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
  defineGlintControls,
  itemGlintTextureDefs,
} from "../_common/plugins/glint";
import {
  parseAtlas,
  updateCustomTextureAtlas,
  updateCustomTextureUrl,
} from "../_common/customTextureVersion";

/** [x, y, width, height] */
type Rectangle = [number, number, number, number];

function rotationToQuarterTurns(rotation: Rotation): number {
  switch (rotation) {
    case "Rot0":
      return 0;
    case "Rot90":
      return 1;
    case "Rot180":
      return 2;
    case "Rot270":
      return 3;
  }
}

function quarterTurnsToRotation(quarterTurns: number): Rotation {
  const normalized = ((quarterTurns % 4) + 4) % 4;
  switch (normalized) {
    case 0:
      return "Rot0";
    case 1:
      return "Rot90";
    case 2:
      return "Rot180";
    case 3:
      return "Rot270";
  }
  return "Rot0";
}

function rotateBy(rotation: Rotation, quarterTurns: number, flip: Flip) {
  const current = rotationToQuarterTurns(rotation);
  const next = flip === "None" ? current + quarterTurns : current - quarterTurns;
  return quarterTurnsToRotation(next);
}

function getItemRotationOrientedFlip(
  flip: Flip,
  rotation: Rotation
): Flip {
  if (rotation === "Rot90" || rotation === "Rot270") {
    switch (flip) {
      case "Horizontal":
        return "Vertical";
      case "Vertical":
        return "Horizontal";
      case "None":
        return "None";
    }
  }
  return flip;
}

function makeItemNextFlip(
  current: Flip,
  flip: Flip,
  rotation: Rotation
): [Flip, Rotation] {
  let nextFlip: Flip = "None";
  let extraQuarterTurns = 0;
  const orientedFlip = getItemRotationOrientedFlip(flip, rotation);

  if (orientedFlip !== current) {
    if (orientedFlip === "None") {
      nextFlip = current;
    } else if (current === "None") {
      nextFlip = orientedFlip;
    } else {
      extraQuarterTurns = 2;
    }
  }

  return [nextFlip, rotateBy(rotation, extraQuarterTurns, nextFlip)];
}

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
  ...itemGlintTextureDefs,
  {
    id: "CenterFold",
    url: centerFoldTexture.src,
    standardWidth: 2,
    standardHeight: 128,
  },
];

const script: ScriptDef = (generator: Generator) => {
  const drawItemHalf = (
    selectedTexture: NonNullable<SelectedTextureWithBlend["selectedTexture"]>,
    rectangle: Rectangle,
    destX: number,
    y: number,
    width: number,
    height: number,
    appliedFlip: Flip = "None",
    blend?: Blend,
    plugin?: TexturePlugin
  ) => {
    const { textureDefId, rotation, flip } = selectedTexture;
    const [nextFlip, nextRotation] = makeItemNextFlip(
      flip,
      appliedFlip,
      rotation
    );
    generator.drawTexture(
      textureDefId,
      rectangle,
      [destX, y, width, height],
      {
        flip: nextFlip,
        rotate: rotationToDegrees(nextRotation),
        blend,
        plugin,
      }
    );
  };

  const pageMargin = 30;
  const itemMargin = 5;
  const innerPageWidth = A4.px.width - pageMargin * 2;
  const innerPageHeight = A4.px.height - pageMargin * 2;
  const defaultItemScale = 4;
  const defaultFrameSize = 16;

  const getFrameSourceScale = (
    frame: NonNullable<SelectedTextureWithBlend["selectedTexture"]>["frame"]
  ) => {
    const [, , width, height] = frame.rectangle;
    return width === height &&
      width > 0 &&
      width % defaultFrameSize === 0 &&
      height % defaultFrameSize === 0
      ? width / defaultFrameSize
      : 1;
  };

  const getFrameCrop = (frame: NonNullable<SelectedTextureWithBlend["selectedTexture"]>["frame"]): Rectangle =>
    frame.rectangle;

  const getFrameLogicalCrop = (
    frame: NonNullable<SelectedTextureWithBlend["selectedTexture"]>["frame"]
  ): Rectangle => {
    const scale = getFrameSourceScale(frame);
    const [x, y, width, height] = getFrameCrop(frame);
    return [x / scale, y / scale, width / scale, height / scale];
  };

  const getFrameLogicalBounds = (
    frame: NonNullable<SelectedTextureWithBlend["selectedTexture"]>["frame"]
  ): Rectangle => {
    const scale = getFrameSourceScale(frame);
    const [, , width, height] = frame.rectangle;
    return [0, 0, width / scale, height / scale];
  };

  const rotateCrop = (
    crop: Rectangle,
    bounds: Rectangle,
    rotation: "Rot0" | "Rot90" | "Rot180" | "Rot270"
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
    layer: SelectedTextureWithBlend,
    appliedFlip: Flip
  ): Rectangle => {
    if (!layer.selectedTexture) {
      return [0, 0, 0, 0];
    }
    const { flip, rotation, frame } = layer.selectedTexture;
    const [nextFlip, nextRotation] = makeItemNextFlip(
      flip,
      appliedFlip,
      rotation
    );
    const crop = getFrameLogicalCrop(frame);
    const bounds = getFrameLogicalBounds(frame);
    const flippedCrop = flipCrop(crop, bounds, nextFlip);
    return rotateCrop(flippedCrop, bounds, nextRotation);
  };

  const getCropBounds = (crops: Rectangle[]): Rectangle => {
    const minX = Math.min(...crops.map(([x]) => x));
    const minY = Math.min(...crops.map(([, y]) => y));
    const maxX = Math.max(...crops.map(([x, , width]) => x + width));
    const maxY = Math.max(...crops.map(([, y, , height]) => y + height));
    return [minX, minY, maxX - minX, maxY - minY];
  };

  const getItemLayers = (selectedTextureFrame: SelectedTextureWithBlend) =>
    selectedTextureFrame.itemLayers ?? [selectedTextureFrame];

  const getItemHalfCropBounds = (
    layers: SelectedTextureWithBlend[],
    appliedFlip: Flip
  ): Rectangle =>
    getCropBounds(layers.map((layer) => getTransformedCrop(layer, appliedFlip)));

  const getItemLayout = (layers: SelectedTextureWithBlend[]) => {
    const anchorLayers = layers.length > 0 ? [layers[0]!] : layers;
    const leftBounds = getItemHalfCropBounds(anchorLayers, "None");
    const rightBounds = getItemHalfCropBounds(anchorLayers, "Horizontal");
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

  const getItemDimensions = (selectedTextureFrame: SelectedTextureWithBlend) => {
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

  const getLayerHalfDestination = (
    halfCropBounds: Rectangle,
    itemMinY: number,
    layer: SelectedTextureWithBlend,
    x: number,
    y: number,
    scale: number,
    appliedFlip: Flip
  ) => {
    const [halfCropX] = halfCropBounds;
    if (!layer.selectedTexture) {
      return {
        crop: [0, 0, 0, 0] as Rectangle,
        x,
        y,
        width: 0,
        height: 0,
      };
    }
    const { rotation } = layer.selectedTexture;
    const [, transformedRotation] = makeItemNextFlip(
      layer.selectedTexture.flip,
      appliedFlip,
      rotation
    );
    const [layerCropX, layerCropY] = getTransformedCrop(layer, appliedFlip);
    const layerCrop = getFrameLogicalCrop(layer.selectedTexture.frame);
    const [, , cropWidth, cropHeight] = layerCrop;
    const drawWidth = cropWidth * scale;
    const drawHeight = cropHeight * scale;
    const orientedX = x + (layerCropX - halfCropX) * scale;
    const orientedY = y + (layerCropY - itemMinY) * scale;
    const rotateOffset =
      transformedRotation === "Rot90" || transformedRotation === "Rot270"
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
    selectedTextureFrames: SelectedTextureWithBlend[],
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
        selectedTextureFrame: SelectedTextureWithBlend;
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
        selectedTextureFrame: SelectedTextureWithBlend;
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

        if (!placement && currentPage.placements.length > 0) {
          pushPage();
          placement = placeRect(skyline, requiredWidth, requiredHeight);
        }

        if (!placement) {
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
        const glintPlugin = getGlintPlugin(
          selectedTextureFrame.enchanted ?? false
        );

        layers.forEach((layer) => {
          if (!layer.selectedTexture) {
            return;
          }

          const itemLayout = getItemLayout([layer]);
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

          const blend: Blend | undefined = layer.blend
            ? { kind: "MultiplyHex", hex: layer.blend }
            : undefined;

          drawItemHalf(
            layer.selectedTexture,
            leftDestination.crop,
            leftDestination.x,
            leftDestination.y,
            leftDestination.width,
            leftDestination.height,
            "None",
            blend,
            glintPlugin
          );
          drawItemHalf(
            layer.selectedTexture,
            rightDestination.crop,
            rightDestination.x,
            rightDestination.y,
            rightDestination.width,
            rightDestination.height,
            "Horizontal",
            blend,
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
        generator.defineRegionInput(
          [x, y, width, height],
          () => onToggleItemEnchantment(selectedTextureFrameIndex),
          `Item ${selectedTextureFrameIndex + 1}`
        );
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
      showValue: true,
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

  const getItemLayersForItem = (item: SelectedTextureWithBlend) =>
    item.itemLayers ?? [item];

  const addSelectedTextureFrame = (textureFrame: SelectedTextureWithBlend) => [
    ...selectedTextureFrames,
    textureFrame,
  ];

  const toggleItemEnchantment = (itemIndex: number) => {
    generator.setStringInputValue(
      "SelectedTextureFrames",
      encodeSelectedTextureWithBlendArray(
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
        const newSelectedTextureFrame: SelectedTextureWithBlend = {
          ...selectedTextureFrame,
          itemScale: selectedItemScale,
          itemLayers: undefined,
          enchanted: false,
        };
        generator.setStringInputValue(
          "SelectedTextureFrames",
          encodeSelectedTextureWithBlendArray(
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
        const previousItem = selectedTextureFrames.at(-1);
        const overlayItemScale =
          previousItem?.itemScale ?? selectedItemScale;
        const newLayer: SelectedTextureWithBlend = {
          ...selectedTextureFrame,
          itemScale: overlayItemScale,
          itemLayers: undefined,
          enchanted: undefined,
        };
        const newSelectedTextureFrames: SelectedTextureWithBlend[] = previousItem
          ? [
              ...selectedTextureFrames.slice(0, -1),
              {
                ...newLayer,
                itemScale: overlayItemScale,
                enchanted: previousItem.enchanted ?? false,
                itemLayers: [...getItemLayersForItem(previousItem), newLayer],
              },
            ]
          : addSelectedTextureFrame({ ...newLayer, enchanted: false });
        generator.setStringInputValue(
          "SelectedTextureFrames",
          encodeSelectedTextureWithBlendArray(newSelectedTextureFrames)
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

      const previousLayers = getItemLayersForItem(previousItem);
      const newSelectedTextureFrames: SelectedTextureWithBlend[] =
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
        encodeSelectedTextureWithBlendArray(newSelectedTextureFrames)
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
        encodeSelectedTextureWithBlendArray([])
      );
      if (selectedTextureFrame) {
        generator.setStringInputValue(
          "SelectedTextureFrame",
          encodeSelectedTextureWithBlend({ ...selectedTextureFrame, blend: null })
        );
      }
    },
    "Red"
  );

  const glint = defineGlintControls(generator);

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
