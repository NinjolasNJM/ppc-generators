import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";
import { rotateRegion } from "./shared";

type Faces = {
  top: Region;
  bottom: Region;
  right1: Region;
  front1: Region;
  left1: Region;
  back1: Region;
  right2: Region;
  front2: Region;
  left2: Region;
  back2: Region;
  ltop1: Region;
  lbottom1: Region;
  lright1: Region;
  lfront1: Region;
  lleft1: Region;
  lback1: Region;
  ltop2: Region;
  lbottom2: Region;
  lright2: Region;
  lfront2: Region;
  lleft2: Region;
  lback2: Region;
  ltop3: Region;
  lbottom3: Region;
  lright3: Region;
  lfront3: Region;
  lleft3: Region;
  lback3: Region;
  ltop4: Region;
  lbottom4: Region;
  lright4: Region;
  lfront4: Region;
  lleft4: Region;
  lback4: Region;
};

const size = 128;
const size2 = 48;
const size3 = 24;

function makeFaces(ox: number, oy: number): Faces {
  const [lx, ly] = [ox + 384, oy + 16];
  return {
    top: [ox + size2, oy + size / 8, size, size2],
    bottom: [
      ox + size2,
      oy + size * 17 / 8 + size2,
      size,
      size2,
    ],
    right1: [ox, oy + size / 2, size2, size],
    front1: [ox + size2, oy + size / 2, size, size],
    left1: [ox + size + size2, oy + size / 2, size2, size],
    back1: [ox + size + size2 * 2, oy + size / 2, size, size],
    right2: [ox, oy + (size * 3) / 2, size2, size],
    front2: [ox + size2, oy + (size * 3) / 2, size, size],
    left2: [ox + size + size2, oy + (size * 3) / 2, size2, size],
    back2: [ox + size + size2 * 2, oy + (size * 3) / 2, size, size],
    
    // leg 1
    ltop1: [lx + size3, ly + 0, size3, size3],
    lbottom1: [lx + size3, ly + size3 * 2, size3, size3],
    lright1: [lx, ly + size3, size3, size3],
    lfront1: [lx + size3, ly + size3, size3, size3],
    lleft1: [lx + size3 * 2, ly + size3, size3, size3],
    lback1: [lx + size3 * 3, ly + size3, size3, size3],

    // leg 2
    ltop2: [lx + size3 * 2, ly + 96, size3, size3],
    lbottom2: [lx + size3 * 2, ly + 96 + size3 * 2, size3, size3],
    lback2: [lx, ly + 96 + size3, size3, size3],
    lright2: [lx + size3, ly + 96 + size3, size3, size3],
    lfront2: [lx + size3 * 2, ly + 96 + size3, size3, size3],
    lleft2: [lx + size3 * 3, ly + 96 + size3, size3, size3],

    // leg 3
    ltop3: [lx + size3, ly + 184, size3, size3],
    lbottom3: [lx + size3, ly + 184 + size3 * 2, size3, size3],
    lright3: [lx, ly + 184 + size3, size3, size3],
    lfront3: [lx + size3, ly + 184 + size3, size3, size3],
    lleft3: [lx + size3 * 2, ly + 184 + size3, size3, size3],
    lback3: [lx + size3 * 3, ly + 184 + size3, size3, size3],

    // leg 4
    ltop4: [lx + size3 * 2, ly + 280, size3, size3],
    lbottom4: [lx + size3 * 2, ly + 280 + size3 * 2, size3, size3],
    lback4: [lx, ly + 280 + size3, size3, size3],
    lright4: [lx + size3, ly + 280 + size3, size3, size3],
    lfront4: [lx + size3 * 2, ly + 280 + size3, size3, size3],
    lleft4: [lx + size3 * 3, ly + 280 + size3, size3, size3],
  };
}

