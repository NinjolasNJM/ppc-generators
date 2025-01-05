"use client";

import type {
  GeneratorDef,
  ImageDef,
  HistoryDef,
  TextureDef,
  ScriptDef,
  ThumbnailDef,
} from "@genroot/builder/modules/generatorDef";
import { type Generator } from "@genroot/builder/modules/generator";
import { steve, alex, Position } from "../_common/minecraftCharacter";
import { type Dimensions, Minecraft } from "../_common/minecraft";

import thumbnailImage from "./thumbnail/thumbnail-256.jpeg";
import extraImage from "./images/Extra.png";
import folds1Image from "./images/Folds-1.png";
import folds2Image from "./images/Folds-2.png";
import folds3Image from "./images/Folds-3.png";
import foreground1Image from "./images/Foreground-1.png";
import foreground2Image from "./images/Foreground-2.png";
import foreground3Image from "./images/Foreground-3.png";
import guide1Image from "./images/Guide-1.png";
import guide2Image from "./images/Guide-2.png";
import guide3Image from "./images/Guide-3.png";
import skin64x64SteveImage from "./textures/Skin64x64ReferenceSteve.png";

const id = "minecraft-modular-bendable";

const name = "Minecraft Modular Bendable Character";

const history: HistoryDef = [
];

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const images: ImageDef[] = [
  { id: "Extra", url: extraImage.src },
  { id: "Folds-1", url: folds1Image.src },
  { id: "Folds-2", url: folds2Image.src },
  { id: "Folds-3", url: folds3Image.src },
  { id: "Foreground-1", url: foreground1Image.src },
  { id: "Foreground-2", url: foreground2Image.src },
  { id: "Foreground-3", url: foreground3Image.src },
  { id: "Guide-1", url: guide1Image.src },
  { id: "Guide-2", url: guide2Image.src },
  { id: "Guide-3", url: guide3Image.src },
];

const textures: TextureDef[] = [
  {
    id: "Skin",
    url: skin64x64SteveImage.src,
    standardWidth: 64,
    standardHeight: 64,
  },
];

