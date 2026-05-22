import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";
import { crossWidth, drawCrossPair, getCrossLayout } from "./crossShared";

type DoubleCrossFaces = {
  topPair1: Region;
  topPair2: Region;
  bottomPair1: Region;
  bottomPair2: Region;
};

const size = 128;
const pairWidth = crossWidth * 2;
const pairXOffset = size * 2 - 16 - crossWidth;

function makeFaces(ox: number, oy: number): DoubleCrossFaces {
  return {
    topPair1: [ox + pairXOffset, oy + size / 2, pairWidth, size],
    topPair2: [ox + pairXOffset, oy + (size * 3) / 2, pairWidth, size],
    bottomPair1: [ox + pairXOffset, oy + (size * 5) / 2, pairWidth, size],
    bottomPair2: [ox + pairXOffset, oy + (size * 7) / 2, pairWidth, size],
  };
}

export function drawDoubleCross(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const topFaceId = "CrossFaceTop" + blockId;
  const bottomFaceId = "CrossFace" + blockId;
  const regions = makeFaces(ox, oy);
  const topLayers = Face.getFaceTextures(generator, topFaceId);
  const bottomLayers = Face.getFaceTextures(generator, bottomFaceId);
  const layout = getCrossLayout([...topLayers, ...bottomLayers]);

  Face.defineInputRegion(generator, topFaceId, regions.topPair1);
  Face.defineInputRegion(generator, topFaceId, regions.topPair2);
  Face.defineInputRegion(generator, bottomFaceId, regions.bottomPair1);
  Face.defineInputRegion(generator, bottomFaceId, regions.bottomPair2);

  if (layout) {
    drawCrossPair(generator, topLayers, layout, regions.topPair1);
    drawCrossPair(generator, topLayers, layout, regions.topPair2);
    drawCrossPair(generator, bottomLayers, layout, regions.bottomPair1);
    drawCrossPair(generator, bottomLayers, layout, regions.bottomPair2);
  }

  generator.drawImage("Title", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Block", [ox - 32, oy - 1]);
  }
}
