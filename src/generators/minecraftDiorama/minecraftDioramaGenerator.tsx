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
import {
  parseAtlas,
  updateCustomTextureAtlas,
  updateCustomTextureUrl,
} from "../_common/textures/customTextureVersion";
import {
  allTextureDefs,
  versionIdsBlocksFirst as versionIds,
} from "../_common/textures/textureVersions";
import { TexturePicker } from "../_common/plugins/texturePicker/texturePicker";
import { blockTintChoiceGroups } from "../_common/plugins/texturePicker/tints";
import { drawBlocks } from "./editModes/blocks";
import {
  drawDestinationRegions,
  getCurrentDestination,
} from "./editModes/destination";
import { drawFolds } from "./editModes/folds";
import {
  defaultDestination,
  defaultSource,
  getDioramaDocument,
  type DioramaOptions,
} from "./editModes/shared";
import { drawSourceRegions, getCurrentSource } from "./editModes/source";
import { drawTabs } from "./editModes/tabs";

import thumbnailImage from "./thumbnail/v2-thumbnail-256.jpeg";
import backgroundImage from "./images/Background.png";
import titleLandscapeImage from "./images/TitleLandscape.png";
import titlePortraitImage from "./images/TitlePortrait.png";
import cornerTexture from "./textures/Corner.png";
import debugTexture from "./textures/debug.png";
import foldTexture from "./textures/Fold.png";
import foldCornerTexture from "./textures/FoldCorner.png";
import foldSlabTexture from "./textures/FoldSlab.png";
import slabTexture from "./textures/Slab.png";
import tabTexture from "./textures/Tab.png";
import tabCornerTexture from "./textures/TabCorner.png";
import tabLeftTexture from "./textures/TabLeft.png";
import tabMiddleTexture from "./textures/TabMiddle.png";
import tabRightTexture from "./textures/TabRight.png";
import tabSlabTexture from "./textures/TabSlab.png";

const id = "minecraft-diorama";

const name = "Minecraft Diorama";

const history: HistoryDef = [
  "24 Jan 2024 NinjolasNJM - Initial ReScript version.",
  "May 2026 NinjolasNJM - Plug generator into the TypeScript app.",
];

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const images: ImageDef[] = [
  { id: "Background", url: backgroundImage.src },
  { id: "Title Landscape", url: titleLandscapeImage.src },
  { id: "Title Portrait", url: titlePortraitImage.src },
];

