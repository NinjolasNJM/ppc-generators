"use client";

import type {
  GeneratorDef,
  ImageDef,
  HistoryDef,
  ScriptDef,
  ThumbnailDef,
  TextureDef,
} from "@genroot/builder/modules/generatorDef";
import { type Generator } from "@genroot/builder/modules/generator";


import thumbnailImage from "./thumbnail/v2-thumbnail-256.jpeg";

import backgroundImage from "./images/Background.png";
import backgroundBrokenImage from "./images/Background-Broken.png";
import cobblestoneImage from "./textures/Cobblestone.png";

const id = "minecraft-cobblestone";

const name = "Minecraft Cobblestone";

const history: HistoryDef = [
  "01 Apr 2025 NinjolasNJM - April Fools!!!!!",
];

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const images: ImageDef[] = [
  { id: "Background", url: backgroundImage.src },
  { id: "Background Broken", url: backgroundBrokenImage.src },
];

const textures: TextureDef[] = [
  {
    id: "Cobblestone",
    url: cobblestoneImage.src,
    standardWidth: 128,
    standardHeight: 128,
  },

];

const script: ScriptDef = (generator: Generator) => {

  

  // Background

  generator.drawImage("Background", [0, 0]);

  const [ox, oy] = [42 + 128, 41 + 128];
  
  // Clamp helper
  function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
  
  // Read the current cobblestone amount from select input (default to 1)
  function getAmount(): number {
    const raw = generator.getSelectInputValue("Cobblestone Amount");
    const parsed = raw ? parseInt(raw) : 1;
    return clamp(isNaN(parsed) ? 1 : parsed, 1, 12);
  }
  
  // Update the cobblestone amount and booleans
  function changeAmount(delta: number): void {
    const newAmount = clamp(getAmount() + delta, 1, 12);
    generator.setSelectInputValue("Cobblestone Amount", newAmount.toString());
  
    for (let i = 0; i < 12; i++) {
      const isActive = i < newAmount;
      generator.setBooleanInputValue("Cobblestone " + i, isActive);
    }
  
    console.log("Cobblestone amount is now:", newAmount);
  }
  
  // Initialize booleans on startup (optional if you're setting from a reset state)
  for (let i = 0; i < 12; i++) {
    const isActive = i < getAmount();
    generator.setBooleanInputValue("Cobblestone " + i, isActive);
  }
  
  // "+" region
  generator.defineRegionInput([ox, oy - 128, 128, 128], () => {
    changeAmount(1);
  });
  
  // "refresh" or "print current amount" region (optional debug)
  generator.defineRegionInput([ox - 128, oy, 128, 128], () => {
    changeAmount(0); // Just reapply current value to boolean flags
  });
  
  // Cobblestone draw and "-" interaction
  for (let i = 0; i < 12; i++) {
    const y = oy + i * 128;
    const isActive = generator.getBooleanInputValue("Cobblestone " + i) ?? false;
    const scale = isActive ? 1 : 0;
  
    generator.defineRegionInput([ox, y, 128, 128], () => {
      changeAmount(-1);
    });
  
    generator.drawTexture("Cobblestone", [0, 0, 128, 128], [ox, y, 128 * scale, 128 * scale]);
  }
  
  // Draw current amount as text
  generator.defineText(getAmount().toString());
}  

export const generator: GeneratorDef = {
  id,
  name,
  thumbnail,
  video: null,
  instructions: null,
  history,
  images,
  textures,
  script,
};
