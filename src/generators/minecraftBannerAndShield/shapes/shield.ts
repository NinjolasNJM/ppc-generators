import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";

type Faces = {
  top: Region;
  bottom: Region;
  right: Region;
  front: Region;
  left: Region;
  back: Region;
};

const size = 384;

function makeFaces(ox: number, oy: number): Faces {
  return {
    top: [ox + size, oy + size / 2, size, size],
    bottom: [ox + size, oy + size * 2, size, size],
    right: [ox, oy + (size * 3) / 2, size, size / 2],
    front: [ox + size, oy + (size * 3) / 2, size, size / 2],
    left: [ox + size * 2, oy + (size * 3) / 2, size, size / 2],
    back: [ox + size * 3, oy + (size * 3) / 2, size, size / 2],
  };
}

export function drawShield(
  generator: Generator,
  templateId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const regions = makeFaces(ox, oy);
  const patternFaceId = Face.makePatternFaceId(templateId);
  const baseInputId = Face.makeTemplateBaseInputId(templateId);

  Face.defineBaseInput(generator, templateId, "shield");

  Face.defineInputRegion(generator, patternFaceId, regions.top);
  Face.defineInputRegion(generator, patternFaceId, regions.bottom);
  Face.defineInputRegion(generator, patternFaceId, regions.right);
  Face.defineInputRegion(generator, patternFaceId, regions.front);
  Face.defineInputRegion(generator, patternFaceId, regions.left);
  Face.defineInputRegion(generator, patternFaceId, regions.back);

  Face.drawFace(
    generator,
    patternFaceId,
    [0, 0, 16, 16],
    regions.top,
    undefined,
    "shield",
    baseInputId
  );
  Face.drawFace(
    generator,
    patternFaceId,
    [0, 0, 16, 16],
    regions.bottom,
    undefined,
    "shield",
    baseInputId
  );
  Face.drawFace(
    generator,
    patternFaceId,
    [0, 8, 16, 8],
    regions.right,
    undefined,
    "shield",
    baseInputId
  );
  Face.drawFace(
    generator,
    patternFaceId,
    [0, 8, 16, 8],
    regions.front,
    undefined,
    "shield",
    baseInputId
  );
  Face.drawFace(
    generator,
    patternFaceId,
    [0, 8, 16, 8],
    regions.left,
    undefined,
    "shield",
    baseInputId
  );
  Face.drawFace(
    generator,
    patternFaceId,
    [0, 8, 16, 8],
    regions.back,
    undefined,
    "shield",
    baseInputId
  );

  // Model-based shield rendering will replace the individual drawFace calls above.
  // Example:
  // Face.drawCuboid(
  //   generator,
  //   "ShieldFaceFront" + templateId,
  //   "shield",
  //   {
  //     front: [2, 2, 10, 20],
  //     back: [2, 2, 10, 20],
  //     top: [2, 2, 10, 1],
  //     bottom: [2, 21, 10, 1],
  //     left: [2, 2, 1, 20],
  //     right: [11, 2, 1, 20],
  //   },
  //   [regions.front[0], regions.front[1]],
  //   [regions.front[2], regions.front[3], 3],
  //   { center: "Front" }
  // );

  generator.drawImage("Tabs-Shield", [ox - 96, oy - 3]);

  if (showFolds) {
    generator.drawImage("Folds-Shield", [ox - 96, oy - 3]);
  }
}
