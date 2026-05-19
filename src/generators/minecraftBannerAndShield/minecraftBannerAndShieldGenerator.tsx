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
import { drawBanner } from "./shapes/banner";
import { drawShield } from "./shapes/shield";

import backgroundImage from "./images/Background.png";
import foldsBannerImage from "./images/Folds-Banner.png";
import foldsShieldImage from "./images/Folds-Shield.png";
import tabsBannerImage from "./images/Tabs-Banner.png";
import tabsShieldImage from "./images/Tabs-Shield.png";
import thumbnailImage from "./thumbnail/v2-thumbnail-256.jpeg";

const id = "minecraft-banner-and-shield";

const name = "Minecraft Banner and Shield";

const history: HistoryDef = [
  "May 2026 NinjolasNJM - Initial TypeScript version.",
];

const instructions = `
## How to use the Minecraft Banner and Shield Generator?

This generator is an early work-in-progress. For now, it uses the block generator's texture picker and placeholder banner and shield templates while the true banner and shield rendering is built out.
`;

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const images: ImageDef[] = [
  { id: "Background", url: backgroundImage.src },
  { id: "Folds-Banner", url: foldsBannerImage.src },
  { id: "Folds-Shield", url: foldsShieldImage.src },
  { id: "Tabs-Banner", url: tabsBannerImage.src },
  { id: "Tabs-Shield", url: tabsShieldImage.src },
];

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

  generator.defineSelectInput("Number of Templates", ["1", "2"]);
  const numberOfTemplatesInput =
    generator.getSelectInputValue("Number of Templates");
  const numberOfTemplates = numberOfTemplatesInput
    ? parseInt(numberOfTemplatesInput, 10)
    : 1;

  generator.defineBooleanInput("Show Folds", true);
  const showFolds = generator.getBooleanInputValue("Show Folds") ?? false;

  generator.drawImage("Background", [0, 0]);

  for (let i = 1; i <= numberOfTemplates; i += 1) {
    const templateId = i.toString();
    const typeName = `Template ${templateId} Type`;

    generator.defineSelectInput(typeName, ["Banner", "Shield"]);
    const templateType = generator.getSelectInputValue(typeName);

    const ox = 57;
    const oy = 16 + 400 * (i - 1);

    switch (templateType) {
      case "Shield":
        drawShield(generator, templateId, ox, oy, showFolds);
        break;
      case "Banner":
      default:
        drawBanner(generator, templateId, ox, oy, showFolds);
        break;
    }
  }

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
