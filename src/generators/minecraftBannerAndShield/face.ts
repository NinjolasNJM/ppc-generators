import {
  type DrawTextureOptions,
  type Blend,
} from "@genroot/builder/modules/renderers/drawTexture";
import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import { currentBannerAndShieldTextureId } from "./constants";
import {
  decodeSelectedBannerShieldPattern,
  decodeSelectedBannerShieldPatterns,
  encodeSelectedBannerShieldPatterns,
  type BannerShieldTarget,
  type SelectedBannerShieldPattern,
} from "./bannerTexturePicker/types";
import { findBannerShieldTextureVersion } from "./textures/textureVersions";

export function defineInputRegion(
  generator: Generator,
  faceId: string,
  region: Region
) {
  generator.defineRegionInput(
    region,
    () => {
      const selectedPatternJson = generator.getStringInputValue(
        currentBannerAndShieldTextureId
      );

      const selectedPattern = selectedPatternJson
        ? decodeSelectedBannerShieldPattern(selectedPatternJson)
        : null;

      if (!selectedPattern) {
        return;
      }

      const currentFacePatternsJson = generator.getStringInputValue(faceId);
      const currentFacePatterns = currentFacePatternsJson
        ? decodeSelectedBannerShieldPatterns(currentFacePatternsJson)
        : [];

      const shouldErase = selectedPattern.patternId === "";
      const newFacePatterns = shouldErase
        ? currentFacePatterns.slice(0, -1)
        : currentFacePatterns.concat([selectedPattern]);
      generator.setStringInputValue(
        faceId,
        encodeSelectedBannerShieldPatterns(newFacePatterns)
      );
    },
    faceId
  );
}

function drawPattern(
  generator: Generator,
  pattern: SelectedBannerShieldPattern,
  target: BannerShieldTarget,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions
) {
  const textureVersion = findBannerShieldTextureVersion(pattern.versionId);
  const texturePattern = textureVersion?.patterns.find(
    ({ id }) => id === pattern.patternId
  );
  if (!textureVersion || !texturePattern) {
    return;
  }

  const textureDef =
    target === "banner"
      ? textureVersion.bannerTextureDef
      : textureVersion.shieldTextureDef;
  const frame =
    target === "banner"
      ? texturePattern.bannerFrame
      : texturePattern.shieldFrame;
  if (!frame) {
    return;
  }

  const [sx, sy, sw, sh] = source;
  const [fx, fy, fw, fh] = frame.rectangle;
  const scale =
    fw === fh && fw > 0 && fw % 16 === 0 && fh % 16 === 0 ? fw / 16 : 1;
  const sourceRegion: Region = [
    fx + sx * scale,
    fy + sy * scale,
    sw * scale,
    sh * scale,
  ];
  const blend: Blend | undefined = pattern.blend
    ? { kind: "MultiplyHex", hex: pattern.blend }
    : undefined;

  generator.drawTexture(textureDef.id, sourceRegion, destination, {
    ...options,
    blend,
  });
}

export function drawFace(
  generator: Generator,
  faceId: string,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions
) {
  const target = getFaceTarget(faceId);
  const facePatternsJson = generator.getStringInputValue(faceId);
  if (facePatternsJson) {
    const facePatterns = decodeSelectedBannerShieldPatterns(facePatternsJson);
    facePatterns.forEach((selectedPattern) => {
      drawPattern(generator, selectedPattern, target, source, destination, options);
    });
  }
}

function getFaceTarget(faceId: string): BannerShieldTarget {
  return faceId.startsWith("Shield") ? "shield" : "banner";
}
