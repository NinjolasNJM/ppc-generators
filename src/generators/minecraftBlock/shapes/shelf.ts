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
    top: [ox + size, oy + (size * 11) / 16, size, (size * 3) / 16],
    bottom: [ox + size, oy + (size * 38) / 16, size, (size * 3) / 16],
    right: [ox + (size * 11) / 16, oy + size, (size * 3) / 16, size],
    front: [ox + size, oy + (size * 22) / 16, size, size / 2],
    left: [ox + (size * 34) / 16, oy + size, (size * 3) / 16, size],
    back: [ox + (size * 37) / 16, oy + size, size, size],

    top0: [ox + size, oy + (size * 30) / 16, size, (size * 2) / 16],
    bottom0: [ox + size, oy + (size * 36) / 16, size, (size * 2) / 16],
    right0: [
      ox + (size * 14) / 16,
      oy + (size * 7) / 4,
      (size * 2) / 16,
      size / 4,
    ],
    front0: [ox + size, oy + size * 2, size, size / 4],
    left0: [ox + size * 2, oy + (size * 7) / 4, (size * 2) / 16, size / 4],

    top1: [ox + size, oy + (size * 14) / 16, size, (size * 2) / 16],
    bottom1: [ox + size, oy + (size * 20) / 16, size, (size * 2) / 16],
    right1: [ox + (size * 14) / 16, oy + size, (size * 2) / 16, size / 4],
    front1: [ox + size, oy + size, size, size / 4],
    left1: [ox + size * 2, oy + size, (size * 2) / 16, size / 4],
  };
}

export function drawShelf(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
    generator.defineSelectInput("Block " + blockId + " State", [
    "Unpowered",
    "Single",
    "Left",
    "Center",
    "Right",
  ]);

  // depending on the state, the front face will have a different source rectangle.
  let frontState: Region = [0, 2, 8, 4];
  switch (generator.getSelectInputValue("Block " + blockId + " State")) {
    case "Unpowered":
      frontState = [0, 2, 8, 4];
      break;
    case "Single":
      frontState = [8, 12, 8, 4];
      break;
    case "Left":
      frontState = [0, 8, 8, 4];
      break;
    case "Center":
      frontState = [0, 12, 8, 4];
      break;
    case "Right":
      frontState = [8, 8, 8, 4];
      break;
    default:
      frontState = [0, 2, 8, 4];
      break;
  }

  const regions = makeFaces(ox, oy);

  Face.defineInputRegion(generator, "ShelfFace" + blockId, regions.front);

  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [8, 3.5, 8, 1.5],
    regions.top
  );
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [8, 4.5, 8, 1.5],
    regions.bottom
  );
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [8, 0, 1.5, 8],
    regions.right
  );
  Face.drawFace(generator, "ShelfFace" + blockId, frontState, regions.front);
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [14.5, 0, 1.5, 8],
    regions.left
  );
  Face.drawFace(generator, "ShelfFace" + blockId, [8, 0, 8, 8], regions.back);

  Face.defineInputRegion(generator, "ShelfFace" + blockId, regions.front);

  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [8, 3.5, 8, 1],
    regions.top0,
    { rotate: 180 }
  );
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [8, 3.5, 8, 1],
    regions.bottom0
  );
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [1.5, 6, 1, 2],
    regions.right0
  );
  Face.drawFace(generator, "ShelfFace" + blockId, [0, 6, 8, 2], regions.front0);
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [5.5, 6, 1, 2],
    regions.left0
  );

  Face.drawFace(generator, "ShelfFace" + blockId, [8, 5, 8, 1], regions.top1);
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [8, 5, 8, 1],
    regions.bottom1,
    { rotate: 180 }
  );
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [1.5, 0, 1, 2],
    regions.right1
  );
  Face.drawFace(generator, "ShelfFace" + blockId, [0, 0, 8, 2], regions.front1);
  Face.drawFace(
    generator,
    "ShelfFace" + blockId,
    [5.5, 0, 1, 2],
    regions.left1
  );

  generator.drawImage("Tabs-Shelf", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Shelf", [ox - 32, oy - 1]);
  }
}
