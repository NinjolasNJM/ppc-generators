import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";
import { crossWidth, drawCrossPair, getCrossLayout } from "./crossShared";

type CrossFaces = {
  pair1: Region;
  pair2: Region;
};

const size = 128;
const pairWidth = crossWidth * 2;
const pairXOffset = size * 2 - 16 - crossWidth;

function makeFaces(ox: number, oy: number): CrossFaces {
  return {
    pair1: [ox + pairXOffset, oy + size, pairWidth, size],
    pair2: [ox + pairXOffset, oy + size * 2, pairWidth, size],
  };
}

export function drawCross(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const faceId = "CrossFace" + blockId;
  const regions = makeFaces(ox, oy);
  const layers = Face.getFaceTextures(generator, faceId);
  const layout = getCrossLayout(layers);

  Face.defineInputRegion(generator, faceId, regions.pair1);
  Face.defineInputRegion(generator, faceId, regions.pair2);

  if (layout) {
    drawCrossPair(generator, layers, layout, regions.pair1);
    drawCrossPair(generator, layers, layout, regions.pair2);
  }

  generator.drawImage("Title", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Block", [ox - 32, oy - 1]);
  }
}
