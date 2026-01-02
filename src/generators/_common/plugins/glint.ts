import { makeCanvasWithContext } from "@genroot/builder/modules/canvasWithContext";
import { TexturePlugin } from "@genroot/builder/modules/generator";
import { Texture } from "@genroot/builder/modules/texture";

export type GlintPluginOptions = {
  opacity: number;
  xOffset: number;
  yOffset: number;
};

export const makeGlintPlugin: (
  texture: Texture,
  options: GlintPluginOptions
) => TexturePlugin = (glintTexture, glintOptions) => (coordinates, context) => {
  const { sx, sy, sw, sh, dw, dh } = coordinates;
  const { opacity, xOffset, yOffset } = glintOptions;

  // Create base-only canvas for masking
  const baseOnly = makeCanvasWithContext(dw, dh);
  baseOnly.context.drawImage(context.canvas, 0, 0);

  // Create glint layer
  const glintLayer = makeCanvasWithContext(dw, dh);

  // Step 1: Draw base to glint layer
  glintLayer.context.drawImage(context.canvas, 0, 0);

  // Step 2: Add the glint with transformations
  glintLayer.context.save();
  glintLayer.context.globalAlpha = opacity;
  glintLayer.context.globalCompositeOperation = "lighter";

  // Apply wrapped offsets to the glint texture
  const sourceX = (sx + xOffset) % glintTexture.standardWidth;
  const sourceY = (sy + yOffset) % glintTexture.standardHeight;

  // Wrap around if offsets push outside bounds
  const wrappedX =
    (sourceX + glintTexture.standardWidth) % glintTexture.standardWidth;
  const wrappedY =
    (sourceY + glintTexture.standardHeight) % glintTexture.standardHeight;

  glintLayer.context.drawImage(
    glintTexture.imageWithCanvas.canvasWithContext.canvas,
    wrappedX,
    wrappedY,
    sw,
    sh,
    0,
    0,
    dw,
    dh
  );

  glintLayer.context.restore();

  // Step 3: Mask to original alpha
  glintLayer.context.globalCompositeOperation = "destination-in";
  glintLayer.context.drawImage(baseOnly.canvas, 0, 0);

  // Step 4: Return the final canvas
  return glintLayer.canvas;
};