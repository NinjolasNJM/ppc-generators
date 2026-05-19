import {
  type DrawTextureOptions,
  type Blend,
} from "@genroot/builder/modules/renderers/drawTexture";
import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import {
  Minecraft,
  type Cuboid,
  type Dimensions,
  type DrawCuboidOptions,
  type Face as MinecraftFace,
  type Position,
  type Rectangle,
} from "../_common/minecraft";
import { currentBannerAndShieldTextureId } from "./constants";
import {
  decodeSelectedBannerShieldPattern,
  decodeSelectedBannerShieldPatterns,
  encodeSelectedBannerShieldPatterns,
  type BannerShieldTarget,
  type SelectedBannerShieldPattern,
} from "./bannerTexturePicker/types";
import { findBannerShieldTextureVersion } from "./textures/textureVersions";

export const bannerBasePatternId = "banner_base";
export const shieldBasePatternId = "shield_base";
export const shieldBaseNoPatternId = "shield_base_nopattern";

export function makePatternFaceId(templateId: string): string {
  return "PatternFace" + templateId;
}

export function makeTemplateBaseInputId(templateId: string): string {
  return `Template ${templateId} Base`;
}

export function defineBaseInput(
  generator: Generator,
  templateId: string,
  target: BannerShieldTarget
) {
  const versionId = generator.getSelectInputValue("Version");
  const textureVersion = versionId
    ? findBannerShieldTextureVersion(versionId)
    : null;
  const options =
    target === "banner"
      ? textureVersion?.bases.bannerBase
        ? [bannerBasePatternId]
        : []
      : [
          textureVersion?.bases.shieldBase ? shieldBasePatternId : null,
          textureVersion?.bases.shieldBaseNoPattern
            ? shieldBaseNoPatternId
            : null,
        ].filter((value): value is string => value !== null);

  if (options.length > 0) {
    generator.defineSelectInput(makeTemplateBaseInputId(templateId), options);
  }
}

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
  options?: DrawTextureOptions,
  sourceScale: "Block16" | "Frame" = "Block16"
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
    sourceScale === "Block16" &&
    fw === fh &&
    fw > 0 &&
    fw % 16 === 0 &&
    fh % 16 === 0
      ? fw / 16
      : 1;
  const sourceRegion: Region = [
    fx + sx * scale,
    fy + sy * scale,
    sw * scale,
    sh * scale,
  ];
  const blend: Blend | undefined = pattern.blend
    ? { kind: "MultiplyHex", hex: pattern.blend }
    : options?.blend;

  generator.drawTexture(textureDef.id, sourceRegion, destination, {
    ...options,
    blend,
  });
}

function drawBasePattern(
  generator: Generator,
  target: BannerShieldTarget,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions,
  sourceScale: "Block16" | "Frame" = "Block16",
  baseInputId?: string
) {
  const versionId = generator.getSelectInputValue("Version");
  if (!versionId) {
    return;
  }

  const textureVersion = findBannerShieldTextureVersion(versionId);
  if (!textureVersion) {
    return;
  }

  const textureDef =
    target === "banner"
      ? textureVersion.bannerTextureDef
      : textureVersion.shieldTextureDef;
  const baseId = getSelectedBaseId(generator, target, baseInputId);
  const frame =
    target === "banner"
      ? baseId === bannerBasePatternId
        ? textureVersion.bases.bannerBase
        : null
      : baseId === shieldBaseNoPatternId
        ? textureVersion.bases.shieldBaseNoPattern
        : textureVersion.bases.shieldBase;
  if (!frame) {
    return;
  }

  const [sx, sy, sw, sh] = source;
  const [fx, fy, fw, fh] = frame.rectangle;
  const scale =
    sourceScale === "Block16" &&
    fw === fh &&
    fw > 0 &&
    fw % 16 === 0 &&
    fh % 16 === 0
      ? fw / 16
      : 1;
  const sourceRegion: Region = [
    fx + sx * scale,
    fy + sy * scale,
    sw * scale,
    sh * scale,
  ];

  generator.drawTexture(textureDef.id, sourceRegion, destination, options ?? {});
}

function getSelectedBaseId(
  generator: Generator,
  target: BannerShieldTarget,
  baseInputId?: string
): string {
  const templateBaseInputValue = baseInputId
    ? generator.getSelectInputValue(baseInputId)
    : null;

  if (templateBaseInputValue) {
    return templateBaseInputValue;
  }

  return target === "banner" ? bannerBasePatternId : shieldBasePatternId;
}

function drawPatternFace(
  generator: Generator,
  faceId: string,
  target: BannerShieldTarget,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions,
  sourceScale?: "Block16" | "Frame",
  baseInputId?: string
) {
  drawBasePattern(
    generator,
    target,
    source,
    destination,
    options,
    sourceScale,
    baseInputId
  );

  const facePatternsJson = generator.getStringInputValue(faceId);
  if (facePatternsJson) {
    const facePatterns = decodeSelectedBannerShieldPatterns(facePatternsJson);
    facePatterns.forEach((selectedPattern) => {
      drawPattern(
        generator,
        selectedPattern,
        target,
        source,
        destination,
        options,
        sourceScale
      );
    });
  }
}

export function drawFace(
  generator: Generator,
  faceId: string,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions,
  target: BannerShieldTarget = getFaceTarget(faceId),
  baseInputId?: string
) {
  drawPatternFace(
    generator,
    faceId,
    target,
    source,
    destination,
    options,
    "Block16",
    baseInputId
  );
}

class PatternMinecraft extends Minecraft {
  constructor(
    private patternGenerator: Generator,
    private target: BannerShieldTarget,
    private baseInputId?: string
  ) {
    super(patternGenerator);
  }

  override drawFaceTexture(
    faceId: string,
    source: Rectangle,
    dest: MinecraftFace
  ) {
    drawPatternFace(
      this.patternGenerator,
      faceId,
      this.target,
      source,
      dest.rectangle,
      {
        flip: dest.flip,
        rotateLegacy: dest.rotate,
        blend: dest.blend,
        plugin: dest.plugin ?? undefined,
      },
      "Frame",
      this.baseInputId
    );
  }
}

export function drawCuboid(
  generator: Generator,
  faceId: string,
  target: BannerShieldTarget,
  source: Cuboid,
  position: Position,
  dimensions: Dimensions,
  options: Partial<DrawCuboidOptions> = {},
  baseInputId?: string
) {
  new PatternMinecraft(generator, target, baseInputId).drawCuboid(
    faceId,
    source,
    position,
    dimensions,
    options
  );
}

function getFaceTarget(faceId: string): BannerShieldTarget {
  return faceId.startsWith("Shield") ? "shield" : "banner";
}
