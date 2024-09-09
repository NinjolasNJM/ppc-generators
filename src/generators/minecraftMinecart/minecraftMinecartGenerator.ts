"use client";

import type {
  GeneratorDef,
  ImageDef,
  HistoryDef,
  TextureDef,
  ScriptDef,
  ThumbnailDef,
  InstructionsDef,
} from "@genroot/builder/modules/generatorDef";
import { type Generator } from "@genroot/builder/modules/generator";
import { minecart } from "../_common/minecraftEntities";
import thumbnailImage from "./thumbnail/thumbnail-256.jpeg";
import minecartImage from "./textures/minecart.png";

import advancedImage from "./images/Foreground-Advanced.png";
import simpleImage from "./images/Foreground-Simple.png";
import { Dimensions, Minecraft, Orientation } from "../_common/minecraft";

const id = "minecraft-minecart";

const name = "Minecraft Minecart";

const history: HistoryDef = [
  "30 Jun 2022 NinjolasNJM - first release.",
  "09 Sep 2024 NinjolasNJM - converted to TypeScript generator.",
];

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const instructions: InstructionsDef = `
To make blocks that fit in a minecart, go to the Block Generator and select the block's type to be \"Minecart Block\".
`;

const images: ImageDef[] = [
  { id: "Foreground-Advanced", url: advancedImage.src },
  { id: "Foreground-Simple", url: simpleImage.src },
];

const textures: TextureDef[] = [
  {
    id: "Minecart",
    url: minecartImage.src,
    standardWidth: 64,
    standardHeight: 32,
  },
];

