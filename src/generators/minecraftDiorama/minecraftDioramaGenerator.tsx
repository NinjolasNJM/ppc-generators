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
import { blockTintChoiceGroups } from "../_common/tintSelector/tints";
import { drawBlocks } from "./editModes/blocks";
import {
  defineAndGetPresetInput,
  drawDestinationRegions,
  getCurrentDestination,
} from "./editModes/destination";
import { drawFolds } from "./editModes/folds";
import {
  defaultSource,
  getColumnCountThatFits,
  getDefaultDestinationForPreset,
  getDioramaDocument,
  getRowCountThatFits,
  makeEmptyDioramaDocument,
  setDioramaDocument,
  defaultTransform,
  type DioramaOptions,
} from "./editModes/shared";
import { drawSourceRegions, getCurrentSource } from "./editModes/source";
import { drawTabs } from "./editModes/tabs";
import {
  drawTransformRegions,
  getCurrentTransform,
} from "./editModes/transform";

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

const maxDioramaFaces = 16384;
const maxDioramaPages = 512;
const pageCountInputId = "Diorama Page Count";
const pagesAcrossInputId = "Pages Across";

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
          generator.setSelectInputValue("Edit Mode", "Blocks");
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
  drawSourceRegions(generator, options);
  drawDestinationRegions(generator, options);
  drawTransformRegions(generator, options);
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

  return {
    dioramaSize,
    dioramaWidth,
    dioramaHeight: dioramaWidth,
  };
}

function getDioramaPageLayout(
  generator: Generator,
  document: ReturnType<typeof getDioramaDocument>,
  columns: number,
  rows: number
) {
  const facesPerPage = Math.max(1, columns * rows);
  const maxPageCount = Math.max(
    1,
    Math.min(maxDioramaPages, Math.floor(maxDioramaFaces / facesPerPage))
  );
  const requestedPageCount = Math.max(
    1,
    Math.min(
      Math.round(generator.getNumberVariable(pageCountInputId) ?? 1),
      maxPageCount
    )
  );
  generator.setNumberVariable(pageCountInputId, requestedPageCount);
  const currentPagesAcross = Math.max(
    1,
    Math.min(
      Math.round(
        generator.getNumberVariable(pagesAcrossInputId) ?? requestedPageCount
      ),
      requestedPageCount
    )
  );
  generator.setNumberVariable(pagesAcrossInputId, currentPagesAcross);

  generator.defineText(`Pages: ${requestedPageCount} / ${maxPageCount}`);
  const canAddPage = requestedPageCount < maxPageCount;
  const canRemovePage = requestedPageCount > 1;

  generator.defineButtonInput(
    "Add Page",
    () => {
      const nextPageCount = canAddPage
        ? Math.min(requestedPageCount + 1, maxPageCount)
        : requestedPageCount;
      generator.setNumberVariable(pageCountInputId, nextPageCount);
      if (currentPagesAcross >= requestedPageCount) {
        generator.setNumberVariable(pagesAcrossInputId, nextPageCount);
      }
    },
    canAddPage ? "Green" : "Gray"
  );
  generator.defineButtonInput(
    "Remove Page",
    () => {
      const nextPageCount = canRemovePage
        ? Math.max(1, requestedPageCount - 1)
        : requestedPageCount;
      generator.setNumberVariable(pageCountInputId, nextPageCount);
      generator.setNumberVariable(
        pagesAcrossInputId,
        Math.min(currentPagesAcross, nextPageCount)
      );
    },
    canRemovePage ? "Red" : "Gray"
  );
  generator.defineButtonInput(
    "Fit Pages to Design",
    () => {
      const fit = getPageLayoutForDesign(
        generator,
        document,
        columns,
        rows,
        maxPageCount
      );
      generator.setNumberVariable(pageCountInputId, fit.pageCount);
      generator.setNumberVariable(pagesAcrossInputId, fit.pageColumns);
    },
    "Blue"
  );

  return {
    pageCount: requestedPageCount,
    pageColumns: currentPagesAcross,
  };
}

function getPageLayoutForDesign(
  generator: Generator,
  document: ReturnType<typeof getDioramaDocument>,
  columns: number,
  rows: number,
  maxPageCount: number
) {
  const positions = getOccupiedFacePositions(generator, document);
  if (positions.length === 0) {
    return { pageCount: 1, pageColumns: 1 };
  }

  const pageColumns = Math.max(
    1,
    Math.max(
      ...positions.map((position) => Math.floor(position.column / columns))
    ) + 1
  );
  const lastPageIndex = Math.max(
    ...positions.map((position) => {
      const pageColumn = Math.max(0, Math.floor(position.column / columns));
      const pageRow = Math.max(0, Math.floor(position.row / rows));
      return pageRow * pageColumns + pageColumn;
    })
  );
  const pageCount = Math.min(maxPageCount, lastPageIndex + 1);

  return {
    pageCount,
    pageColumns: Math.min(pageColumns, pageCount),
  };
}

function getOccupiedFacePositions(
  generator: Generator,
  document: ReturnType<typeof getDioramaDocument>
): Array<{ column: number; row: number }> {
  return [
    ...Object.keys(document.sources),
    ...Object.keys(document.transforms),
    ...Object.keys(document.destinationColumns).map((column) => `${column} 0`),
    ...Object.keys(document.destinationRows).map((row) => `0 ${row}`),
    ...getOccupiedVariableFaceIds(generator),
  ]
    .map(getFacePositionFromId)
    .filter(
      (position): position is { column: number; row: number } =>
        position !== null
    );
}

