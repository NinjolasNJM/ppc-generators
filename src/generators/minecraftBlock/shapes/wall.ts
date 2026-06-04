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
};

const size = 128; // 16
const size2 = 64; // 8
const size3 = 48; // 6
const sizex = 40; // 5
const sizey = 128; // 6. So youll have a sizey = 16 or 14, or a sizex = 4 or 5.
const x1 = 304;
const x2 = 80;
const y1 = 0;
const y2 = 208;

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

function makeFaces(ox: number, oy: number): Faces {
  return {
    // wall post = 8x16x8
    top: [ox + size2, oy + size2, size2, size2],
    bottom: [ox + size2, oy + size * 2, size2, size2],
    right: [ox, oy + size, size2, sizey],
    front: [ox + size2, oy + size, size2, sizey],
    left: [ox + size, oy + size, size2, sizey],
    back: [ox + size + size2, oy + size, size2, sizey],
    // left wall side = 5x16x6- will be 4 as default
    stop1: [ox + size3, oy + sizey - size3, sizex, size3],
    sbottom1: [ox  + size3, oy + size * 2, sizex, size3],
    sright1: [ox, oy + size, size3, sizey],
    sfront1: [ox + size3, oy + size, sizex, sizey],
    sleft1: [ox + size3 + sizex, oy + size, size3, sizey],
    sback1: [ox + size3 * 2 + sizex, oy + size, sizex, sizey],
    // right wall side = 5x16x6- will be 4 as default
    stop2: [ox + x1 + size3, oy + sizey - size3, sizex, size3],
    sbottom2: [ox + x1 + size3, oy + size * 2, sizex, size3],
    sright2: [ox + x1, oy + size, size3, sizey],
    sfront2: [ox + x1 + size3, oy + size, sizex, sizey],
    sleft2: [ox + x1 + size3 + sizex, oy + size, size3, sizey],
    sback2: [ox + x1 + size3 * 2 + sizex, oy + size, sizex, sizey],
    // straight wall segment = 16x16x6
    ltop1: [ox + x2 + size3, oy + y1 + size - size3, size, size3],
    lbottom1: [ox + x2 + size3, oy + y1 + size * 2, size, size3],
    lright1: [ox + x2, oy + y1 + size, size3, sizey],
    lfront1: [ox + x2 + size3, oy + y1 + size, size, sizey],
    lleft1: [ox + x2 + size3 + size, oy + y1 + size, size3, sizey],
    lback1: [ox + x2 + size3 * 2 + size, oy + y1 + size, size, sizey],
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
  const imageSuffix = wallShapeImageSuffixes[shape];
  const regions = makeFaces(ox, oy);

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

  // Post and Side draws only the editable post plus the matching right side.
  if (drawPost) {
    Face.drawFace(
      generator,
      "WallFaceTop" + blockId,
      [6, 6, 4, 4],
      regions.top
    );
    Face.drawFace(
      generator,
      "WallFaceBottom" + blockId,
      [6, 6, 4, 4],
      regions.bottom
    );
    Face.drawFace(
      generator,
      "WallFaceRight" + blockId,
      [6, 0, 4, 16],
      regions.right
    );
    Face.drawFace(
      generator,
      "WallFaceFront" + blockId,
      [6, 0, 4, 16],
      regions.front
    );
    Face.drawFace(
      generator,
      "WallFaceLeft" + blockId,
      [6, 0, 4, 16],
      regions.left
    );
    Face.drawFace(
      generator,
      "WallFaceBack" + blockId,
      [6, 0, 4, 16],
      regions.back
    );
  }

  // Two Sides draws an editable left side and an uneditable matching right side.
  if (drawLeftSide) {
    Face.drawFace(
      generator,
      "WallFaceTop" + blockId,
      [10, 7, 6, 2],
      regions.stop1
    );
    Face.drawFace(
      generator,
      "WallFaceBottom" + blockId,
      [10, 7, 6, 2],
      regions.sbottom1
    );
    Face.drawFace(
      generator,
      "WallFaceRight" + blockId,
      [7, 1, 2, 3],
      regions.sright1
    );
    Face.drawFace(
      generator,
      "WallFaceFront" + blockId,
      [10, 1, 6, 3],
      regions.sfront1
    );
    Face.drawFace(
      generator,
      "WallFaceLeft" + blockId,
      [7, 1, 2, 3],
      regions.sleft1
    );
    Face.drawFace(
      generator,
      "WallFaceBack" + blockId,
      [0, 1, 6, 3],
      regions.sback1,
      { rotate: 180.0 }
    );
  }

  // The right side is paired with Post and Side and Two Sides.
  if (drawRightSide) {
    Face.drawFace(
      generator,
      "WallFaceTop" + blockId,
      [10, 7, 6, 2],
      regions.stop2
    );
    Face.drawFace(
      generator,
      "WallFaceBottom" + blockId,
      [10, 7, 6, 2],
      regions.sbottom2
    );
    Face.drawFace(
      generator,
      "WallFaceRight" + blockId,
      [7, 7, 2, 3],
      regions.sright2
    );
    Face.drawFace(
      generator,
      "WallFaceFront" + blockId,
      [10, 7, 6, 3],
      regions.sfront2
    );
    Face.drawFace(
      generator,
      "WallFaceLeft" + blockId,
      [7, 7, 2, 3],
      regions.sleft2
    );
    Face.drawFace(
      generator,
      "WallFaceBack" + blockId,
      [0, 7, 6, 3],
      regions.sback2,
      { rotate: 180.0 }
    );
  }

  // Straight Segment draws only its long segment, with regions on that segment.
  if (drawStraightSegment) {
    Face.drawFace(
      generator,
      "WallFaceTop" + blockId,
      [10, 7, 6, 2],
      regions.ltop1
    );
    Face.drawFace(
      generator,
      "WallFaceBottom" + blockId,
      [10, 7, 6, 2],
      regions.lbottom1
    );
    Face.drawFace(
      generator,
      "WallFaceRight" + blockId,
      [7, 1, 2, 3],
      regions.lright1
    );
    Face.drawFace(
      generator,
      "WallFaceFront" + blockId,
      [10, 1, 6, 3],
      regions.lfront1
    );
    Face.drawFace(
      generator,
      "WallFaceLeft" + blockId,
      [7, 1, 2, 3],
      regions.lleft1
    );
    Face.drawFace(
      generator,
      "WallFaceBack" + blockId,
      [0, 1, 6, 3],
      regions.lback1,
      { rotate: 180.0 }
    );
  }

  generator.drawImage("Tabs-Wall-" + imageSuffix, [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Wall-" + imageSuffix, [ox - 32, oy - 1]);
  }
}
