import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import { drawCuboidFolds } from "../../_common/cuboidFolds";
import { drawCuboidTabs } from "../../_common/cuboidTabs";
import { type Dimensions, type Position } from "../../_common/cuboid";
import * as Face from "../face";

type WallShape = "Post and Side" | "Two Sides" | "Straight Segment";

type Faces = {
  // wall post

  top: Region;
  bottom: Region;
  right: Region;
  front: Region;
  left: Region;
  back: Region;

  // left wall side

  stop1: Region;
  sbottom1: Region;
  sright1: Region;
  sfront1: Region;
  sleft1: Region;
  sback1: Region;

  // right wall side

  stop2: Region;
  sbottom2: Region;
  sright2: Region;
  sfront2: Region;
  sleft2: Region;
  sback2: Region;

  // straight wall segment

  ltop1: Region;
  lbottom1: Region;
  lright1: Region;
  lfront1: Region;
  lleft1: Region;
  lback1: Region;

  rightSideControl: Region;
};

type SideFaces = {
  top: Region;
  bottom: Region;
  right: Region;
  front: Region;
  left: Region;
  back: Region;
};

type SideSources = {
  sideSourceX: number;
  sideSourceWidth: number;
  frontSourceX: number;
  wallSourceY: number;
  wallSourceHeight: number;
};

type FoldCuboid = {
  position: Position;
  dimensions: Dimensions;
};

const size = 128; // 16
const size2 = 64; // 8
const size3 = 48; // 6
const sizeXWithoutPost = 40; // 5
const sizeXWithPost = 32; // 4
const tallSizeY = 128; // 16
const shortSizeY = 112; // 14
const x1 = 304;
const x2 = 80;

const wallShapeOptions: WallShape[] = [
  "Post and Side",
  "Two Sides",
  "Straight Segment",
];

function makeFoldCuboid(right: Region, top: Region, front: Region): FoldCuboid {
  return {
    position: [right[0], top[1]],
    dimensions: [front[2], front[3], right[2]],
  };
}

function drawFolds(generator: Generator, cuboids: FoldCuboid[]) {
  cuboids.forEach(({ position, dimensions }) => {
    drawCuboidFolds(generator, position, dimensions, {
      foldType: "light",
      orientation: "West",
    });
  });
}

function drawTabs(generator: Generator, cuboids: FoldCuboid[]) {
  cuboids.forEach(({ position, dimensions }) => {
    drawCuboidTabs(generator, position, dimensions, {
      baseDimensions: [size, size, size],
    });
  });
}

function makeFaces(
  ox: number,
  oy: number,
  isTall: boolean,
  withPost: boolean
): Faces {
  const sizex = withPost ? sizeXWithPost : sizeXWithoutPost;
  const sideInsetX = sizeXWithoutPost - sizex;
  const sizey = isTall ? tallSizeY : shortSizeY;
  const y1 = isTall ? 0 : tallSizeY - shortSizeY;
  const wallTopY = oy + size + y1 - size3;
  const wallBodyY = oy + size + y1;
  const wallBottomY = wallBodyY + sizey;
  const leftSideX = ox + sideInsetX;
  const rightSideX = ox + x1 + sideInsetX;
  const sideTotalWidth = size3 * 2 + sizex * 2;
  const sideTotalHeight = wallBottomY + size3 - wallTopY;

  return {
    // wall post = 8x16x8
    top: [ox + size2, oy + size2, size2, size2],
    bottom: [ox + size2, oy + size * 2, size2, size2],
    right: [ox, oy + size, size2, size],
    front: [ox + size2, oy + size, size2, size],
    left: [ox + size, oy + size, size2, size],
    back: [ox + size + size2, oy + size, size2, size],
    // left wall side = 5x16x6- will be 4 as default
    stop1: [leftSideX + size3, wallTopY, sizex, size3],
    sbottom1: [leftSideX + size3, wallBottomY, sizex, size3],
    sright1: [leftSideX, wallBodyY, size3, sizey],
    sfront1: [leftSideX + size3, wallBodyY, sizex, sizey],
    sleft1: [leftSideX + size3 + sizex, wallBodyY, size3, sizey],
    sback1: [leftSideX + size3 * 2 + sizex, wallBodyY, sizex, sizey],
    // right wall side = 5x16x6- will be 4 as default
    stop2: [rightSideX + size3, wallTopY, sizex, size3],
    sbottom2: [rightSideX + size3, wallBottomY, sizex, size3],
    sright2: [rightSideX, wallBodyY, size3, sizey],
    sfront2: [rightSideX + size3, wallBodyY, sizex, sizey],
    sleft2: [rightSideX + size3 + sizex, wallBodyY, size3, sizey],
    sback2: [rightSideX + size3 * 2 + sizex, wallBodyY, sizex, sizey],
    // straight wall segment = 16x16x6
    ltop1: [ox + x2 + size3, wallTopY, size, size3],
    lbottom1: [ox + x2 + size3, wallBottomY, size, size3],
    lright1: [ox + x2, wallBodyY, size3, sizey],
    lfront1: [ox + x2 + size3, wallBodyY, size, sizey],
    lleft1: [ox + x2 + size3 + size, wallBodyY, size3, sizey],
    lback1: [ox + x2 + size3 * 2 + size, wallBodyY, size, sizey],
    rightSideControl: [rightSideX, wallTopY, sideTotalWidth, sideTotalHeight],
  };
}

