import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
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

const wallShapeImageSuffixes: Record<WallShape, string> = {
  "Post and Side": "Post",
  "Two Sides": "Sides",
  "Straight Segment": "Straight",
};

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
  const withPostInputId = "Block " + blockId + " Wall With Post";
  const withPost = generator.getBooleanInputValueWithDefault(
    withPostInputId,
    true
  );
  const imageSuffix = wallShapeImageSuffixes[shape];
  const regions = makeFaces(ox, oy, isTall, withPost);
  const wallSourceY = isTall ? 0 : 2;
  const wallSourceHeight = isTall ? 16 : 14;
  const sideSourceX = withPost ? 0 : 1;
  const sideSourceWidth = withPost ? 4 : 5;
  const frontSourceX = withPost ? 12 : 11;

  const drawPost = shape === "Post and Side";
  const drawLeftSide = shape === "Two Sides";
  const drawRightSide = shape === "Post and Side" || shape === "Two Sides";
  const drawStraightSegment = shape === "Straight Segment";

  // Each wall shape keeps its editable regions on the representative piece.
  if (drawPost) {
    Face.defineInputRegion(generator, "WallFaceTop" + blockId, regions.top);
    Face.defineInputRegion(
      generator,
      "WallFaceBottom" + blockId,
      regions.bottom
    );
    Face.defineInputRegion(generator, "WallFaceRight" + blockId, regions.right);
    Face.defineInputRegion(generator, "WallFaceFront" + blockId, regions.front);
    Face.defineInputRegion(generator, "WallFaceLeft" + blockId, regions.left);
    Face.defineInputRegion(generator, "WallFaceBack" + blockId, regions.back);
  }

  if (drawLeftSide) {
    Face.defineInputRegion(generator, "WallFaceTop" + blockId, regions.stop1);
    Face.defineInputRegion(
      generator,
      "WallFaceBottom" + blockId,
      regions.sbottom1
    );
    Face.defineInputRegion(
      generator,
      "WallFaceRight" + blockId,
      regions.sright1
    );
    Face.defineInputRegion(
      generator,
      "WallFaceFront" + blockId,
      regions.sfront1
    );
    Face.defineInputRegion(generator, "WallFaceLeft" + blockId, regions.sleft1);
    Face.defineInputRegion(generator, "WallFaceBack" + blockId, regions.sback1);
  }

  if (drawStraightSegment) {
    Face.defineInputRegion(generator, "WallFaceTop" + blockId, regions.ltop1);
    Face.defineInputRegion(
      generator,
      "WallFaceBottom" + blockId,
      regions.lbottom1
    );
    Face.defineInputRegion(
      generator,
      "WallFaceRight" + blockId,
      regions.lright1
    );
    Face.defineInputRegion(
      generator,
      "WallFaceFront" + blockId,
      regions.lfront1
    );
    Face.defineInputRegion(generator, "WallFaceLeft" + blockId, regions.lleft1);
    Face.defineInputRegion(generator, "WallFaceBack" + blockId, regions.lback1);
  }

  if (drawRightSide) {
    generator.defineRegionInput(
      regions.rightSideControl,
      () => {
        generator.setBooleanInputValue(withPostInputId, !withPost);
      },
      withPostInputId
    );
  }

  // Post and Side draws only the editable post plus the matching right side.
  if (drawPost) {
    Face.drawFace(
      generator,
      "WallFaceTop" + blockId,
      [4, 4, 8, 8],
      regions.top
    );
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
  }

  // Two Sides draws an editable left side and an uneditable matching right side.
  if (drawLeftSide) {
    Face.drawFace(
      generator,
      "WallFaceTop" + blockId,
      [sideSourceX, 5, sideSourceWidth, 6],
      regions.stop1,
      { rotate: 180 }
    );
    Face.drawFace(
      generator,
      "WallFaceBottom" + blockId,
      [sideSourceX, 5, sideSourceWidth, 6],
      regions.sbottom1,
      { rotate: 180 }
    );
    Face.drawFace(
      generator,
      "WallFaceRight" + blockId,
      [5, wallSourceY, 6, wallSourceHeight],
      regions.sright1
    );
    Face.drawFace(
      generator,
      "WallFaceFront" + blockId,
      [frontSourceX, wallSourceY, sideSourceWidth, wallSourceHeight],
      regions.sfront1
    );
    Face.drawFace(
      generator,
      "WallFaceLeft" + blockId,
      [5, wallSourceY, 6, wallSourceHeight],
      regions.sleft1
    );
    Face.drawFace(
      generator,
      "WallFaceBack" + blockId,
      [sideSourceX, wallSourceY, sideSourceWidth, wallSourceHeight],
      regions.sback1
    );
  }

  // The right side is paired with Post and Side and Two Sides.
  if (drawRightSide) {
    Face.drawFace(
      generator,
      "WallFaceTop" + blockId,
      [frontSourceX, 5, sideSourceWidth, 6],
      regions.stop2
    );
    Face.drawFace(
      generator,
      "WallFaceBottom" + blockId,
      [frontSourceX, 5, sideSourceWidth, 6],
      regions.sbottom2
    );
    Face.drawFace(
      generator,
      "WallFaceRight" + blockId,
      [5, wallSourceY, 6, wallSourceHeight],
      regions.sright2
    );
    Face.drawFace(
      generator,
      "WallFaceFront" + blockId,
      [frontSourceX, wallSourceY, sideSourceWidth, wallSourceHeight],
      regions.sfront2
    );
    Face.drawFace(
      generator,
      "WallFaceLeft" + blockId,
      [5, wallSourceY, 6, wallSourceHeight],
      regions.sleft2
    );
    Face.drawFace(
      generator,
      "WallFaceBack" + blockId,
      [sideSourceX, wallSourceY, sideSourceWidth, wallSourceHeight],
      regions.sback2
    );
  }

  // Straight Segment draws only its long segment, with regions on that segment.
  if (drawStraightSegment) {
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
  }

  generator.drawImage("Tabs-Wall-" + imageSuffix, [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Wall-" + imageSuffix, [ox - 32, oy - 1]);
  }
}
