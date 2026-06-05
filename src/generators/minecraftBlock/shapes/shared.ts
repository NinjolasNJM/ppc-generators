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
  getTransformedCrop,
  type Rectangle,
} from "../../_common/plugins/texturePicker/textureLayout";

const size = 128;
const heightScale = size / 16;
const widthScale = heightScale * 1.265625;

export const crossWidth = size * 1.265625;

export type CrossLayout = ReturnType<typeof getTextureLayout>;
export type TextureLayerHalf = ReturnType<
  typeof getLayerHalfDestinationWithScale
>;
type Bounds = { x: number; y: number; width: number; height: number };
type TextureSide = "start" | "end";
type CrossFoldOptions = {
  useTranslatedSidewaysTexture?: boolean;
};

export function getCrossLayout(layers: SelectedTexture[]): CrossLayout | null {
  return layers.length > 0 ? getTextureLayout(layers) : null;
}

export function getStackedCrossFoldLayout(
  topLayers: SelectedTexture[],
  bottomLayers: SelectedTexture[]
): CrossLayout | null {
  const layout = getCrossLayout([...topLayers, ...bottomLayers]);
  if (!layout) {
    return null;
  }

  const stackedBounds = getStackedLayerCropBounds(topLayers, bottomLayers);
  if (!stackedBounds) {
    return null;
  }

  return {
    ...layout,
    minY: stackedBounds[1],
    height: stackedBounds[3],
  };
}

export function getMirroredSeamGap(
  left: Pick<TextureLayerHalf, "x" | "width">,
  right: Pick<TextureLayerHalf, "x" | "width">
): number {
  const leftEnd = Math.round(left.x) + Math.floor(left.width) - 1;
  const flippedRightStart = Math.round(
    right.x + right.width - Math.floor(right.width)
  );

  return Math.max(0, flippedRightStart - leftEnd - 1);
}

export function getCrossSeamGap(
  left: Pick<TextureLayerHalf, "x" | "width">,
  right: Pick<TextureLayerHalf, "x" | "width">
): number {
  return getMirroredSeamGap(left, right);
}

export function alignCoordinateToRenderedMirror(
  coordinate: number,
  mirrorCoordinate: number,
  center: number
): number {
  // Fold lines round to pixels, so mirror the rendered pixel without changing
  // subpixel coordinates unless rounding would make the pair visibly uneven.
  const desiredRounded = Math.round(2 * center - Math.round(mirrorCoordinate));
  return coordinate + desiredRounded - Math.round(coordinate);
}

