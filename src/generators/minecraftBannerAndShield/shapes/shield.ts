import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import * as Face from "../face";
import {
  shield,
  type Dimensions,
} from "@genroot/generators/_common/minecraftEntity";

type Faces = {
  shield: Region;
};

const size = 384;

function makeFaces(ox: number, oy: number): Faces {
  return {
    shield: [ox + size / 2, oy + size / 2, 288, 528],
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
  const baseInputId = Face.makeTemplateBaseInputId(templateId, "shield");

  Face.defineBaseInput(generator, templateId, "shield");

  Face.defineInputRegion(generator, patternFaceId, regions.shield);

  let dimensions: Dimensions = [288, 528, 24];

  Face.drawCuboid(
    generator,
    patternFaceId,
    "shield",
    shield.shield,
    [regions.shield[0] - dimensions[2], regions.shield[1] - dimensions[2]],
    dimensions,
    {},
    baseInputId
  );

  dimensions = [48, 144, 144];

  Face.drawCuboid(
    generator,
    patternFaceId,
    "shield",
    shield.handle,
    [
      regions.shield[0] - dimensions[2] + size * 2.25,
      regions.shield[1] - dimensions[2] + size / 2,
    ],
    dimensions,
    {},
    baseInputId
  );

  //generator.drawImage("Tabs-Shield", [ox - 96, oy - 3]);

  if (showFolds) {
    generator.drawImage("Folds-Shield", [ox - 96, oy - 3]);
  }
}
