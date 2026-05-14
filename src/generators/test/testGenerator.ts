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
import type { Atlas } from "@genroot/builder/modules/textureData";

import backgroundImage from "./images/Background.png";
import foldsImage from "./images/Folds.png";

const id = "multi-texture-test";

const name = "Multi Texture Test";

const instructions: InstructionsDef = `
A test generator for the new multi-texture input. Upload multiple images and watch them render from the generated atlas.

The multi texture input saves two values:
- a texture under the input ID, which contains the packed atlas image
- a string under "${id} Frames", which contains an Atlas object

The Atlas describes atlas dimensions and a list of tile frames. Each tile is a TextureFrame,
so the rectangle value can be passed directly to generator.drawTexture.
`;

const history: HistoryDef = [];

const images: ImageDef[] = [
  { id: "Background", url: backgroundImage.src },
  { id: "Folds", url: foldsImage.src },
];

const textures: TextureDef[] = [];

const script: ScriptDef = (generator: Generator) => {
  generator.defineAtlasInput("Textures", {
    standardWidth: 16,
    standardHeight: 16,
    choices: [],
  });

  const atlasJson = generator.getStringInputValue("Textures Frames");
  const atlas: Atlas | null = atlasJson ? JSON.parse(atlasJson) : null;

  generator.defineBooleanInput("Show Folds", true);

  const showFolds = generator.getBooleanInputValue("Show Folds");

  generator.drawImage("Background", [0, 0]);

  if (generator.hasTexture("Textures") && atlas) {
    let drawY = 100;
    atlas.frames.forEach((tile) => {
      const [srcX, srcY, width, height] = tile.rectangle;
      generator.drawTexture(
        "Textures",
        [srcX, srcY, width, height],
        [20, drawY, width * 2, height * 2]
      );
      drawY += height * 2 + 10;
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
