"use client";

import type {
  GeneratorDef,
  HistoryDef,
  ImageDef,
  ScriptDef,
  TextureDef,
  ThumbnailDef,
} from "@genroot/builder/modules/generatorDef";
import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
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
import { drawFace } from "../_common/plugins/texturePicker/face";
import { TexturePicker } from "../_common/plugins/texturePicker/texturePicker";
import { blockTintChoiceGroups } from "../_common/plugins/texturePicker/tints";

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

type EditMode = "Blocks" | "Tabs" | "Folds";

type DioramaOptions = {
  ox: number;
  oy: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
  editMode: EditMode | string | null;
};

type RegionDef = {
  id: string;
  region: Region;
  rotation: 0 | 1 | 2 | 3;
};

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

function makeBlockRegions({
  ox,
  oy,
  width,
  height,
  columns,
  rows,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      regions.push({
        id: `BlockFace${column} ${row}`,
        region: [ox + width * column, oy + height * row, width, height],
        rotation: 0,
      });
    }
  }
  return regions;
}

function makeEdgeRegions({
  ox,
  oy,
  width,
  height,
  columns,
  rows,
}: DioramaOptions): RegionDef[] {
  const regions: RegionDef[] = [];

  const makeNorth = (column: number, row: number): RegionDef => ({
    id: `North${column} ${row}`,
    region: [ox + width * column, oy + height * row, width, height / 4],
    rotation: 2,
  });
  const makeSouth = (column: number, row: number): RegionDef => ({
    id: `South${column} ${row}`,
    region: [
      ox + width * column,
      oy + (height * 3) / 4 + height * row,
      width,
      height / 4,
    ],
    rotation: 0,
  });
  const makeEast = (column: number, row: number): RegionDef => ({
    id: `East${column} ${row}`,
    region: [ox + width * column, oy + height * row, width / 4, height],
    rotation: 1,
  });
  const makeWest = (column: number, row: number): RegionDef => ({
    id: `West${column} ${row}`,
    region: [
      ox + (width * 3) / 4 + width * column,
      oy + height * row,
      width / 4,
      height,
    ],
    rotation: 3,
  });

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      regions.push(
        makeNorth(column, row),
        makeSouth(column, row),
        makeEast(column, row),
        makeWest(column, row)
      );
    }
  }

  for (let column = 0; column < columns; column += 1) {
    regions.push(makeNorth(column, rows), makeSouth(column, -1));
  }
  for (let row = 0; row < rows; row += 1) {
    regions.push(makeEast(columns, row), makeWest(-1, row));
  }

  return regions;
}

function drawBlocks(generator: Generator, options: DioramaOptions) {
  const regions = makeBlockRegions(options);

  regions.forEach(({ id: faceId, region }) => {
    if (options.editMode === "Blocks") {
      drawRectangleButton(generator, region);
      defineBlockRegion(generator, faceId, region);
    }

    drawFace(generator, faceId, [0, 0, 16, 16], region);
  });
}

function defineBlockRegion(
  generator: Generator,
  faceId: string,
  region: Region
) {
  generator.defineRegionInput(region, () => {
    const selectedTextureJson = generator.getStringInputValue(
      "CurrentBlockTexture"
    );
    if (!selectedTextureJson) {
      return;
    }

    const selectedTexture = decodeSelectedTexture(selectedTextureJson);
    generator.setStringInputValue(
      faceId,
      selectedTexture.textureDefId === "" ? "[]" : `[${selectedTextureJson}]`
    );
  });
}

function getNextTabValue(value: number): number {
  return value === 4 ? 0 : value + 1;
}

function getTabTextureId(value: number): string | null {
  switch (value) {
    case 1:
      return "Diorama Tab";
    case 2:
      return "Diorama Tab Left";
    case 3:
      return "Diorama Tab Middle";
    case 4:
      return "Diorama Tab Right";
    default:
      return null;
  }
}

function drawTabs(generator: Generator, options: DioramaOptions) {
  const regions = makeEdgeRegions(options);

  regions.forEach(({ id, region, rotation }) => {
    const tabId = `Tabs${id}`;
    const tabValue = parseInt(generator.getSelectInputValue(tabId) ?? "0", 10);

    if (options.editMode === "Tabs") {
      drawRectangleButton(generator, region);
      generator.defineRegionInput(region, () => {
        generator.setSelectInputValue(
          tabId,
          getNextTabValue(tabValue).toString()
        );
      });
    }

    const textureId = getTabTextureId(tabValue);
    if (textureId) {
      generator.drawTexture(textureId, [0, 0, 128, 128], region, {
        rotate: rotation * 90,
      });
    }
  });
}

function drawFolds(generator: Generator, options: DioramaOptions) {
  const regions = makeEdgeRegions(options);

  regions.forEach(({ id, region, rotation }) => {
    const foldId = `Folds${id}`;
    const isFoldEnabled = generator.getBooleanInputValue(foldId) ?? false;

    if (options.editMode === "Folds") {
      drawRectangleButton(generator, region);
      generator.defineRegionInput(region, () => {
        generator.setBooleanInputValue(foldId, !isFoldEnabled);
      });
    }

    if (isFoldEnabled) {
      drawFoldLine(generator, region, rotation);
    }
  });
}

function drawFoldLine(
  generator: Generator,
  [x, y, width, height]: Region,
  rotation: RegionDef["rotation"]
) {
  switch (rotation) {
    case 0:
      generator.drawFoldLine([x, y + height - 1], [x + width, y + height - 1]);
      break;
    case 1:
      generator.drawFoldLine([x, y], [x, y + height]);
      break;
    case 2:
      generator.drawFoldLine([x, y], [x + width, y]);
      break;
    case 3:
      generator.drawFoldLine([x + width - 1, y], [x + width - 1, y + height]);
      break;
  }
}

function drawRectangleButton(generator: Generator, region: Region) {
  generator.drawRectangle(region, {
    color: "#2d9cdb",
    lineDash: [3, 3],
    width: 1,
  });
}

function drawDiorama(generator: Generator, options: DioramaOptions) {
  drawBlocks(generator, options);
  drawTabs(generator, options);
  drawFolds(generator, options);
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
  ]);
  const { dioramaSize, dioramaWidth, dioramaHeight } =
    getDioramaDimensions(generator);
  const isLandscape = generator.defineAndGetBooleanInput(
    "Landscape Mode",
    false
  );

  generator.usePage("Page");
  generator.fillBackgroundColorWithWhite();
  generator.drawImage("Background", [0, 0]);

  const ox = isLandscape ? 37 : 42;
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
  });

  generator.defineButtonInput("Clear", () => {
    const currentTextureChoice = generator.getStringInputValue(
      "CurrentBlockTexture"
    );
    const currentVersionId = versionId;
    const currentEditMode = editMode;
    const currentDioramaSize = dioramaSize;
    const currentPageFormat = isLandscape;

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