function makeSideSources(isTall: boolean, withPost: boolean): SideSources {
  return {
    sideSourceX: withPost ? 0 : 1,
    sideSourceWidth: withPost ? 4 : 5,
    frontSourceX: withPost ? 12 : 11,
    wallSourceY: isTall ? 0 : 2,
    wallSourceHeight: isTall ? 16 : 14,
  };
}

function drawSide(
  generator: Generator,
  blockId: string,
  regions: SideFaces,
  sources: SideSources,
  isRightSide: boolean
) {
  const topBottomSourceX = isRightSide
    ? sources.frontSourceX
    : sources.sideSourceX;
  const topBottomOptions = isRightSide ? undefined : { rotate: 180 };

  Face.drawFace(
    generator,
    "WallFaceTop" + blockId,
    [topBottomSourceX, 5, sources.sideSourceWidth, 6],
    regions.top,
    topBottomOptions
  );
  Face.drawFace(
    generator,
    "WallFaceBottom" + blockId,
    [topBottomSourceX, 5, sources.sideSourceWidth, 6],
    regions.bottom,
    topBottomOptions
  );
  Face.drawFace(
    generator,
    "WallFaceRight" + blockId,
    [5, sources.wallSourceY, 6, sources.wallSourceHeight],
    regions.right
  );
  Face.drawFace(
    generator,
    "WallFaceFront" + blockId,
    [
      sources.frontSourceX,
      sources.wallSourceY,
      sources.sideSourceWidth,
      sources.wallSourceHeight,
    ],
    regions.front
  );
  Face.drawFace(
    generator,
    "WallFaceLeft" + blockId,
    [5, sources.wallSourceY, 6, sources.wallSourceHeight],
    regions.left
  );
  Face.drawFace(
    generator,
    "WallFaceBack" + blockId,
    [
      sources.sideSourceX,
      sources.wallSourceY,
      sources.sideSourceWidth,
      sources.wallSourceHeight,
    ],
    regions.back
  );
}

function drawPost(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean,
  isTall: boolean
) {
  const regions = makeFaces(ox, oy, isTall, true);
  const sideSources = makeSideSources(isTall, true);

  Face.defineInputRegion(generator, "WallFaceTop" + blockId, regions.top);
  Face.defineInputRegion(generator, "WallFaceBottom" + blockId, regions.bottom);
  Face.defineInputRegion(generator, "WallFaceRight" + blockId, regions.right);
  Face.defineInputRegion(generator, "WallFaceFront" + blockId, regions.front);
  Face.defineInputRegion(generator, "WallFaceLeft" + blockId, regions.left);
  Face.defineInputRegion(generator, "WallFaceBack" + blockId, regions.back);

  // generator.defineRegionInput(
  //   regions.rightSideControl,
  //   () => {},
  //   "Block " + blockId + " Wall With Post"
  // );

  Face.drawFace(generator, "WallFaceTop" + blockId, [4, 4, 8, 8], regions.top);
  Face.drawFace(
    generator,
    "WallFaceBottom" + blockId,
    [4, 4, 8, 8],
    regions.bottom
  );
  Face.drawFace(
    generator,
    "WallFaceRight" + blockId,
    [4, 0, 8, 16],
    regions.right
  );
  Face.drawFace(
    generator,
    "WallFaceFront" + blockId,
    [4, 0, 8, 16],
    regions.front
  );
  Face.drawFace(
    generator,
    "WallFaceLeft" + blockId,
    [4, 0, 8, 16],
    regions.left
  );
  Face.drawFace(
    generator,
    "WallFaceBack" + blockId,
    [4, 0, 8, 16],
    regions.back
  );
  drawSide(
    generator,
    blockId,
    {
      top: regions.stop2,
      bottom: regions.sbottom2,
      right: regions.sright2,
      front: regions.sfront2,
      left: regions.sleft2,
      back: regions.sback2,
    },
    sideSources,
    true
  );

  const cuboids = [
    makeFoldCuboid(regions.right, regions.top, regions.front),
    makeFoldCuboid(regions.sright2, regions.stop2, regions.sfront2),
  ];
  drawTabs(generator, cuboids);
  if (showFolds) {
    drawFolds(generator, cuboids);
  }
}

