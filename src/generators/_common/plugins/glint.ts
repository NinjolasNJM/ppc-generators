import { makeCanvasWithContext } from "@genroot/builder/modules/canvasWithContext";
import {
  type Generator,
  type TexturePlugin,
} from "@genroot/builder/modules/generator";
import { type Texture } from "@genroot/builder/modules/texture";
import { type TextureDef } from "@genroot/builder/modules/generatorDef";
import enchantedGlintEntity from "../textures/enchanted_glint_entity.png";
import enchantedGlintItem from "../textures/enchanted_glint_item.png";
import enchantedGlintOld from "../textures/enchanted_item_glint.png";

export type GlintPluginOptions = {
  opacity: number;
  xOffset: number;
  yOffset: number;
};

const GLINT_TEXTURE_STANDARD_SIZE = 128;

export const entityGlintTextureDefs: TextureDef[] = [
  {
    id: "Enchanted Glint",
    url: enchantedGlintEntity.src,
    standardWidth: GLINT_TEXTURE_STANDARD_SIZE,
    standardHeight: GLINT_TEXTURE_STANDARD_SIZE,
  },
  {
    id: "1.20+",
    url: enchantedGlintEntity.src,
    standardWidth: GLINT_TEXTURE_STANDARD_SIZE,
    standardHeight: GLINT_TEXTURE_STANDARD_SIZE,
  },
  {
    id: "Pre-1.20",
    url: enchantedGlintOld.src,
    standardWidth: GLINT_TEXTURE_STANDARD_SIZE,
    standardHeight: GLINT_TEXTURE_STANDARD_SIZE,
  },
];

export const itemGlintTextureDefs: TextureDef[] = [
  {
    id: "Enchanted Glint",
    url: enchantedGlintItem.src,
    standardWidth: GLINT_TEXTURE_STANDARD_SIZE,
    standardHeight: GLINT_TEXTURE_STANDARD_SIZE,
  },
  {
    id: "1.20+",
    url: enchantedGlintItem.src,
    standardWidth: GLINT_TEXTURE_STANDARD_SIZE,
    standardHeight: GLINT_TEXTURE_STANDARD_SIZE,
  },
  {
    id: "Pre-1.20",
    url: enchantedGlintOld.src,
    standardWidth: GLINT_TEXTURE_STANDARD_SIZE,
    standardHeight: GLINT_TEXTURE_STANDARD_SIZE,
  },
];

export type GlintControls = {
  getPlugin: (enabled: boolean) => TexturePlugin | undefined;
};

export function defineGlintControlInputs(generator: Generator): void {
  generator.defineTextureInput("Enchanted Glint", {
    standardWidth: GLINT_TEXTURE_STANDARD_SIZE,
    standardHeight: GLINT_TEXTURE_STANDARD_SIZE,
    choices: ["1.20+", "Pre-1.20"],
  });

  generator.defineInputRowStart();

  generator.defineAndGetRangeInput("Glint Opacity", {
    min: 0,
    max: 255,
    value: 255,
    step: 1,
  });
  generator.defineAndGetRangeInput("Glint X Offset", {
    min: 0,
    max: GLINT_TEXTURE_STANDARD_SIZE,
    value: 0,
    step: 1,
  });
  generator.defineAndGetRangeInput("Glint Y Offset", {
    min: 0,
    max: GLINT_TEXTURE_STANDARD_SIZE,
    value: 0,
    step: 1,
  });

  generator.defineInputRowEnd();
}

export function getGlintControls(generator: Generator): GlintControls {
  const opacity = generator.getNumberVariable("Glint Opacity") ?? 255;
  const xOffset = generator.getNumberVariable("Glint X Offset") ?? 0;
  const yOffset = generator.getNumberVariable("Glint Y Offset") ?? 0;
  const glintTexture = generator.getTexture("Enchanted Glint");
  const glintPluginOptions: GlintPluginOptions = {
    opacity: opacity / 255,
    xOffset,
    yOffset,
  };

  return {
    getPlugin: (enabled) =>
      glintTexture && enabled
        ? makeGlintPlugin(glintTexture, glintPluginOptions)
        : undefined,
  };
}