export function drawBed(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const regions = makeFaces(ox, oy);

  Face.defineInputRegion(generator, "BedFaceTop" + blockId, regions.top);
  Face.defineInputRegion(generator, "BedFaceBottom" + blockId, regions.bottom);
  Face.defineInputRegion(generator, "BedFaceRight1" + blockId, regions.right1);
  Face.defineInputRegion(generator, "BedFaceFront1" + blockId, regions.front1);
  Face.defineInputRegion(generator, "BedFaceLeft1" + blockId, regions.left1);
  Face.defineInputRegion(generator, "BedFaceBack1" + blockId, regions.back1);
  Face.defineInputRegion(generator, "BedFaceRight2" + blockId, regions.right2);
  Face.defineInputRegion(generator, "BedFaceFront2" + blockId, regions.front2);
  Face.defineInputRegion(generator, "BedFaceLeft2" + blockId, regions.left2);
  Face.defineInputRegion(generator, "BedFaceBack2" + blockId, regions.back2);

  Face.drawFace(generator, "BedFaceTop" + blockId, [0, 7, 16, 6], regions.top, {
  rotate: 180,});
  Face.drawFace(
    generator,
    "BedFaceBottom" + blockId,
    [0, 7, 16, 6],
    regions.bottom,
  );
  Face.drawFace(
    generator,
    "BedFaceRight1" + blockId,
    [0, 7, 16, 6],
    rotateRegion(regions.right1),
    {
      rotate: 90,
    }
  );
  Face.drawFace(
    generator,
    "BedFaceFront1" + blockId,
    [0, 0, 16, 16],
    regions.front1
  );
  Face.drawFace(generator, "BedFaceLeft1" + blockId, [0, 7, 16, 6], rotateRegion(regions.left1), {rotate: -90,});
  Face.drawFace(
    generator,
    "BedFaceBack1" + blockId,
    [0, 0, 16, 16],
    regions.back1,
  );
  Face.drawFace(
    generator,
    "BedFaceRight2" + blockId,
    [0, 7, 16, 6],
    rotateRegion(regions.right2),
    {
      rotate: 90,
    }
  );
  Face.drawFace(
    generator,
    "BedFaceFront2" + blockId,
    [0, 0, 16, 16],
    regions.front2
  );
  Face.drawFace(generator, "BedFaceLeft2" + blockId, [0, 7, 16, 6], rotateRegion(regions.left2), {rotate: -90,});
  Face.drawFace(
    generator,
    "BedFaceBack2" + blockId,
    [0, 0, 16, 16],
    regions.back2,
  );

  // leg 1:
  // top west, top east, bottom west, bottom east
  Face.drawFace(generator, "BedFaceRight1" + blockId, [6, 13, 3, 3], regions.ltop1, {rotate: 180 });
  Face.drawFace(generator, "BedFaceRight1" + blockId, [6, 13, 3, 3], regions.lbottom1, {rotate: 180 });
  Face.drawFace(generator, "BedFaceTop" + blockId, [10, 13, 3, 3], regions.lright1);
  Face.drawFace(generator, "BedFaceTop" + blockId, [13, 13, 3, 3], regions.lfront1);
  Face.drawFace(generator, "BedFaceRight1" + blockId, [0, 13, 3, 3], regions.lleft1);
  Face.drawFace(generator, "BedFaceRight1" + blockId, [3, 13, 3, 3], regions.lback1);

  // leg 2:
  Face.drawFace(generator, "BedFaceLeft1" + blockId, [7, 13, 3, 3], regions.ltop2, {rotate: 180 });
  Face.drawFace(generator, "BedFaceLeft1" + blockId, [7, 13, 3, 3], regions.lbottom2, {rotate: 180 });
  Face.drawFace(generator, "BedFaceLeft1" + blockId, [13, 13, 3, 3], regions.lright2);
  Face.drawFace(generator, "BedFaceTop" + blockId, [0, 13, 3, 3], regions.lfront2);
  Face.drawFace(generator, "BedFaceTop" + blockId, [3, 13, 3, 3], regions.lleft2);
  Face.drawFace(generator, "BedFaceLeft1" + blockId, [10, 13, 3, 3], regions.lback2);
  
  // leg 3: 
  Face.drawFace(generator, "BedFaceRight2" + blockId, [7, 13, 3, 3], regions.ltop3);
  Face.drawFace(generator, "BedFaceRight2" + blockId, [7, 13, 3, 3], regions.lbottom3);
  Face.drawFace(generator, "BedFaceRight2" + blockId, [13, 13, 3, 3], regions.lright3);
  Face.drawFace(generator, "BedFaceBottom" + blockId, [0, 13, 3, 3], regions.lfront3);
  Face.drawFace(generator, "BedFaceBottom" + blockId, [3, 13, 3, 3], regions.lleft3);
  Face.drawFace(generator, "BedFaceRight2" + blockId, [10, 13, 3, 3], regions.lback3);
  
  // leg 4:
  Face.drawFace(generator, "BedFaceLeft2" + blockId, [6, 13, 3, 3], regions.ltop4);
  Face.drawFace(generator, "BedFaceLeft2" + blockId, [6, 13, 3, 3], regions.lbottom4);
  Face.drawFace(generator, "BedFaceBottom" + blockId, [10, 13, 3, 3], regions.lright4);
  Face.drawFace(generator, "BedFaceBottom" + blockId, [13, 13, 3, 3], regions.lfront4);
  Face.drawFace(generator, "BedFaceLeft2" + blockId, [0, 13, 3, 3], regions.lleft4);
  Face.drawFace(generator, "BedFaceLeft2" + blockId, [3, 13, 3, 3], regions.lback4);

  generator.drawImage("Tabs-Bed", [ox - 32, oy - 1]);

  if (showFolds) {
  generator.drawImage("Folds-Bed", [ox - 32, oy - 1]);
  }
}
