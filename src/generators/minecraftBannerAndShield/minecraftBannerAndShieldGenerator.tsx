"use client";

import type {
  GeneratorDef,
  HistoryDef,
  ImageDef,
  ScriptDef,
  TextureDef,
  ThumbnailDef,
} from "@genroot/builder/modules/generatorDef";
import { type Generator } from "@genroot/builder/modules/generator";
import {
  decodeSelectedTexture,
  encodeSelectedTexture,
} from "@genroot/builder/ui/texturePicker/selectedTexture";
import { TexturePicker } from "../_common/plugins/texturePicker/texturePicker";
import { blockTintChoiceGroups } from "../_common/tintSelector/tints";
import {
  parseAtlas,
  updateCustomTextureAtlas,
  updateCustomTextureUrl,
} from "../_common/textures/customTextureVersion";
import {
  allTextureDefs,
  versionIdsBlocksFirst,
} from "../_common/textures/textureVersions";
import { currentBannerAndShieldTextureId } from "./constants";
import { drawBlock } from "./shapes/block";

import foregroundImage from "./images/Foreground.png";
import thumbnailImage from "./thumbnail/v2-thumbnail-256.jpeg";

const id = "minecraft-banner-and-shield";

const name = "Minecraft Banner and Shield";

const history: HistoryDef = [
  "May 2026 NinjolasNJM - Initial TypeScript version.",
];

const instructions = `
## How to use the Minecraft Banner and Shield Generator?

This generator is an early work-in-progress. For now, it uses the block generator's texture picker and a single block-style test shape while the banner and shield rendering is built out.
`;

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const images: ImageDef[] = [{ id: "Foreground", url: foregroundImage.src }];

const textures: TextureDef[] = allTextureDefs;

const script: ScriptDef = (generator: Generator) => {
  generator.defineSelectInput("Version", versionIdsBlocksFirst);

  const versionId = generator.getSelectInputValue("Version");

  if (versionId === "custom") {
    generator.defineAtlasInput("custom", {
      label: "Custom",
      standardWidth: 32,
      standardHeight: 32,
      choices: [],
    });

    const customAtlas = parseAtlas(
      generator.getStringInputValue("custom Frames")
    );
    const customTexture = generator.getTexture("custom");
    if (customTexture) {
      const textureUrl = customTexture.imageWithCanvas.image.src;
      if (customAtlas && customAtlas.frames.length > 0) {
        updateCustomTextureAtlas(textureUrl, customAtlas);
      } else {
        updateCustomTextureUrl(textureUrl);
      }
    }
  }

  const currentTextureJson = generator.getStringInputValue(
    currentBannerAndShieldTextureId
  );
  const currentTexture = currentTextureJson
    ? decodeSelectedTexture(currentTextureJson)
    : null;
  if (
    currentTexture !== null &&
    currentTexture.textureDefId !== "" &&
    currentTexture.textureDefId !== versionId
  ) {
    generator.setStringInputValue(currentBannerAndShieldTextureId, "");
  }

  const resolvedCurrentTextureJson = generator.getStringInputValue(
    currentBannerAndShieldTextureId
  );
  const resolvedCurrentTexture = resolvedCurrentTextureJson
    ? decodeSelectedTexture(resolvedCurrentTextureJson)
    : null;

  generator.defineCustomStringInput(
    currentBannerAndShieldTextureId,
    (onChange) => {
      if (!versionId) {
        return null;
      }
      return (
        <TexturePicker
          versionId={versionId}
          selectedTexture={resolvedCurrentTexture}
          tintChoiceGroups={blockTintChoiceGroups}
          onChange={(selectedTexture) => {
            onChange(encodeSelectedTexture(selectedTexture));
          }}
        />
      );
    }
  );

  generator.fillBackgroundColorWithWhite();
  drawBlock(generator, "1", 57, 16);
  generator.drawImage("Foreground", [0, 0]);

  generator.defineButtonInput(
    "Clear",
    () => {
      const currentTextureChoice = generator.getStringInputValue(
        currentBannerAndShieldTextureId
      );

      generator.clearAllVariables();

      if (currentTextureChoice) {
        generator.setStringInputValue(
          currentBannerAndShieldTextureId,
          currentTextureChoice
        );
      }
    },
    "Red"
  );
};

export const generator: GeneratorDef = {
  id,
  name,
  history,
  thumbnail,
  video: null,
  instructions,
  images,
  textures,
  script,
};
