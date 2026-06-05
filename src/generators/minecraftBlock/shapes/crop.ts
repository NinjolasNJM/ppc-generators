import {
  type Generator,
  type Position,
  type Region,
} from "@genroot/builder/modules/generator";
import { type Flip } from "@genroot/builder/ui/texturePicker/flip";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import {
  getLayerHalfDestinationWithScale,
  getTextureHalfCropBounds,
  type Rectangle,
} from "../../_common/plugins/texturePicker/textureLayout";
import * as Face from "../face";
import {
  alignCoordinateToRenderedMirror,
  drawCrossCenterFold,
  drawTextureLayerHalf,
  getMirroredSeamGap,
} from "./shared";

type CropFoldDirection = "North" | "South";
type CropPairConfig = {
  foldDirection: CropFoldDirection;
};
type CropPair = CropPairConfig & {
  bottom: Region;
  pair: Region;
  top: Region;
};
type CropTextureLayout = {
  bottom: Rectangle;
  top: Rectangle;
};

const size = 128;
const faceGap = 16;
const halfPageHeight = 400;
const pairHeight = size * 2;
const pairYOffset = (halfPageHeight - pairHeight) / 2;
const foldOffset = (size * 4) / 16;
const scale = size / 16;
const foldOffsets: [number, number] = [foldOffset, size - foldOffset];

const pairConfigs: CropPairConfig[] = [
  { foldDirection: "North" },
  { foldDirection: "South" },
  { foldDirection: "North" },
  { foldDirection: "South" },
];

function makePairs(ox: number, oy: number): CropPair[] {
  const startX = ox - 40;
  const topY = oy + pairYOffset;

  return pairConfigs.map((config, index) => {
    const x = startX + index * (size + faceGap);

    return {
      ...config,
      pair: [x, topY, size, pairHeight],
      top: [x, topY, size, size],
      bottom: [x, topY + size, size, size],
    };
  });
}

function getOppositeFoldDirection(
  direction: CropFoldDirection
): CropFoldDirection {
  return direction === "North" ? "South" : "North";
}

function drawCropFold(
  generator: Generator,
  region: Region,
  textureY: number,
  textureHeight: number,
  foldDirection: CropFoldDirection
) {
  const [x, , width] = region;
  const centerY = textureY + textureHeight / 2;
  const foldXs = getCropFoldXs(x, width);

  for (const foldX of foldXs) {
    const line: [Position, Position] =
      foldDirection === "North"
        ? [
            [foldX, textureY],
            [foldX, centerY],
          ]
        : [
            [foldX, centerY],
            [foldX, textureY + textureHeight],
          ];

    generator.drawFoldLine(line[0], line[1], true);
  }
}

function getCropFoldXs(x: number, width: number): [number, number] {
  const left = x + foldOffsets[0];
  const right = x + foldOffsets[1];
  return [
    left,
    alignCoordinateToRenderedMirror(right, left, x + width / 2 - 0.5),
  ];
}

function getCropTextureLayout(
  layers: SelectedTexture[]
): CropTextureLayout | null {
  if (layers.length === 0) {
    return null;
  }

  return {
    top: getTextureHalfCropBounds(layers, "None"),
    bottom: getTextureHalfCropBounds(layers, "Vertical"),
  };
}

function getVisibleCropY(
  top: Region,
  layout: CropTextureLayout
): { bottomY: number; topY: number } {
  const [, topRegionY, , topRegionHeight] = top;
  const seamY = topRegionY + topRegionHeight;
  const topHeight = layout.top[3] * scale;
  const bottomHeight = layout.bottom[3] * scale;
  const topY = seamY - topHeight;
  const seamGap = getMirroredSeamGap(
    { x: topY, width: topHeight },
    { x: seamY, width: bottomHeight }
  );

  return {
    topY,
    bottomY: seamY - seamGap,
  };
}

function drawCropLayer(
  generator: Generator,
  layer: SelectedTexture,
  region: Region,
  layout: Rectangle,
  y: number,
  appliedFlip: Flip
) {
  const [x] = region;
  const [layoutX, layoutY] = layout;
  const destination = getLayerHalfDestinationWithScale(
    layout,
    layoutY,
    layer,
    x + layoutX * scale,
    y,
    scale,
    scale,
    appliedFlip
  );

  drawTextureLayerHalf(generator, layer, destination, appliedFlip);
}

function drawCropPair(
  generator: Generator,
  layers: SelectedTexture[],
  top: Region,
  bottom: Region,
  layout: CropTextureLayout
) {
  const { topY, bottomY } = getVisibleCropY(top, layout);

  for (const layer of layers) {
    drawCropLayer(generator, layer, top, layout.top, topY, "None");
    drawCropLayer(generator, layer, bottom, layout.bottom, bottomY, "Vertical");
  }
}

export function drawCrop(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const faceId = "CropFace" + blockId;
  const pairs = makePairs(ox, oy);
  const layers = Face.getFaceTextures(generator, faceId);
  const layout = getCropTextureLayout(layers);

  for (const { pair, top, bottom } of pairs) {
    Face.defineInputRegion(generator, faceId, pair);
    if (layout) {
      drawCropPair(generator, layers, top, bottom, layout);
    }
  }

  if (showFolds) {
    for (const { pair, top, bottom, foldDirection } of pairs) {
      drawCrossCenterFold(generator, pair);
      if (layout) {
        const { topY, bottomY } = getVisibleCropY(top, layout);
        drawCropFold(
          generator,
          top,
          topY,
          layout.top[3] * scale,
          foldDirection
        );
        drawCropFold(
          generator,
          bottom,
          bottomY,
          layout.bottom[3] * scale,
          getOppositeFoldDirection(foldDirection)
        );
      }
    }
  }
}
