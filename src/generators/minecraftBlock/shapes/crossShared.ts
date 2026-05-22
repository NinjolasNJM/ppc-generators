import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import {
  type Flip,
  makeNextFlip,
} from "@genroot/builder/ui/texturePicker/flip";
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
