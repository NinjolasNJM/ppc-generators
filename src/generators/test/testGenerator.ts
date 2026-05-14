"use client";

import type {
  GeneratorDef,
  InstructionsDef,
  ImageDef,
  HistoryDef,
  TextureDef,
  ScriptDef,
} from "@genroot/builder/modules/generatorDef";
import { type Generator } from "@genroot/builder/modules/generator";

import backgroundImage from "./images/Background.png";
import foldsImage from "./images/Folds.png";

const id = "multi-texture-test";

const name = "Multi Texture Test";

const instructions: InstructionsDef = `
A test generator for the new multi-texture input. Upload multiple images and watch them render from the generated atlas.
`;

const history: HistoryDef = [];

const images: ImageDef[] = [
  { id: "Background", url: backgroundImage.src },
  { id: "Folds", url: foldsImage.src },
];

const textures: TextureDef[] = [];

type MultiTextureTile = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type MultiTextureMetadata = {
  atlasWidth: number;
  atlasHeight: number;
  tiles: MultiTextureTile[];
};

const script: ScriptDef = (generator: Generator) => {
  generator.defineMultiTextureInput("Textures", {
    standardWidth: 16,
    standardHeight: 16,
    choices: [],
  });

  const textureMetadataJson = generator.getStringInputValue("Textures_metadata");
  const textureMetadata: MultiTextureMetadata | null = textureMetadataJson
    ? JSON.parse(textureMetadataJson)
    : null;

  console.log("MultiTexture metadata", textureMetadata);

  generator.defineBooleanInput("Show Folds", true);

  const showFolds = generator.getBooleanInputValue("Show Folds");

  generator.drawImage("Background", [0, 0]);

  if (generator.hasTexture("Textures") && textureMetadata) {
    let drawY = 100;
    textureMetadata.tiles.forEach((tile) => {
      const destWidth = tile.width * 2;
      const destHeight = tile.height * 2;
      generator.drawTexture(
        "Textures",
        [tile.x, tile.y, tile.width, tile.height],
        [20, drawY, destWidth, destHeight]
      );
      console.log("Drawing tile", tile.name, tile.x, tile.y, tile.width, tile.height);
      drawY += destHeight + 10;
    });
  }

  if (showFolds) {
    generator.drawImage("Folds", [0, 0]);
  }
};

export const generator: GeneratorDef = {
  id,
  name,
  thumbnail: null,
  video: null,
  instructions,
  history,
  images,
  textures,
  script,
};