export function defineGlintControls(generator: Generator): GlintControls {
  defineGlintControlInputs(generator);
  return getGlintControls(generator);
}

export const makeGlintPlugin: (
  texture: Texture,
  options: GlintPluginOptions
) => TexturePlugin = (glintTexture, glintOptions) => (coordinates, context) => {
  const { sx, sy, sw, sh } = coordinates;
  const { opacity, xOffset, yOffset } = glintOptions;
  const glintWidth = glintTexture.standardWidth;
  const glintHeight = glintTexture.standardHeight;
  const outputWidth = context.canvas.width;
  const outputHeight = context.canvas.height;
  const glintCanvas = glintTexture.imageWithCanvas.canvasWithContext.canvas;
  const glintScaleX = glintCanvas.width / glintWidth;
  const glintScaleY = glintCanvas.height / glintHeight;

  if (outputWidth <= 0 || outputHeight <= 0 || sw <= 0 || sh <= 0) {
    return context.canvas;
  }

  const glintLayer = makeCanvasWithContext(outputWidth, outputHeight);
  glintLayer.context.save();
  glintLayer.context.globalAlpha = opacity;

  for (let y = 0; y < sh; ) {
    const tileY = wrap(sy + yOffset + y, glintHeight);
    const tileHeight = Math.min(glintHeight - tileY, sh - y);

    for (let x = 0; x < sw; ) {
      const tileX = wrap(sx + xOffset + x, glintWidth);
      const tileWidth = Math.min(glintWidth - tileX, sw - x);

      glintLayer.context.drawImage(
        glintCanvas,
        tileX * glintScaleX,
        tileY * glintScaleY,
        tileWidth * glintScaleX,
        tileHeight * glintScaleY,
        (x / sw) * outputWidth,
        (y / sh) * outputHeight,
        (tileWidth / sw) * outputWidth,
        (tileHeight / sh) * outputHeight
      );

      x += tileWidth;
    }

    y += tileHeight;
  }

  glintLayer.context.restore();

  const output = makeCanvasWithContext(outputWidth, outputHeight);
  const outputImageData = context.contextWithAlpha.getImageData(
    0,
    0,
    outputWidth,
    outputHeight
  );
  const outputPixels = outputImageData.data;
  const glintImageData = glintLayer.contextWithAlpha.getImageData(
    0,
    0,
    outputWidth,
    outputHeight
  );
  const glintPixels = glintImageData.data;

  for (let y = 0; y < outputHeight; y += 1) {
    for (let x = 0; x < outputWidth; x += 1) {
      const outputIndex = (y * outputWidth + x) * 4;
      const baseAlpha = outputPixels[outputIndex + 3] ?? 0;
      if (baseAlpha <= 0) {
        continue;
      }

      const glintIndex = outputIndex;
      const glintAlpha = (glintPixels[glintIndex + 3] ?? 0) / 255;
      if (glintAlpha <= 0) {
        continue;
      }

      outputPixels[outputIndex + 0] = clamp(
        (outputPixels[outputIndex + 0] ?? 0) +
          (glintPixels[glintIndex + 0] ?? 0) * glintAlpha
      );
      outputPixels[outputIndex + 1] = clamp(
        (outputPixels[outputIndex + 1] ?? 0) +
          (glintPixels[glintIndex + 1] ?? 0) * glintAlpha
      );
      outputPixels[outputIndex + 2] = clamp(
        (outputPixels[outputIndex + 2] ?? 0) +
          (glintPixels[glintIndex + 2] ?? 0) * glintAlpha
      );
      outputPixels[outputIndex + 3] = baseAlpha;
    }
  }

  output.context.putImageData(outputImageData, 0, 0);
  return output.canvas;
};

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}
