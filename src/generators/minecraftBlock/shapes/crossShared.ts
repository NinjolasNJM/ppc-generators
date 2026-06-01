import {
  type Generator,
  type Position,
  type Region,
} from "@genroot/builder/modules/generator";
import {
  type Flip,
  makeNextFlip,
} from "@genroot/builder/ui/texturePicker/flip";
import { type Orientation } from "../../_common/minecraft";
import { rotationToDegrees } from "@genroot/builder/ui/texturePicker/rotation";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import {
  getLayerHalfDestinationWithScale,
  getTextureLayout,
  type Rectangle,
} from "../../_common/plugins/texturePicker/textureLayout";

const size = 128;
const heightScale = size / 16;
const widthScale = heightScale * 1.265625;

export const crossWidth = size * 1.265625;

export type CrossLayout = ReturnType<typeof getTextureLayout>;
type LayerHalf = ReturnType<typeof getLayerHalfDestinationWithScale>;
type Bounds = { x: number; y: number; width: number; height: number };
type TextureSide = "start" | "end";

export function getCrossLayout(layers: SelectedTexture[]): CrossLayout | null {
  return layers.length > 0 ? getTextureLayout(layers) : null;
}

export function getCrossSeamGap(
  left: Pick<LayerHalf, "x" | "width">,
  right: Pick<LayerHalf, "x" | "width">
): number {
  const leftEnd = Math.round(left.x) + Math.floor(left.width) - 1;
  const flippedRightStart = Math.round(
    right.x + right.width - Math.floor(right.width)
  );

  return Math.max(0, flippedRightStart - leftEnd - 1);
}

export function drawCrossPair(
  generator: Generator,
  layers: SelectedTexture[],
  layout: CrossLayout,
  region: Region
) {
  const [x, y, width] = region;
  const seamGap = getLayoutSeamGap(layout, x, width);

  for (const layer of layers) {
    const [leftHalf, rightHalf] = getCrossHalves(layer, layout, x, y, width);

    drawLayerHalf(generator, layer, leftHalf, "None");
    drawLayerHalf(
      generator,
      layer,
      {
        ...rightHalf,
        x: rightHalf.x - seamGap,
      },
      "Horizontal"
    );
  }
}

export function drawSidewaysCrossPair(
  generator: Generator,
  layers: SelectedTexture[],
  layout: CrossLayout,
  region: Region
) {
  const [x, y, width, height] = region;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const virtualRegion: Region = [
    centerX - height / 2,
    centerY - width / 2,
    height,
    width,
  ];
  const [virtualX, virtualY, virtualWidth] = virtualRegion;
  const seamOffset = getLayoutSeamGap(layout, virtualX, virtualWidth) / 2;

  for (const layer of layers) {
    const [leftHalf, rightHalf] = getCrossHalves(
      layer,
      layout,
      virtualX,
      virtualY,
      virtualWidth
    );

    drawLayerHalf(
      generator,
      layer,
      rotateHalfAround(
        { ...leftHalf, x: leftHalf.x + seamOffset },
        centerX,
        centerY
      ),
      "None",
      90
    );
    drawLayerHalf(
      generator,
      layer,
      rotateHalfAround(
        { ...rightHalf, x: rightHalf.x - seamOffset },
        centerX,
        centerY
      ),
      "Horizontal",
      90
    );
  }
}

export function drawCrossFold(
  generator: Generator,
  layout: CrossLayout,
  region: Region,
  orientation: Orientation
) {
  const {
    foldRegion,
    foldOrientation,
    seamMode,
    reverseSegment,
    fullSegment,
    textureSide,
    transformPoint,
  } = getFoldSpace(region, orientation);

  getCrossHalfBounds(layout, foldRegion, seamMode, textureSide).forEach(
    (bounds) => {
      const segment = getFoldSegment(bounds, foldOrientation, fullSegment);
      const [from, to] = reverseSegment ? [segment[1], segment[0]] : segment;
      generator.drawFoldLine(transformPoint(from), transformPoint(to), true);
    }
  );
}

export function drawCrossCenterFold(generator: Generator, region: Region) {
  const [x, y, width, height] = region;
  const line: [Position, Position, Position, Position] =
    width >= height
      ? [
          [x + width / 2, y],
          [x + width / 2, y + height],
          [x + width / 2 - 1, y],
          [x + width / 2 - 1, y + height],
        ]
      : [
          [x, y + height / 2],
          [x + width, y + height / 2],
          [x, y + height / 2 - 1],
          [x + width, y + height / 2 - 1],
        ];

  generator.drawFoldLine(line[0], line[1], true);
  generator.drawFoldLine(line[2], line[3], true);
}

function getLayoutSeamGap(
  layout: NonNullable<CrossLayout>,
  x: number,
  width: number
): number {
  return getCrossSeamGap(
    {
      x: x + width / 2 - layout.leftBounds[2] * widthScale,
      width: layout.leftBounds[2] * widthScale,
    },
    {
      x: x + width / 2,
      width: layout.rightBounds[2] * widthScale,
    }
  );
}