const script: ScriptDef = (generator: Generator) => {
  const minecraftGenerator = new Minecraft(generator);

  // Define functions

  const ox = 249;
  const oy = 245;

  function drawFoldsAdvanced() {
    // Center Lines
    generator.drawFoldLine([ox - 1, oy - 64], [ox - 1, oy + 192]);
    generator.drawFoldLine([ox + 96, oy - 64], [ox + 96, oy + 192]);

    generator.drawFoldLine([ox - 80, oy - 1], [ox + 176, oy - 1]);
    generator.drawFoldLine([ox - 80, oy + 128], [ox + 176, oy + 128]);

    // Top Lines
    generator.drawFoldLineRect([ox - 16, oy - 160, 128, 96]);
    generator.drawFoldLine([ox - 16, oy - 80], [ox + 112, oy - 80]);

    // Right Lines
    generator.drawFoldLineRect([ox + 176, oy - 16, 80, 160]);
    generator.drawFoldLine([ox + 160, oy], [ox + 160, oy + 128]);

    // Bottom Lines
    generator.drawFoldLineRect([ox - 16, oy + 192, 128, 256]);
    generator.drawFoldLine([ox - 16, oy + 207], [ox + 112, oy + 207]);
    generator.drawFoldLine([ox - 16, oy + 288], [ox + 112, oy + 288]);

    // Left Lines
    generator.drawFoldLineRect([ox - 160, oy - 16, 80, 160]);
    generator.drawFoldLine([ox - 64, oy], [ox - 64, oy + 128]);
  }

  function drawFoldsSimple() {
    generator.drawFoldLineRect([ox - 16, oy - 16, 128, 160]);

    generator.drawFoldLineRect([ox - 16, oy - 176, 128, 640]);
    generator.drawFoldLineRect([ox - 16, oy - 96, 128, 320]);

    generator.drawFoldLineRect([ox - 176, oy - 16, 448, 160]);
    generator.drawFoldLineRect([ox - 96, oy - 16, 278, 160]);
  }

  function drawAdvanced(showFolds: boolean) {
    // Center

    generator.drawTexture(
      "Minecart",
      [26, 14, 16, 12],
      [ox - 16, oy + 16, 128, 96],
      { rotate: -90 }
    );

    // Front Side

    generator.drawTexture("Minecart", minecart.sides.front, [
      ox - 16,
      oy - 64,
      128,
      64,
    ]);
    generator.drawTexture("Minecart", minecart.sides.top, [
      ox - 16,
      oy - 80,
      128,
      16,
    ]);
    generator.drawTexture(
      "Minecart",
      minecart.sides.back,
      [ox - 16, oy - 144, 128, 64],
      { rotate: 180 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.bottom.right,
      [ox + 40, oy - 216, 16, 128],
      { rotate: -90 }
    );

    // Right Side

    generator.drawTexture(
      "Minecart",
      minecart.sides.front,
      [ox + 64, oy + 32, 128, 64],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.top,
      [ox + 104, oy + 56, 128, 16],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.back,
      [ox + 144, oy + 32, 128, 64],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.left,
      [ox + 200, oy - 40, 16, 64],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.right,
      [ox + 200, oy + 104, 16, 64],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.bottom.bottom,
      [ox + 168, oy + 56, 160, 16],
      { flip: "Vertical", rotate: 90 }
    );

    // Back Side

    generator.drawTexture(
      "Minecart",
      minecart.sides.front,
      [ox - 16, oy + 128, 128, 64],
      { rotate: 180 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.top,
      [ox - 16, oy + 192, 128, 16],
      { rotate: 180 }
    );
    generator.drawTexture("Minecart", minecart.sides.back, [
      ox - 16,
      oy + 208,
      128,
      64,
    ]);
    generator.drawTexture(
      "Minecart",
      minecart.bottom.left,
      [ox + 40, oy + 216, 16, 128],
      { rotate: -90 }
    );

    // Left Side

    generator.drawTexture(
      "Minecart",
      minecart.sides.front,
      [ox - 96, oy + 32, 128, 64],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.top,
      [ox - 136, oy + 56, 128, 16],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.back,
      [ox - 176, oy + 32, 128, 64],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.left,
      [ox - 120, oy + 104, 16, 64],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.right,
      [ox - 120, oy - 40, 16, 64],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.bottom.top,
      [ox - 232, oy + 56, 160, 16],
      { rotate: 90 }
    );

    // Bottom
    generator.drawTexture(
      "Minecart",
      minecart.bottom.front,
      [ox - 32, oy + 304, 160, 128],
      { rotate: -90 }
    );

    // Draw the Foreground image
    generator.drawImage("Foreground-Advanced", [0, 0]);

    // Folds
    if (showFolds) {
      drawFoldsAdvanced();
    }
  }

  function drawSimple(showFolds: boolean) {
    // Center
    generator.drawTexture(
      "Minecart",
      minecart.bottom.back,
      [ox - 32, oy, 160, 128],
      { rotate: -90 }
    );

    // Front Side

    generator.drawTexture("Minecart", minecart.sides.front, [
      ox - 16,
      oy - 96,
      128,
      80,
    ]);
    generator.drawTexture(
      "Minecart",
      minecart.sides.back,
      [ox - 16, oy - 160, 128, 64],
      { rotate: 180 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.bottom.right,
      [ox + 40, oy - 232, 16, 128],
      { rotate: -90 }
    );

    // Right Side

    generator.drawTexture(
      "Minecart",
      minecart.sides.front,
      [ox + 72, oy + 24, 160, 80],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.back,
      [ox + 160, oy + 32, 128, 64],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.left,
      [ox + 216, oy - 40, 16, 64],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.right,
      [ox + 216, oy + 104, 16, 64],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.bottom.bottom,
      [ox + 184, oy + 56, 160, 16],
      { flip: "Vertical", rotate: 90 }
    );

    // Back Side

    generator.drawTexture(
      "Minecart",
      minecart.sides.front,
      [ox - 16, oy + 144, 128, 80],
      { rotate: 180 }
    );
    generator.drawTexture("Minecart", minecart.sides.back, [
      ox - 16,
      oy + 224,
      128,
      64,
    ]);
    generator.drawTexture(
      "Minecart",
      minecart.bottom.left,
      [ox + 40, oy + 232, 16, 128],
      { rotate: -90 }
    );

    // Left Side

    generator.drawTexture(
      "Minecart",
      minecart.sides.front,
      [ox - 136, oy + 24, 160, 80],
      { rotate: -90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.back,
      [ox - 192, oy + 32, 128, 64],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.left,
      [ox - 136, oy + 104, 16, 64],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.sides.right,
      [ox - 136, oy - 40, 16, 64],
      { rotate: 90 }
    );
    generator.drawTexture(
      "Minecart",
      minecart.bottom.top,
      [ox - 248, oy + 56, 160, 16],
      { rotate: 90 }
    );

    // Bottom
    generator.drawTexture(
      "Minecart",
      minecart.bottom.front,
      [ox - 32, oy + 320, 160, 128],
      { rotate: -90 }
    );

    // Draw the Foreground image
    generator.drawImage("Foreground-Simple", [0, 0]);

    //Folds
    if (showFolds) {
      drawFoldsSimple();
    }
  }

  // Define user inputs

  generator.defineTextureInput("Minecart", {
    standardWidth: 64,
    standardHeight: 32,
    choices: [],
  });

  // Define and get user variables

  const modelType = generator.defineAndGetSelectInput("Model Type", [
    "Advanced",
    "Simple",
  ]);
  const showFolds = generator.defineAndGetBooleanInput("Show Folds", true);

  // Draw Minecart

  switch (modelType) {
    case "Advanced":
      drawAdvanced(showFolds);
      break;
    case "Simple":
      drawSimple(showFolds);
      break;
    default:
      drawAdvanced(showFolds);
      break;
  }
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
