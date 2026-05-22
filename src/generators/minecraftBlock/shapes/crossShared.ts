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
const widthScale = heightScale * 1.40625;

export const crossWidth = size * 1.40625;

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

  for (const layer of layers) {
    const leftHalf = getLayerHalf(
      layer,
      layout.leftBounds,
      layout.minY,
      x + width / 2 - layout.leftBounds[2] * widthScale,
      y + layout.minY * heightScale,
      "None"
    );
    const rightHalf = getLayerHalf(
      layer,
      layout.rightBounds,
      layout.minY,
      x + width / 2,
      y + layout.minY * heightScale,
      "Horizontal"
    );

    drawLayerHalf(generator, layer, leftHalf, "None");
    drawLayerHalf(
      generator,
      layer,
      {
        ...rightHalf,
        x: rightHalf.x - getCrossSeamGap(leftHalf, rightHalf),
      },
      "Horizontal"
    );
  }
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
  appliedFlip: Flip
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
      rotate: rotationToDegrees(nextRotation),
      blend: layer.blend
        ? { kind: "MultiplyHex", hex: layer.blend }
        : undefined,
    }
  );
}