function getCrossHalfBounds(
  layout: NonNullable<CrossLayout>,
  [x, y, width, height]: Region,
  seamMode: "normal" | "split",
  textureSide: TextureSide
): Bounds[] {
  const leftWidth = layout.leftBounds[2] * widthScale;
  const rightWidth = layout.rightBounds[2] * widthScale;
  const seamGap = getLayoutSeamGap(layout, x, width);
  const seamOffset = seamMode === "split" ? seamGap / 2 : 0;
  const textureHeight = layout.height * heightScale;
  const textureY =
    textureSide === "start"
      ? y + layout.minY * heightScale
      : y + height - (layout.minY + layout.height) * heightScale;

  return [
    {
      x: x + width / 2 - leftWidth + seamOffset,
      y: textureY,
      width: leftWidth,
      height: textureHeight,
    },
    {
      x: x + width / 2 - seamGap + seamOffset,
      y: textureY,
      width: rightWidth,
      height: textureHeight,
    },
  ];
}

function getFoldSpace(region: Region, orientation: Orientation) {
  const [x, y, width, height] = region;

  if (width >= height) {
    return {
      foldRegion: region,
      foldOrientation: orientation,
      seamMode: "normal" as const,
      reverseSegment: false,
      fullSegment: false,
      textureSide: "start" as const,
      transformPoint: (point: Position) => point,
    };
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const textureSide: TextureSide = orientation === "West" ? "end" : "start";

  return {
    foldRegion: [
      centerX - height / 2,
      centerY - width / 2,
      height,
      width,
    ] as Region,
    foldOrientation: getSidewaysFoldOrientation(orientation),
    seamMode: "split" as const,
    reverseSegment: orientation === "East",
    fullSegment: orientation === "East" || orientation === "West",
    textureSide,
    transformPoint: (point: Position) =>
      rotatePointAround(point, centerX, centerY),
  };
}

function getFoldSegment(
  { x, y, width, height }: Bounds,
  orientation: Orientation,
  fullSegment: boolean
): [Position, Position] {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  switch (orientation) {
    case "North":
      if (fullSegment) {
        return [
          [centerX, y],
          [centerX, y + height],
        ];
      }
      return [
        [centerX, y],
        [centerX, centerY],
      ];
    case "South":
      if (fullSegment) {
        return [
          [centerX, y],
          [centerX, y + height],
        ];
      }
      return [
        [centerX, centerY],
        [centerX, y + height],
      ];
    case "East":
      if (fullSegment) {
        return [
          [x, centerY],
          [x + width, centerY],
        ];
      }
      return [
        [centerX, centerY],
        [x + width, centerY],
      ];
    case "West":
      if (fullSegment) {
        return [
          [x, centerY],
          [x + width, centerY],
        ];
      }
      return [
        [x, centerY],
        [centerX, centerY],
      ];
  }
}

function getSidewaysFoldOrientation(orientation: Orientation): Orientation {
  switch (orientation) {
    case "North":
      return "West";
    case "East":
      return "North";
    case "South":
      return "East";
    case "West":
      return "South";
  }
}

function getCrossHalves(
  layer: SelectedTexture,
  layout: NonNullable<CrossLayout>,
  x: number,
  y: number,
  width: number
): [LayerHalf, LayerHalf] {
  return [
    getLayerHalf(
      layer,
      layout.leftBounds,
      layout.minY,
      x + width / 2 - layout.leftBounds[2] * widthScale,
      y + layout.minY * heightScale,
      "None"
    ),
    getLayerHalf(
      layer,
      layout.rightBounds,
      layout.minY,
      x + width / 2,
      y + layout.minY * heightScale,
      "Horizontal"
    ),
  ];
}

function getLayerHalf(
  layer: SelectedTexture,
  bounds: Rectangle,
  minY: number,
  x: number,
  y: number,
  appliedFlip: Flip
) {
  return getLayerHalfDestinationWithScale(
    bounds,
    minY,
    layer,
    x,
    y,
    widthScale,
    heightScale,
    appliedFlip
  );
}

function drawLayerHalf(
  generator: Generator,
  layer: SelectedTexture,
  half: LayerHalf,
  appliedFlip: Flip,
  rotate = 0
) {
  const [nextFlip, nextRotation] = makeNextFlip(
    layer.flip,
    appliedFlip,
    layer.rotation
  );

  generator.drawTexture(
    layer.textureDefId,
    half.source,
    [half.x, half.y, half.width, half.height],
    {
      flip: nextFlip,
      rotate: rotationToDegrees(nextRotation) + rotate,
      blend: layer.blend
        ? { kind: "MultiplyHex", hex: layer.blend }
        : undefined,
    }
  );
}

function rotateHalfAround(
  half: LayerHalf,
  centerX: number,
  centerY: number
): LayerHalf {
  const halfCenterX = half.x + half.width / 2;
  const halfCenterY = half.y + half.height / 2;
  const rotatedCenterX = centerX - (halfCenterY - centerY);
  const rotatedCenterY = centerY + halfCenterX - centerX;

  return {
    ...half,
    x: rotatedCenterX - half.width / 2,
    y: rotatedCenterY - half.height / 2,
  };
}

function rotatePointAround(
  [x, y]: Position,
  centerX: number,
  centerY: number
): Position {
  return [centerX - (y - centerY), centerY + x - centerX];
}