export function drawTextureLayerHalf(
  generator: Generator,
  layer: SelectedTexture,
  half: TextureLayerHalf,
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

    drawTextureLayerHalf(generator, layer, leftHalf, "None");
    drawTextureLayerHalf(
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

    drawTextureLayerHalf(
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
    drawTextureLayerHalf(
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
  orientation: Orientation,
  { useTranslatedSidewaysTexture = false }: CrossFoldOptions = {}
) {
  const {
    foldRegion,
    foldOrientation,
    seamMode,
    reverseSegment,
    textureSide,
    transformPoint,
  } = getFoldSpace(region, orientation, useTranslatedSidewaysTexture);

  const segments = getCrossHalfBounds(layout, foldRegion, seamMode, textureSide)
    .map((bounds) => getFoldSegment(bounds, foldOrientation))
    .map(([from, to]) => {
      const segment: [Position, Position] = reverseSegment
        ? [to, from]
        : [from, to];
      return segment.map(transformPoint) as [Position, Position];
    });
  const alignedSegments = alignRenderedMirrorSegmentPair(segments, region);

  alignedSegments.forEach(([from, to]) => {
    generator.drawFoldLine(from, to, true);
  });
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

function getCropBounds(crops: Rectangle[]): Rectangle {
  const minX = Math.min(...crops.map(([x]) => x));
  const minY = Math.min(...crops.map(([, y]) => y));
  const maxX = Math.max(...crops.map(([x, , width]) => x + width));
  const maxY = Math.max(...crops.map(([, y, , height]) => y + height));

  return [minX, minY, maxX - minX, maxY - minY];
}

function getLayerCropBounds(layers: SelectedTexture[]): Rectangle | null {
  if (layers.length === 0) {
    return null;
  }

  return getCropBounds(
    layers.flatMap((layer) => [
      getTransformedCrop(layer, "None"),
      getTransformedCrop(layer, "Horizontal"),
    ])
  );
}

function getStackedLayerCropBounds(
  topLayers: SelectedTexture[],
  bottomLayers: SelectedTexture[]
): Rectangle | null {
  const stackedCrops: Rectangle[] = [];
  const topBounds = getLayerCropBounds(topLayers);
  const bottomBounds = getLayerCropBounds(bottomLayers);

  if (topBounds) {
    stackedCrops.push(topBounds);
  }

  if (bottomBounds) {
    const [x, y, width, height] = bottomBounds;
    stackedCrops.push([x, y + 16, width, height]);
  }

  return stackedCrops.length > 0 ? getCropBounds(stackedCrops) : null;
}

function getFoldSpace(
  region: Region,
  orientation: Orientation,
  useTranslatedSidewaysTexture: boolean
) {
  const [x, y, width, height] = region;

  if (width >= height) {
    return {
      foldRegion: region,
      foldOrientation: orientation,
      seamMode: "normal" as const,
      reverseSegment: false,
      textureSide: "start" as const,
      transformPoint: (point: Position) => point,
    };
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const translateSideways =
    useTranslatedSidewaysTexture &&
    (orientation === "East" || orientation === "West");
  const textureSide: TextureSide =
    orientation === "West" && !translateSideways ? "end" : "start";

  return {
    foldRegion: [
      centerX - height / 2,
      centerY - width / 2,
      height,
      width,
    ] as Region,
    foldOrientation: getSidewaysFoldOrientation(orientation),
    seamMode: "split" as const,
    reverseSegment:
      orientation === "East" || (translateSideways && orientation === "West"),
    textureSide,
    transformPoint: (point: Position) =>
      rotatePointAround(point, centerX, centerY),
  };
}

function getFoldSegment(
  { x, y, width, height }: Bounds,
  orientation: Orientation
): [Position, Position] {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  switch (orientation) {
    case "North":
      return [
        [centerX, y],
        [centerX, centerY],
      ];
    case "South":
      return [
        [centerX, centerY],
        [centerX, y + height],
      ];
    case "East":
      return [
        [centerX, centerY],
        [x + width, centerY],
      ];
    case "West":
      return [
        [x, centerY],
        [centerX, centerY],
      ];
  }
}

function alignRenderedMirrorSegmentPair(
  segments: [Position, Position][],
  region: Region
): [Position, Position][] {
  if (segments.length !== 2) {
    return segments;
  }

  const [mirrorSegment, segment] = segments as [
    [Position, Position],
    [Position, Position],
  ];
  const axis = getSegmentConstantAxis(segment);
  const coordinateIndex = axis === "x" ? 0 : 1;
  const [, , width, height] = region;
  const center =
    axis === "x" ? region[0] + width / 2 - 0.5 : region[1] + height / 2 - 0.5;
  const coordinate = segment[0][coordinateIndex];
  const mirrorCoordinate = mirrorSegment[0][coordinateIndex];
  const alignedCoordinate = alignCoordinateToRenderedMirror(
    coordinate,
    mirrorCoordinate,
    center
  );
  const delta = alignedCoordinate - coordinate;

  if (delta === 0) {
    return segments;
  }

  return [
    mirrorSegment,
    shiftSegmentCoordinate(segment, coordinateIndex, delta),
  ];
}

function getSegmentConstantAxis([from, to]: [Position, Position]): "x" | "y" {
  return Math.abs(from[0] - to[0]) <= Math.abs(from[1] - to[1]) ? "x" : "y";
}

function shiftSegmentCoordinate(
  segment: [Position, Position],
  coordinateIndex: 0 | 1,
  delta: number
): [Position, Position] {
  return segment.map((point) => {
    const nextPoint: Position = [...point];
    nextPoint[coordinateIndex] += delta;
    return nextPoint;
  }) as [Position, Position];
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
): [TextureLayerHalf, TextureLayerHalf] {
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

function rotateHalfAround(
  half: TextureLayerHalf,
  centerX: number,
  centerY: number
): TextureLayerHalf {
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

export function rotateRegion(region: Region): Region {
  const [x, y, w, h] = region;
  return [x + (w - h) / 2, y - (w - h) / 2, h, w];
}
