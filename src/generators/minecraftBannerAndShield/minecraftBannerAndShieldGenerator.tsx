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
  decodeSelectedBannerShieldPattern,
  encodeSelectedBannerShieldPattern,
} from "./bannerTexturePicker/types";
import { PatternTexturePicker } from "./bannerTexturePicker/patternTexturePicker";
import {
  dyeTintGroup
} from "../_common/tintSelector/tints";
import { parseAtlas } from "../_common/textures/customTextureVersion";
import { currentBannerAndShieldTextureId } from "./constants";
import { drawBanner } from "./shapes/banner";
import { drawShield } from "./shapes/shield";
import {
  updateCustomBannerTextureAtlas,
  updateCustomShieldTextureAtlas,
} from "./textures/customBannerShieldTextureVersion";
import {
  bannerShieldTextureDefs,
  bannerShieldVersionIds,
} from "./textures/textureVersions";

import titleImage from "./images/Title.png";
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

This generator is an early work-in-progress. Choose a pattern, tint it, and click banner or shield regions to layer it onto the template.
`;

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const images: ImageDef[] = [
  { id: "Title", url: titleImage.src },
  { id: "Folds-Banner", url: foldsBannerImage.src },
  { id: "Folds-Shield", url: foldsShieldImage.src },
  { id: "Tabs-Banner", url: tabsBannerImage.src },
  { id: "Tabs-Shield", url: tabsShieldImage.src },
];

const textures: TextureDef[] = bannerShieldTextureDefs;

const script: ScriptDef = (generator: Generator) => {
  generator.usePage("Page", { size: "A4_Large" });

  generator.defineSelectInput("Version", bannerShieldVersionIds);

  const versionId = generator.getSelectInputValue("Version");

  if (versionId === "custom") {
    generator.defineAtlasInput("custom-banner-patterns", {
      label: "Custom Banner Patterns",
      standardWidth: 64,
      standardHeight: 64,
      choices: [],
    });
    generator.defineAtlasInput("custom-shield-patterns", {
      label: "Custom Shield Patterns",
      standardWidth: 64,
      standardHeight: 64,
      choices: [],
    });

    const customBannerAtlas = parseAtlas(
      generator.getStringInputValue("custom-banner-patterns Frames")
    );
    const customBannerTexture = generator.getTexture("custom-banner-patterns");
    if (customBannerTexture && customBannerAtlas) {
      updateCustomBannerTextureAtlas(
        customBannerTexture.imageWithCanvas.image.src,
        customBannerAtlas
      );
    }

    const customShieldAtlas = parseAtlas(
      generator.getStringInputValue("custom-shield-patterns Frames")
    );
    const customShieldTexture = generator.getTexture("custom-shield-patterns");
    if (customShieldTexture && customShieldAtlas) {
      updateCustomShieldTextureAtlas(
        customShieldTexture.imageWithCanvas.image.src,
        customShieldAtlas
      );
    }
  }

  const currentPatternJson = generator.getStringInputValue(
    currentBannerAndShieldTextureId
  );
  const currentPattern = currentPatternJson
    ? decodeSelectedBannerShieldPattern(currentPatternJson)
    : null;
  if (
    currentPattern !== null &&
    currentPattern.patternId !== "" &&
    currentPattern.versionId !== versionId
  ) {
    generator.setStringInputValue(currentBannerAndShieldTextureId, "");
  }

  const resolvedCurrentPatternJson = generator.getStringInputValue(
    currentBannerAndShieldTextureId
  );
  const resolvedCurrentPattern = resolvedCurrentPatternJson
    ? decodeSelectedBannerShieldPattern(resolvedCurrentPatternJson)
    : null;

  generator.defineCustomStringInput(
    currentBannerAndShieldTextureId,
    (onChange) => {
      if (!versionId) {
        return null;
      }
      return (
        <PatternTexturePicker
          versionId={versionId}
          selectedPattern={resolvedCurrentPattern}
          tintChoiceGroups={[dyeTintGroup]}
          onChange={(selectedPattern) => {
            onChange(encodeSelectedBannerShieldPattern(selectedPattern));
          }}
        />
      );
    }
  );

  generator.defineSelectInput("Number of Templates", ["1", "2"]);
  const numberOfTemplatesInput = generator.getSelectInputValue(
    "Number of Templates"
  );
  const numberOfTemplates = numberOfTemplatesInput
    ? parseInt(numberOfTemplatesInput, 10)
    : 1;

  generator.defineBooleanInput("Show Folds", true);
  const showFolds = generator.getBooleanInputValue("Show Folds") ?? false;

  for (let i = 1; i <= numberOfTemplates; i += 1) {
    const templateId = i.toString();
    const typeName = `Template ${templateId} Type`;

    generator.defineSelectInput(typeName, ["Banner", "Shield"]);
    const templateType = generator.getSelectInputValue(typeName);

    const ox = 171;
    const oy = 48 + 1200 * (i - 1);

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

  generator.fillBackgroundColorWithWhite();
  generator.drawImage("Title", [0, 0]);

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
