import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";
import {
  crossWidth,
  drawCrossCenterFold,
  drawCrossFold,
  drawSidewaysCrossPair,
  getCrossLayout,
  getStackedCrossFoldLayout,
} from "./shared";

type DoubleCrossFaces = {
  pair1: Region;
  pair2: Region;
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
    pair1: [ox - gap, oy + pairYOffset, size * 2, pairHeight],
    pair2: [ox + size * 2, oy + pairYOffset, size * 2, pairHeight],
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
  const topFaceId = "DoubleCrossFaceTop" + blockId;
  const bottomFaceId = "DoubleCrossFaceBottom" + blockId;
  const regions = makeFaces(ox, oy);
  const topLayers = Face.getFaceTextures(generator, topFaceId);
  const bottomLayers = Face.getFaceTextures(generator, bottomFaceId);
  const allLayers = [...topLayers, ...bottomLayers];
  const layout = getCrossLayout(allLayers);
  const foldLayout = getStackedCrossFoldLayout(topLayers, bottomLayers);

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

  if (showFolds) {
    drawCrossCenterFold(generator, regions.pair1);
    drawCrossCenterFold(generator, regions.pair2);
  }

  if (showFolds && foldLayout) {
    drawCrossFold(generator, foldLayout, regions.pair1, "East", {
      useTranslatedSidewaysTexture: true,
    });
    drawCrossFold(generator, foldLayout, regions.pair2, "West", {
      useTranslatedSidewaysTexture: true,
    });
  }
}
