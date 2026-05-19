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

  Face.defineInputRegion(generator, "ShieldFaceTop" + templateId, regions.top);
  Face.defineInputRegion(
    generator,
    "ShieldFaceBottom" + templateId,
    regions.bottom
  );
  Face.defineInputRegion(
    generator,
    "ShieldFaceRight" + templateId,
    regions.right
  );
  Face.defineInputRegion(
    generator,
    "ShieldFaceFront" + templateId,
    regions.front
  );
  Face.defineInputRegion(generator, "ShieldFaceLeft" + templateId, regions.left);
  Face.defineInputRegion(generator, "ShieldFaceBack" + templateId, regions.back);

  Face.drawFace(
    generator,
    "ShieldFaceTop" + templateId,
    [0, 0, 16, 16],
    regions.top
  );
  Face.drawFace(
    generator,
    "ShieldFaceBottom" + templateId,
    [0, 0, 16, 16],
    regions.bottom
  );
  Face.drawFace(
    generator,
    "ShieldFaceRight" + templateId,
    [0, 8, 16, 8],
    regions.right
  );
  Face.drawFace(
    generator,
    "ShieldFaceFront" + templateId,
    [0, 8, 16, 8],
    regions.front
  );
  Face.drawFace(
    generator,
    "ShieldFaceLeft" + templateId,
    [0, 8, 16, 8],
    regions.left
  );
  Face.drawFace(
    generator,
    "ShieldFaceBack" + templateId,
    [0, 8, 16, 8],
    regions.back
  );

  generator.drawImage("Tabs-Shield", [ox - 96, oy - 3]);

  if (showFolds) {
    generator.drawImage("Folds-Shield", [ox - 96, oy - 3]);
  }
}
