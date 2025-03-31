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


import thumbnailImage from "./thumbnail/Cobblestone_thumbnail.png";

import backgroundImage from "./images/Background.png";
import backgroundBrokenImage from "./images/Background-Broken.png";
import backgroundBlankImage from "./images/Background-Blank.png";
import cobblestoneImage from "./textures/Cobblestone.png";

const id = "minecraft-cobblestone";

const name = "Cobblestone Generator";

const history: HistoryDef = [
  "01 Apr 2025 NinjolasNJM - April Fools!!!!!",
];

const thumbnail: ThumbnailDef = {
  url: thumbnailImage.src,
};

const images: ImageDef[] = [
  { id: "Background", url: backgroundImage.src },
  { id: "Background Broken", url: backgroundBrokenImage.src },
  { id: "Background Blank", url: backgroundBlankImage.src },

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

  const [ox, oyBase] = [42 + 128, 41 + 128];

  // Clamp helper
  function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
  
  function getAmount(): number {
    const raw = generator.getSelectInputValue("Cobblestone Amount");
    const parsed = raw ? parseInt(raw) : 1;
    return clamp(isNaN(parsed) ? 1 : parsed, 0, 12);
  }
  
  function changeAmount(delta: number): void {
    const current = getAmount();
    if (current === 0) return;
  
    const newAmount = clamp(current + delta, 0, 12);
    generator.setSelectInputValue("Cobblestone Amount", newAmount.toString());
  
    for (let i = 0; i < 12; i++) {
      const isActive = i < newAmount;
      generator.setBooleanInputValue("Cobblestone " + i, isActive);
    }
  
    generator.setBooleanInputValue("Broken", newAmount === 0);
    console.log("Cobblestone amount is now:", newAmount);
  }
  
  // Determine if broken and use correct background
  const isBroken = generator.getBooleanInputValue("Broken") ?? false;
  
  // Determine how many pages are needed
  const amount = getAmount();
  const firstPageItems = 5;
  const laterPageItems = 6;
  const remaining = Math.max(0, amount - firstPageItems);
  const pageCount = 1 + Math.ceil(remaining / laterPageItems);
  
  let rendered = 0;
  
  for (let page = 0; page < pageCount; page++) {
    const pageId = `Page ${page + 1}`;
    generator.usePage(pageId);
  
    const isFirstPage = page === 0;
    const itemsThisPage = isFirstPage ? firstPageItems : laterPageItems;
    const backgroundTexture = isFirstPage
      ? (isBroken ? "Background Broken" : "Background")
      : "Background Blank";
    const oy = isFirstPage ? oyBase : oyBase - 128;
  
    generator.drawImage(backgroundTexture, [0, 0]);
  
    for (let i = 0; i < itemsThisPage; i++) {
      const globalIndex = rendered;
      if (globalIndex >= amount) break;
  
      const y = oy + i * 128;
      const isActive = globalIndex < amount;
      const scale = isActive ? 1 : 0;
  
      generator.drawTexture("Cobblestone", [0, 0, 128, 128], [ox, y, 128 * scale, 128 * scale]);
  
      if (isActive) {
        generator.defineRegionInput([ox, y, 128, 128], () => {
          changeAmount(-1);
        });
      }
  
      rendered++;
    }
  }
  
  // Add the + button on the first page
  generator.usePage("Page 1");
  generator.defineRegionInput([ox, oyBase - 128, 128, 128], () => {
    changeAmount(1);
  });
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
