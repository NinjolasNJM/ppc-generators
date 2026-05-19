import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";
import {
  banner,
  type Dimensions,
} from "@genroot/generators/_common/minecraftEntity";

type Faces = {
  flag: Region;
};

const size = 384;

function makeFaces(ox: number, oy: number): Faces {
  //const [width, height, depth] = flagDimensions;
  return {
    flag: [ox, oy + size / 4, 320, 640],// [ox + size + depth, oy + depth, width, height],
  };
}


export function drawBanner(
  generator: Generator,
  templateId: string,
  ox: number,
  oy: number,
  showFolds: boolean
) {
  const regions = makeFaces(ox, oy);
  const patternFaceId = Face.makePatternFaceId(templateId);
  const baseInputId = Face.makeTemplateBaseInputId(templateId, "banner");

  Face.defineBaseInput(generator, templateId, "banner");

  Face.defineInputRegion(generator, patternFaceId, regions.flag);

  let dimensions: Dimensions = [320, 640, 16];

  Face.drawCuboid(
    generator,
    patternFaceId,
    "banner",
    banner.flag,
    [regions.flag[0] - dimensions[2], regions.flag[1] - dimensions[2]],
    dimensions,
    {},
    baseInputId
  );

  dimensions = [32, 704, 32];

    Face.drawCuboid(
    generator,
    patternFaceId,
    "banner",
    banner.pole,
    [regions.flag[0] - dimensions[2] + size * 2.5, regions.flag[1] - dimensions[2]],
    dimensions,
    {},
    baseInputId
  );

    dimensions = [320, 32, 32];

    Face.drawCuboid(
    generator,
    patternFaceId,
    "banner",
    banner.bar,
    [regions.flag[0] - dimensions[2], regions.flag[1] - dimensions[2] + size * 2.25],
    dimensions,
    {},
    baseInputId
  );


  //generator.drawImage("Tabs-Banner", [ox - 96, oy - 3]);

  if (showFolds) {
    generator.drawImage("Folds-Banner", [ox - 96, oy - 3]);
  }
}
