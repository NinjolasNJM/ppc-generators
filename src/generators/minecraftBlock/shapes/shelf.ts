import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../../_common/plugins/texturePicker/face";

// Has the usual six, plus a top and bottom * usual six = back. call those being of 0 and 1, 0 is bottom and 1 is top.
type Faces = {
  top: Region;
  top0: Region;
  top1: Region;
  bottom: Region;
  bottom0: Region;
  bottom1: Region;
  right: Region;
  right0: Region;
  right1: Region;
  front: Region;
  front0: Region;
  front1: Region;
  left: Region;
  left0: Region;
  left1: Region;
  back: Region;
};

const size = 128;

function makeFaces(ox: number, oy: number): Faces {
  return {
    top: [ox + size, oy + size * 11 / 16, size, size * 3 / 16],
    bottom: [ox + size, oy + size * 38 / 16, size, size * 3 / 16],
    right: [ox + size * 11 / 16, oy + size, size * 3 / 16, size],
    front: [ox + size, oy + size * 22 / 16, size, size / 2],
    left: [ox + size * 34 / 16, oy + size, size * 3 / 16, size],
    back: [ox + size * 37 / 16, oy + size, size, size],

        top0: [ox + size, oy + size * 5 / 16, size, size * 3 / 16],
    bottom0: [ox + size, oy + size * 2, size, size],
    right0: [ox, oy + (size * 3) / 2, size, size / 2],
    front0: [ox + size, oy + (size * 3) / 2, size, size / 2],
    left0: [ox + size * 2, oy + (size * 3) / 2, size, size / 2],

        top1: [ox + size, oy + size * 5 / 16, size, size * 3 / 16],
    bottom1: [ox + size, oy + size * 2, size, size],
    right1: [ox, oy + (size * 3) / 2, size, size / 2],
    front1: [ox + size, oy + (size * 3) / 2, size, size / 2],
    left1: [ox + size * 2, oy + (size * 3) / 2, size, size / 2],
  };
}

export function drawShelf(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const regions = makeFaces(ox, oy);

  Face.defineInputRegion(generator, "ShelfFace" + blockId, regions.front);

  Face.drawFace(generator, "ShelfFace" + blockId, [0, 0, 16, 16], regions.top);
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [0, 0, 16, 16],
    regions.bottom
  );
  Face.drawFace(generator, "ShelfFace" + blockId, [0, 8, 16, 8], regions.right);
  Face.drawFace(generator, "ShelfFace" + blockId, [0, 8, 16, 8], regions.front);
  Face.drawFace(generator, "ShelfFace" + blockId, [0, 8, 16, 8], regions.left);
  Face.drawFace(generator, "ShelfFace" + blockId, [0, 8, 16, 8], regions.back);

  generator.drawImage("Tabs-Shelf", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Shelf", [ox - 32, oy - 1]);
  }
}