const script: ScriptDef = (generator: Generator) => {
  const minecraftGenerator = new Minecraft(generator);
  // Define user inputs

  generator.defineTextureInput("Skin", {
    standardWidth: 64,
    standardHeight: 64,
    choices: [],
    enableMinecraftSkinInput: true,
  });

  // Define user variables

  generator.defineSelectInput("Skin Model Type", ["Steve", "Alex"]);
  generator.defineBooleanInput("Show Folds", true);
  /* generator.defineBooleanInput("Show Labels", true); */

  // Get user variable values

  const isAlexModel = generator.getSelectInputValue("Skin Model Type") === "Alex";
  const showHeadOverlay = true;
  const showBodyOverlay = true;
  //const showLeftArmOverlay = true;
  const showRightArmOverlay = true;
  const showLeftLegOverlay = true;
  const showRightLegOverlay = true;

  const showFolds = generator.getBooleanInputValue("Show Folds");
  /*const showColorCodes = generator.getBooleanInputValue("Show Color Codes");
  const showLabels = generator.getBooleanInputValue("Show Labels");*/

  // Define regions

  /* generator.defineRegionInput([10, 534, 192, 256], () => {
    generator.setBooleanInputValue("Hide Helmet", !hideHelmet);
  });
  generator.defineRegionInput([35, 50, 192, 328], () => {
    generator.setBooleanInputValue("Hide Jacket", !hideJacket);
  });
  generator.defineRegionInput([265, 50, 128, 320], () => {
    generator.setBooleanInputValue("Hide Left Sleeve", !hideLeftSleeve);
  });
  generator.defineRegionInput([425, 426, 128, 320], () => {
    generator.setBooleanInputValue("Hide Right Sleeve", !hideRightSleeve);
  });
  generator.defineRegionInput([425, 10, 128, 360], () => {
    generator.setBooleanInputValue("Hide Left Pant", !hideLeftPant);
  });
  generator.defineRegionInput([265, 386, 128, 360], () => {
    generator.setBooleanInputValue("Hide Right Pant", !hideRightPant);
  }); */

  const char = isAlexModel ? alex : steve;

  function drawHead([ox, oy]: Position) {
    const scale: Dimensions = [64, 64, 64];
    minecraftGenerator.drawCuboid("Skin", char.base.head, [ox, oy], scale, { orientation: "South" });
    if (showHeadOverlay) {
      minecraftGenerator.drawCuboid("Skin", char.overlay.head, [ox, oy], scale, {orientation: "South"});
    }
  }
  
  function drawBody([ox, oy]: Position) {
    const scale: Dimensions = [64, 96, 32];
    minecraftGenerator.drawCuboid("Skin", char.base.body, [ox, oy], scale);
    if (showBodyOverlay) {
      minecraftGenerator.drawCuboid("Skin", char.overlay.body, [ox, oy], scale);
    }
  }
  
  /*function drawBody2([ox, oy]: Position) {
    const scale: Dimensions = [64, 96, 32];
    minecraftGenerator.drawCuboid("Skin", char.base.body, [ox, oy], scale, { center: "Bottom" });
    if (showBodyOverlay) {
      minecraftGenerator.drawCuboid("Skin", char.overlay.body, [ox, oy], scale);
    }
  }*/
  
  function drawRightArm([ox, oy]: Position) {
    const scale: Dimensions = char === alex ? [24, 96, 32] : [32, 96, 32];
    minecraftGenerator.drawCuboid("Skin", char.base.rightArm, [ox, oy], scale);
    if (showRightArmOverlay) {
      minecraftGenerator.drawCuboid("Skin", char.overlay.rightArm, [ox, oy], scale);
    }
  }
  
  /*function drawLeftArm([ox, oy]: Position) {
    const scale: Dimensions = char === alex ? [24, 96, 32] : [32, 96, 32];
    minecraftGenerator.drawCuboid("Skin", char.base.leftArm, [ox, oy], scale, { orientation: "East" });
    if (showLeftArmOverlay) {
      minecraftGenerator.drawCuboid("Skin", char.overlay.leftArm, [ox, oy], scale, { orientation: "East" });
    }
  }*/
  
  function drawRightLeg([ox, oy]: Position) {
    const scale: Dimensions = [32, 96, 32];
    minecraftGenerator.drawCuboid(
      "Skin",
      char.base.rightLeg,
      [ox, oy],
      scale,
      { center: "Left", orientation: "East" }
    );
    if (showRightLegOverlay) {
      minecraftGenerator.drawCuboid("Skin", char.overlay.rightLeg, [ox, oy], scale);
    }
  }
  
  function drawLeftLeg([ox, oy]: Position) {
    const scale: Dimensions = [32, 96, 32];
    minecraftGenerator.drawCuboid("Skin", char.base.leftLeg, [ox, oy], scale, { center: "Right" });
    if (showLeftLegOverlay) {
      minecraftGenerator.drawCuboid("Skin", char.overlay.leftLeg, [ox, oy], scale, { orientation: "East" });
    }
  }
  
  function drawPage1() {
    generator.usePage("Page 1");
    generator.drawImage("Guide-1", [0, 0]);
    drawHead([156, 28]); // Head
    drawBody([188, 316]); // Body
    generator.drawTexture("Skin", [16, 20, 4, 4], [116, 348, 32, 32]); // Right Square
    generator.drawTexture("Skin", [28, 20, 4, 4], [404, 324, 32, 32]); // Left Square
    generator.drawTexture("Skin", [53, 21, 2, 2], [26, 490, 18, 18]); // Right Back Circle
    generator.drawTexture("Skin", [45, 53, 2, 2], [66, 490, 18, 18]); // Left Back Circle
    generator.drawTexture("Skin", [44, 20, 4, 4], [424, 458, 32, 32]); // Right Front Circle
    generator.drawTexture("Skin", [36, 52, 4, 4], [66, 490, 32, 32]); // Left Front Circle
    if (showFolds) {
      generator.drawImage("Folds-1", [0, 0]);
    }
  }
  
  function drawPage2() {
    generator.usePage("Page 2");
    generator.drawImage("Guide-2", [0, 0]);
    drawRightLeg([36, 484]);
    drawLeftLeg([172, 484]);
    generator.drawImage("Foreground-2", [0, 0]);
    if (showFolds) {
      generator.drawImage("Folds-2", [0, 0]);
    }
  }
  
  function drawPage3() {
    generator.usePage("Page 3");
    generator.drawImage("Guide-3", [0, 0]);
    drawRightArm([28, 148]);
    if (showFolds) {
      generator.drawImage("Folds-3", [0, 0]);
    }
  }
  
  // Draw Pages
  drawPage1();
  drawPage2();
  drawPage3();



  // Labels

  /* if (showLabels) {
    generator.drawImage("Labels", [0, 0]);
  } */
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