function getOccupiedVariableFaceIds(generator: Generator): string[] {
  return Array.from(generator.model.values.variables.entries())
    .filter(([id, variable]) => {
      if (/^BlockFace-?\d+ -?\d+$/.test(id)) {
        return (
          variable.kind === "String" &&
          variable.value !== "" &&
          variable.value !== "[]"
        );
      }
      if (/^Tabs(?:North|South|East|West)-?\d+ -?\d+$/.test(id)) {
        return variable.kind === "String" && variable.value !== "0";
      }
      if (/^Folds(?:North|South|East|West)-?\d+ -?\d+$/.test(id)) {
        return variable.kind === "Boolean" && variable.value;
      }
      return false;
    })
    .map(([id]) => id);
}

function getFacePositionFromId(
  id: string
): { column: number; row: number } | null {
  const match =
    /^(?:BlockFace|Tabs(?:North|South|East|West)|Folds(?:North|South|East|West))?(-?\d+) (-?\d+)$/.exec(
      id
    );
  if (!match) {
    return null;
  }

  return {
    column: parseInt(match[1] ?? "0", 10),
    row: parseInt(match[2] ?? "0", 10),
  };
}

const script: ScriptDef = (generator: Generator) => {
  generator.defineSelectInput("Version", versionIds);

  const versionId = generator.getSelectInputValue("Version");

  defineCustomTextureInput(generator, versionId);
  drawTexturePicker(generator, versionId);
  const { dioramaSize, dioramaWidth, dioramaHeight } =
    getDioramaDimensions(generator);
  const document = defineAndGetPresetInput(
    generator,
    getDioramaDocument(generator)
  );
  const editMode = generator.defineAndGetSelectInput("Edit Mode", [
    "Blocks",
    "Tabs",
    "Folds",
    "Source",
    "Destination",
    "Transform",
  ]);
  const currentSource =
    editMode === "Source" ? getCurrentSource(generator) : defaultSource;
  const currentDestination =
    editMode === "Destination"
      ? getCurrentDestination(
          generator,
          getDefaultDestinationForPreset(document.preset)
        )
      : getDefaultDestinationForPreset(document.preset);
  const currentTransform =
    editMode === "Transform" ? getCurrentTransform(generator) : defaultTransform;

  const isLandscape = generator.defineAndGetBooleanInput(
    "Landscape Mode",
    false
  );
  const showEditRegions = generator.defineAndGetBooleanInput(
    "Show Edit Regions",
    false
  );

  const ox = 42; //isLandscape ? 37 : 42; ( why was it like that before? did it rotate the other way or something?)
  const oy = 41;
  const baseWidth = isLandscape ? 768 : 512;
  const baseHeight = isLandscape ? 512 : 768;
  const width = Math.round((16 * dioramaWidth) / 100);
  const height = Math.round((16 * dioramaHeight) / 100);
  const columns = getColumnCountThatFits({ baseWidth, width, document });
  const rows = getRowCountThatFits({ baseHeight, height, document });
  const { pageCount, pageColumns } = getDioramaPageLayout(
    generator,
    document,
    columns,
    rows
  );

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageColumn = pageIndex % pageColumns;
    const pageRow = Math.floor(pageIndex / pageColumns);
    generator.usePage(pageCount === 1 ? "Page" : `Page ${pageIndex + 1}`, {
      orientation: isLandscape ? "landscape" : "portrait",
    });
    generator.fillBackgroundColorWithWhite();
    generator.drawImage("Background", [0, 0]);

    const dioramaOptions: DioramaOptions = {
      ox,
      oy,
      width,
      height,
      columns,
      rows,
      worldColumnOffset: pageColumn * columns,
      worldRowOffset: pageRow * rows,
      editMode,
      showEditRegions,
      document,
      currentSource,
      currentDestination,
      currentTransform,
    };

    drawDiorama(generator, dioramaOptions);

    generator.drawImage(
      isLandscape ? "Title Landscape" : "Title Portrait",
      [0, 0]
    );
  }

  generator.defineCustomStringInput("Diorama Clear Button Break", () => <div />);

  generator.defineButtonInput(
    "Clear",
    () => {
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
      const currentFaceRotation = generator.getSelectInputValue("Face Rotation");
      const currentFaceFlip = generator.getSelectInputValue("Face Flip");
      const currentPreset = document.preset;

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
      generator.setBooleanInputValue(
        "Show Edit Regions",
        currentShowEditRegions
      );
      generator.setNumberVariable(pageCountInputId, 1);
      generator.setNumberVariable(pagesAcrossInputId, 1);
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
        generator.setNumberVariable(
          "Destination Width",
          currentDestinationWidth
        );
      }
      if (currentDestinationHeight !== null) {
        generator.setNumberVariable(
          "Destination Height",
          currentDestinationHeight
        );
      }
      if (currentFaceRotation) {
        generator.setSelectInputValue("Face Rotation", currentFaceRotation);
      }
      if (currentFaceFlip) {
        generator.setSelectInputValue("Face Flip", currentFaceFlip);
      }
      setDioramaDocument(generator, makeEmptyDioramaDocument(currentPreset));
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
  instructions: null,
  images,
  textures,
  script,
};
