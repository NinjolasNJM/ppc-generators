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

const size = 128;

function makeFaces(ox: number, oy: number): Faces {
  return {
    top: [ox + size, oy + 0, size, size],
    bottom: [ox + size, oy + size * 2, size, size],
    right: [ox, oy + size, size, size],
    front: [ox + size, oy + size, size, size],
    left: [ox + size * 2, oy + size, size, size],
    back: [ox + size * 3, oy + size, size, size],
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

  Face.defineInputRegion(generator, "BannerFaceTop" + templateId, regions.top);
  Face.defineInputRegion(
    generator,
    "BannerFaceBottom" + templateId,
    regions.bottom
  );
  Face.defineInputRegion(
    generator,
    "BannerFaceRight" + templateId,
    regions.right
  );
  Face.defineInputRegion(
    generator,
    "BannerFaceFront" + templateId,
    regions.front
  );
  Face.defineInputRegion(generator, "BannerFaceLeft" + templateId, regions.left);
  Face.defineInputRegion(generator, "BannerFaceBack" + templateId, regions.back);

  Face.drawFace(
    generator,
    "BannerFaceTop" + templateId,
    [0, 0, 16, 16],
    regions.top
  );
  Face.drawFace(
    generator,
    "BannerFaceBottom" + templateId,
    [0, 0, 16, 16],
    regions.bottom
  );
  Face.drawFace(
    generator,
    "BannerFaceRight" + templateId,
    [0, 0, 16, 16],
    regions.right
  );
  Face.drawFace(
    generator,
    "BannerFaceFront" + templateId,
    [0, 0, 16, 16],
    regions.front
  );
  Face.drawFace(
    generator,
    "BannerFaceLeft" + templateId,
    [0, 0, 16, 16],
    regions.left
  );
  Face.drawFace(
    generator,
    "BannerFaceBack" + templateId,
    [0, 0, 16, 16],
    regions.back
  );

  generator.drawImage("Tabs-Banner", [ox - 32, oy - 1]);

  if (showFolds) {
    generator.drawImage("Folds-Banner", [ox - 32, oy - 1]);
  }
}
