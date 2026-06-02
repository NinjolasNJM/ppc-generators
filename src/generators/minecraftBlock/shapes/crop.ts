import {
  type Generator,
  type Position,
  type Region,
} from "@genroot/builder/modules/generator";
import { type Flip } from "@genroot/builder/ui/texturePicker/flip";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import {
  getTextureHalfCropBounds,
  type Rectangle,
} from "../../_common/plugins/texturePicker/textureLayout";
import * as Face from "../face";
import { drawCrossCenterFold } from "./shared";

type CropFoldDirection = "North" | "South";
type CropPairConfig = {
  foldDirection: CropFoldDirection;
};
type CropPair = CropPairConfig & {
  bottom: Region;
  pair: Region;
  top: Region;
};

const size = 128;
const faceGap = 16;
const halfPageHeight = 400;
const pairHeight = size * 2;
const pairYOffset = (halfPageHeight - pairHeight) / 2;
const foldOffset = (size * 4) / 16;
const faceSource: Region = [0, 0, 16, 16];
const scale = size / 16;
const foldOffsets = [foldOffset, size - foldOffset];

const pairConfigs: CropPairConfig[] = [
  { foldDirection: "North" },
  { foldDirection: "South" },
  { foldDirection: "North" },
  { foldDirection: "South" },
];

function makePairs(ox: number, oy: number): CropPair[] {
  const startX = ox - 32;
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
  layout: Rectangle,
  foldDirection: CropFoldDirection
) {
  const [x, y] = region;
  const [, cropY, , cropHeight] = layout;
  const textureY = y + cropY * scale;
  const textureHeight = cropHeight * scale;
  const centerY = textureY + textureHeight / 2;

  for (const foldOffset of foldOffsets) {
    const foldX = x + foldOffset;
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

function getCropFoldLayout(
  layers: SelectedTexture[],
  appliedFlip: Flip
): Rectangle | null {
  return layers.length > 0 ? getTextureHalfCropBounds(layers, appliedFlip) : null;
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
  const topFoldLayout = getCropFoldLayout(layers, "None");
  const bottomFoldLayout = getCropFoldLayout(layers, "Vertical");

  for (const { pair, top, bottom } of pairs) {
    Face.defineInputRegion(generator, faceId, pair);
    Face.drawFace(generator, faceId, faceSource, top);
    Face.drawFace(generator, faceId, faceSource, bottom, {
      flip: "Vertical",
    });
  }

  if (showFolds) {
    for (const { pair, top, bottom, foldDirection } of pairs) {
      drawCrossCenterFold(generator, pair);
      if (topFoldLayout) {
        drawCropFold(generator, top, topFoldLayout, foldDirection);
      }
      if (bottomFoldLayout) {
        drawCropFold(
          generator,
          bottom,
          bottomFoldLayout,
          getOppositeFoldDirection(foldDirection)
        );
      }
    }
  }
}