const dioramaTextureDefs: TextureDef[] = [
  {
    id: "Diorama Corner",
    url: cornerTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Debug",
    url: debugTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Fold",
    url: foldTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Fold Corner",
    url: foldCornerTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Fold Slab",
    url: foldSlabTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Slab",
    url: slabTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Tab",
    url: tabTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Tab Corner",
    url: tabCornerTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Tab Left",
    url: tabLeftTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Tab Middle",
    url: tabMiddleTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Tab Right",
    url: tabRightTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
  {
    id: "Diorama Tab Slab",
    url: tabSlabTexture.src,
    standardWidth: 128,
    standardHeight: 128,
  },
];

const textures: TextureDef[] = allTextureDefs.concat(dioramaTextureDefs);

function drawTexturePicker(generator: Generator, versionId: string | null) {
  const currentTextureJson = generator.getStringInputValue(
    "CurrentBlockTexture"
  );
  const currentTexture = currentTextureJson
    ? decodeSelectedTexture(currentTextureJson)
    : null;

  generator.defineCustomStringInput("CurrentBlockTexture", (onChange) => {
    if (!versionId) {
      return null;
    }

    return (
      <TexturePicker
        versionId={versionId}
        selectedTexture={currentTexture}
        tintChoiceGroups={blockTintChoiceGroups}
        onChange={(selectedTexture) => {
          onChange(encodeSelectedTexture(selectedTexture));
        }}
      />
    );
  });
}

function defineCustomTextureInput(
  generator: Generator,
  versionId: string | null
) {
  if (versionId !== "custom") {
    return;
  }

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
  if (!customTexture) {
    return;
  }

  const textureUrl = customTexture.imageWithCanvas.image.src;
  if (customAtlas && customAtlas.frames.length > 0) {
    updateCustomTextureAtlas(textureUrl, customAtlas);
  } else {
    updateCustomTextureUrl(textureUrl);
  }
}

function drawDiorama(generator: Generator, options: DioramaOptions) {
  drawBlocks(generator, options);
  drawTabs(generator, options);
  drawFolds(generator, options);
  drawSourceRegions(generator, options);
  drawDestinationRegions(generator, options);
}

function getDioramaDimensions(generator: Generator) {
  const dioramaSize = generator.defineAndGetSelectInput("Diorama Size", [
    "800%",
    "400%",
    "200%",
    "Custom",
  ]);

  const dioramaWidth =
    dioramaSize === "Custom"
      ? generator.defineAndGetRangeInput("Diorama Width", {
          min: 100,
          max: 1600,
          value: 800,
          step: 50,
          showValue: true,
        })
      : parseInt(dioramaSize ?? "800", 10);

  const separateHeight =
    dioramaSize === "Custom"
      ? generator.defineAndGetBooleanInput("Separate Height", false)
      : false;

  const dioramaHeight =
    dioramaSize === "Custom" && separateHeight
      ? generator.defineAndGetRangeInput("Diorama Height", {
          min: 100,
          max: 1600,
          value: 800,
          step: 50,
          showValue: true,
        })
      : dioramaWidth;

  return {
    dioramaSize,
    dioramaWidth,
    dioramaHeight,
  };
}

const script: ScriptDef = (generator: Generator) => {
  generator.defineSelectInput("Version", versionIds);

  const versionId = generator.getSelectInputValue("Version");

  defineCustomTextureInput(generator, versionId);
  drawTexturePicker(generator, versionId);

  const editMode = generator.defineAndGetSelectInput("Edit Mode", [
    "Blocks",
    "Tabs",
    "Folds",
    "Source",
    "Destination",
  ]);
  const document = getDioramaDocument(generator);
  const currentSource =
    editMode === "Source" ? getCurrentSource(generator) : defaultSource;
  const currentDestination =
    editMode === "Destination"
      ? getCurrentDestination(generator)
      : defaultDestination;
  const { dioramaSize, dioramaWidth, dioramaHeight } =
    getDioramaDimensions(generator);
  const isLandscape = generator.defineAndGetBooleanInput(
    "Landscape Mode",
    false
  );
  const showEditRegions = generator.defineAndGetBooleanInput(
    "Show Edit Regions",
    false
  );

  generator.usePage("Page", {
    orientation: isLandscape ? "landscape" : "portrait",
  });
  generator.fillBackgroundColorWithWhite();
  generator.drawImage("Background", [0, 0]);

  const ox = 42; //isLandscape ? 37 : 42; ( why was it like that before? did it rotate the other way or something?)
  const oy = 41;
  const baseWidth = isLandscape ? 768 : 512;
  const baseHeight = isLandscape ? 512 : 768;
  const width = Math.round((16 * dioramaWidth) / 100);
  const height = Math.round((16 * dioramaHeight) / 100);

  drawDiorama(generator, {
    ox,
    oy,
    width,
    height,
    columns: Math.max(1, Math.floor(baseWidth / width)),
    rows: Math.max(1, Math.floor(baseHeight / height)),
    editMode,
    showEditRegions,
    document,
    currentSource,
    currentDestination,
  });

  generator.defineButtonInput("Clear", () => {
    const currentTextureChoice = generator.getStringInputValue(
      "CurrentBlockTexture"
    );
    const currentVersionId = versionId;
    const currentEditMode = editMode;
    const currentDioramaSize = dioramaSize;
    const currentPageFormat = isLandscape;
    const currentShowEditRegions = showEditRegions;
    const currentSourceX = generator.getNumberVariable("Source X");
    const currentSourceY = generator.getNumberVariable("Source Y");
    const currentSourceWidth = generator.getNumberVariable("Source Width");
    const currentSourceHeight = generator.getNumberVariable("Source Height");
    const currentDestinationWidth =
      generator.getNumberVariable("Destination Width");
    const currentDestinationHeight =
      generator.getNumberVariable("Destination Height");

    generator.clearAllVariables();

    if (currentTextureChoice) {
      generator.setStringInputValue(
        "CurrentBlockTexture",
        currentTextureChoice
      );
    }
    if (currentVersionId) {
      generator.setSelectInputValue("Version", currentVersionId);
    }
    if (currentEditMode) {
      generator.setSelectInputValue("Edit Mode", currentEditMode);
    }
    if (currentDioramaSize) {
      generator.setSelectInputValue("Diorama Size", currentDioramaSize);
    }
    generator.setBooleanInputValue("Landscape Mode", currentPageFormat);
    generator.setBooleanInputValue("Show Edit Regions", currentShowEditRegions);
    if (currentSourceX !== null) {
      generator.setNumberVariable("Source X", currentSourceX);
    }
    if (currentSourceY !== null) {
      generator.setNumberVariable("Source Y", currentSourceY);
    }
    if (currentSourceWidth !== null) {
      generator.setNumberVariable("Source Width", currentSourceWidth);
    }
    if (currentSourceHeight !== null) {
      generator.setNumberVariable("Source Height", currentSourceHeight);
    }
    if (currentDestinationWidth !== null) {
      generator.setNumberVariable("Destination Width", currentDestinationWidth);
    }
    if (currentDestinationHeight !== null) {
      generator.setNumberVariable(
        "Destination Height",
        currentDestinationHeight
      );
    }
  });

  generator.drawImage(
    isLandscape ? "Title Landscape" : "Title Portrait",
    [0, 0]
  );
};

export const generator: GeneratorDef = {
  id,
  name,
  history,
  thumbnail,
  video: null,
  instructions: null,
  images,
  textures,
  script,
};
