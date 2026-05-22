import {
  Rectangle,
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";

type Faces = {
  front1: Region;
  back1: Region;
  front2: Region;
  back2: Region;
};

const size = 128;

function makeFaces(ox: number, oy: number, [cx, cy, cw, ch]: Rectangle, scale: number): Faces {
  return {
    front1: [ox + size - cw * scale, oy + size + cy * scale, cw * scale, ch * scale],
    back1: [ox + size, oy + size + cy * scale, cw * scale, ch * scale],
    front2: [ox + size * 3 - cw * scale, oy + size + cy * scale, cw * scale, ch * scale],
    back2: [ox + size * 3, oy + size + cy * scale, cw * scale, ch * scale],
  };
}

export function drawCross(
  generator: Generator,
  blockId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
    const crop = Face.getFaceCrop(generator, "CrossFace" + blockId) ?? [0, 0, 16, 16];
const [cx, cy, cw, ch] = crop;
const scale = size / 16;
  const regions = makeFaces(ox, oy, crop, scale);



  Face.defineInputRegion(generator, "CrossFace" + blockId, regions.front1);
  Face.defineInputRegion(generator, "CrossFace" + blockId, regions.back1);
  Face.defineInputRegion(generator, "CrossFace" + blockId, regions.front2);
  Face.defineInputRegion(generator, "CrossFace" + blockId, regions.back2);

  Face.drawFace(
    generator,
    "CrossFace" + blockId,
    crop,
    regions.front1
  );
  Face.drawFace(
    generator,
    "CrossFace" + blockId,
    crop,
    regions.back1,
    {
      flip: "Horizontal",
    }
  );
  Face.drawFace(
    generator,
    "CrossFace" + blockId,
    crop,
    regions.front2
  );
  Face.drawFace(
    generator,
    "CrossFace" + blockId,
    crop,
    regions.back2,
    {
      flip: "Horizontal",
    }
  );

  generator.drawImage("Title", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Block", [ox - 32, oy - 1]);
  }
}
