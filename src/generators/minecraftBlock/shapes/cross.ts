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
  getLayerHalfDestination,
  getTextureLayout,
  type Rectangle,
} from "../../_common/plugins/texturePicker/textureLayout";
import * as Face from "../face";

type Faces = {
  front1: Region;
  back1: Region;
  front2: Region;
  back2: Region;
};

const size = 128;
const scale = size / 16;

function makeFullFaces(ox: number, oy: number): Faces {
  return {
    front1: [ox, oy + size, size, size],
    back1: [ox + size, oy + size, size, size],
    front2: [ox + size * 2, oy + size, size, size],
    back2: [ox + size * 3, oy + size, size, size],
  };
}

function drawTextureHalf(
  generator: Generator,
  selectedTexture: SelectedTexture,
  source: Rectangle,
  destination: Region,
  appliedFlip: Flip
) {
  const { textureDefId, rotation, flip, blend } = selectedTexture;
  const [nextFlip, nextRotation] = makeNextFlip(flip, appliedFlip, rotation);

  generator.drawTexture(textureDefId, source, destination, {
    flip: nextFlip,
    rotate: rotationToDegrees(nextRotation),
    blend: blend ? { kind: "MultiplyHex", hex: blend } : undefined,
  });
}

function drawCrossPair(
  generator: Generator,
  faceId: string,
  centerX: number,
  top: number
) {
  const layers = Face.getFaceTextures(generator, faceId);
  if (layers.length === 0) {
    return;
  }

  const layout = getTextureLayout(layers);
  const leftHalfWidth = layout.leftBounds[2] * scale;
  const leftX = centerX - leftHalfWidth;
  const layoutY = top + layout.minY * scale;

  layers.forEach((layer) => {
    const leftDestination = getLayerHalfDestination(
      layout.leftBounds,
      layout.minY,
      layer,
      leftX,
      layoutY,
      scale,
      "None"
    );
    const rightDestination = getLayerHalfDestination(
      layout.rightBounds,
      layout.minY,
      layer,
      centerX,
      layoutY,
      scale,
      "Horizontal"
    );

    drawTextureHalf(
      generator,
      layer,
      leftDestination.source,
      [
        leftDestination.x,
        leftDestination.y,
        leftDestination.width,
        leftDestination.height,
      ],
      "None"
    );
    drawTextureHalf(
      generator,
      layer,
      rightDestination.source,
      [
        rightDestination.x,
        rightDestination.y,
        rightDestination.width,
        rightDestination.height,
      ],
      "Horizontal"
    );
  });
}

export function drawCross(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const regions = makeFullFaces(ox, oy);

  Face.defineInputRegion(generator, "CrossFace" + blockId, [ox, oy + size, size * 2, size]);
  Face.defineInputRegion(generator, "CrossFace" + blockId, [ox + size * 2, oy + size, size * 2, size]);

  drawCrossPair(generator, "CrossFace" + blockId, ox + size, oy + size);
  drawCrossPair(generator, "CrossFace" + blockId, ox + size * 3, oy + size);

  generator.drawImage("Title", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Block", [ox - 32, oy - 1]);
  }
}