function drawSides(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean,
  isTall: boolean
) {
  const withPostInputId = "Block " + blockId + " Wall With Post";
  const withPost = generator.getBooleanInputValueWithDefault(
    withPostInputId,
    true
  );
  const regions = makeFaces(ox, oy, isTall, withPost);
  const sideSources = makeSideSources(isTall, withPost);

  Face.defineInputRegion(generator, "WallFaceTop" + blockId, regions.stop1);
  Face.defineInputRegion(
    generator,
    "WallFaceBottom" + blockId,
    regions.sbottom1
  );
  Face.defineInputRegion(generator, "WallFaceRight" + blockId, regions.sright1);
  Face.defineInputRegion(generator, "WallFaceFront" + blockId, regions.sfront1);
  Face.defineInputRegion(generator, "WallFaceLeft" + blockId, regions.sleft1);
  Face.defineInputRegion(generator, "WallFaceBack" + blockId, regions.sback1);

  generator.defineRegionInput(
    regions.rightSideControl,
    () => {
      generator.setBooleanInputValue(withPostInputId, !withPost);
    },
    withPostInputId
  );

  drawSide(
    generator,
    blockId,
    {
      top: regions.stop1,
      bottom: regions.sbottom1,
      right: regions.sright1,
      front: regions.sfront1,
      left: regions.sleft1,
      back: regions.sback1,
    },
    sideSources,
    false
  );
  drawSide(
    generator,
    blockId,
    {
      top: regions.stop2,
      bottom: regions.sbottom2,
      right: regions.sright2,
      front: regions.sfront2,
      left: regions.sleft2,
      back: regions.sback2,
    },
    sideSources,
    true
  );

  const cuboids = [
    makeFoldCuboid(regions.sright1, regions.stop1, regions.sfront1),
    makeFoldCuboid(regions.sright2, regions.stop2, regions.sfront2),
  ];
  drawTabs(generator, cuboids);
  if (showFolds) {
    drawFolds(generator, cuboids);
  }
}

function drawStraight(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean,
  isTall: boolean
) {
  const regions = makeFaces(ox, oy, isTall, true);
  const wallSourceY = isTall ? 0 : 2;
  const wallSourceHeight = isTall ? 16 : 14;

  Face.defineInputRegion(generator, "WallFaceTop" + blockId, regions.ltop1);
  Face.defineInputRegion(
    generator,
    "WallFaceBottom" + blockId,
    regions.lbottom1
  );
  Face.defineInputRegion(generator, "WallFaceRight" + blockId, regions.lright1);
  Face.defineInputRegion(generator, "WallFaceFront" + blockId, regions.lfront1);
  Face.defineInputRegion(generator, "WallFaceLeft" + blockId, regions.lleft1);
  Face.defineInputRegion(generator, "WallFaceBack" + blockId, regions.lback1);

  Face.drawFace(
    generator,
    "WallFaceTop" + blockId,
    [0, 5, 16, 6],
    regions.ltop1
  );
  Face.drawFace(
    generator,
    "WallFaceBottom" + blockId,
    [0, 5, 16, 6],
    regions.lbottom1
  );
  Face.drawFace(
    generator,
    "WallFaceRight" + blockId,
    [5, wallSourceY, 6, wallSourceHeight],
    regions.lright1
  );
  Face.drawFace(
    generator,
    "WallFaceFront" + blockId,
    [0, wallSourceY, 16, wallSourceHeight],
    regions.lfront1
  );
  Face.drawFace(
    generator,
    "WallFaceLeft" + blockId,
    [5, wallSourceY, 6, wallSourceHeight],
    regions.lleft1
  );
  Face.drawFace(
    generator,
    "WallFaceBack" + blockId,
    [0, wallSourceY, 16, wallSourceHeight],
    regions.lback1
  );

  const cuboids = [
    makeFoldCuboid(regions.lright1, regions.ltop1, regions.lfront1),
  ];
  drawTabs(generator, cuboids);
  if (showFolds) {
    drawFolds(generator, cuboids);
  }
}

export function drawWall(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const shapeInputId = "Block " + blockId + " Shape";
  generator.defineSelectInput(shapeInputId, wallShapeOptions);

  const shapeInput = generator.getSelectInputValue(shapeInputId);
  const shape: WallShape =
    shapeInput === "Two Sides" || shapeInput === "Straight Segment"
      ? shapeInput
      : "Post and Side";
  const isTall = generator.defineAndGetBooleanInput(
    "Block " + blockId + " Tall Wall",
    false
  );

  switch (shape) {
    case "Two Sides": {
      drawSides(generator, blockId, ox, oy, showFolds, isTall);
      break;
    }
    case "Straight Segment": {
      drawStraight(generator, blockId, ox, oy, showFolds, isTall);
      break;
    }
    case "Post and Side": {
      drawPost(generator, blockId, ox, oy, showFolds, isTall);
      break;
    }
  }
}
