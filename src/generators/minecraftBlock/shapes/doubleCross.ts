import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";
import {
  crossWidth,
  drawSidewaysCrossPair,
  getCrossLayout,
} from "./crossShared";

type DoubleCrossFaces = {
  bottomPair1: Region;
  topPair1: Region;
  bottomPair2: Region;
  topPair2: Region;
};

const size = 128;
const halfPageHeight = 400;
const gap = 32;
const pairHeight = crossWidth * 2;
const pairYOffset = (halfPageHeight - pairHeight) / 2;

function makeFaces(ox: number, oy: number): DoubleCrossFaces {
  return {
    bottomPair1: [ox - gap, oy + pairYOffset, size, pairHeight],
    topPair1: [ox + size - gap, oy + pairYOffset, size, pairHeight],
    bottomPair2: [ox + size * 2, oy + pairYOffset, size, pairHeight],
    topPair2: [ox + size * 3, oy + pairYOffset, size, pairHeight],
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
  const allLayers = [...topLayers, ...bottomLayers];
  const layout = getCrossLayout(allLayers);

  Face.defineInputRegion(generator, bottomFaceId, regions.bottomPair1);
  Face.defineInputRegion(generator, topFaceId, regions.topPair1);
  Face.defineInputRegion(generator, bottomFaceId, regions.bottomPair2);
  Face.defineInputRegion(generator, topFaceId, regions.topPair2);

  if (layout) {
    drawSidewaysCrossPair(generator, bottomLayers, layout, regions.bottomPair1);
    drawSidewaysCrossPair(generator, topLayers, layout, regions.topPair1);
    drawSidewaysCrossPair(generator, bottomLayers, layout, regions.bottomPair2);
    drawSidewaysCrossPair(generator, topLayers, layout, regions.topPair2);
  }

  generator.drawImage("Title", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Block", [ox - 32, oy - 1]);
  }
}
