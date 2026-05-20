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
    shield: [ox + 94, oy + 312, 288, 528],
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
    [ox + 72, oy + 288],
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
      ox + 986,
      oy + 360,
    ],
    dimensions,
    {center: "Right"},
    baseInputId
  );

  // handle inside

  const [hx, hy] = [ox + 1010, oy + 720];

  Face.drawFace( generator, patternFaceId, [32, 7, 2, 4], [hx, hy, 48, 96], {rotate: 270}, baseInputId);
  Face.drawFace( generator, patternFaceId, [34, 1, 2, 4], [hx + 96, hy, 48, 96], {rotate: 90}, baseInputId);
  Face.drawFace( generator, patternFaceId, [40, 7, 2, 4], [hx + 96 * 2, hy, 48, 96], {rotate: 270},baseInputId);
  Face.drawFace( generator, patternFaceId, [32, 1, 2, 4], [hx + 96 * 3, hy, 48, 96],  {rotate: 270}, baseInputId);

  generator.drawImage("Tabs-Shield", [ox - 96, oy - 3]);

  if (showFolds) {
    generator.drawImage("Folds-Shield", [ox - 96, oy - 3]);
  }
}
