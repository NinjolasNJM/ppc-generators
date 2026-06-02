import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";

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
};

const size = 128;
const size2 = 48;

function makeFaces(ox: number, oy: number): Faces {
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

  Face.drawFace(generator, "BedFaceTop" + blockId, [13, 0, 3, 16], regions.top, {
    rotate: -90,
  });
  Face.drawFace(
    generator,
    "BedFaceBottom" + blockId,
    [13, 0, 3, 16],
    regions.bottom,
    {
      rotate: 90,
    }
  );
  Face.drawFace(
    generator,
    "BedFaceRight1" + blockId,
    [0, 0, 3, 16],
    regions.right1,
    {
      flip: "Horizontal",
    }
  );
  Face.drawFace(
    generator,
    "BedFaceFront1" + blockId,
    [0, 0, 16, 16],
    regions.front1
  );
  Face.drawFace(generator, "BedFaceLeft1" + blockId, [0, 0, 3, 16], regions.left1);
  Face.drawFace(
    generator,
    "BedFaceBack1" + blockId,
    [0, 0, 16, 16],
    regions.back1,
    {
      flip: "Horizontal",
    }
  );
  Face.drawFace(
    generator,
    "BedFaceRight2" + blockId,
    [0, 0, 3, 16],
    regions.right2,
    {
      flip: "Horizontal",
    }
  );
  Face.drawFace(
    generator,
    "BedFaceFront2" + blockId,
    [0, 0, 16, 16],
    regions.front2
  );
  Face.drawFace(generator, "BedFaceLeft2" + blockId, [0, 0, 3, 16], regions.left2);
  Face.drawFace(
    generator,
    "BedFaceBack2" + blockId,
    [0, 0, 16, 16],
    regions.back2,
    {
      flip: "Horizontal",
    }
  );

  generator.drawImage("Tabs-Bed", [ox - 32, oy - 1]);

  //if (showFolds) {
  //generator.drawImage("Folds-Bed", [ox - 32, oy - 1]);
  //}
}
