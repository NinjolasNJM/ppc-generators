import {
  type CanvasWithContext,
  type Color,
  makeCanvasWithContext,
} from "../canvasWithContext";
import type { Texture } from "../texture";
import type { Dimensions, Region } from "./types";

export type Flip = "None" | "Horizontal" | "Vertical";

type RotateNone = { kind: "None" };

type RotateCorner = { kind: "Corner"; degrees: number };

type RotateCenter = { kind: "Center"; degrees: number };

export type Rotate = RotateNone | RotateCorner | RotateCenter;

type BlendNone = { kind: "None" };

type BlendMultiplyHex = { kind: "MultiplyHex"; hex: string };

type BlendMultiplyColor = { kind: "MultiplyColor"; color: Color };

type BlendReplaceColor = {
  kind: "ReplaceColor";
  color1: Color[];
  color2: Color[];
};

type BlendReplaceHex = {
  kind: "ReplaceHex";
  hex1: string[];
  hex2: string[];
};

export type Blend =
  | BlendNone
  | BlendMultiplyHex
  | BlendMultiplyColor
  | BlendReplaceColor
  | BlendReplaceHex;

export type Coordinates = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

export type TexturePlugin = (
  coordinates: Coordinates,
  canvasWithContext: CanvasWithContext
) => HTMLCanvasElement;

type TransformMatrix = [number, number, number, number, number, number];

function multiplyMatrix(
  first: TransformMatrix,
  second: TransformMatrix
): TransformMatrix {
  return [
    first[0] * second[0] + first[2] * second[1],
    first[1] * second[0] + first[3] * second[1],
    first[0] * second[2] + first[2] * second[3],
    first[1] * second[2] + first[3] * second[3],
    first[0] * second[4] + first[2] * second[5] + first[4],
    first[1] * second[4] + first[3] * second[5] + first[5],
  ];
}

function translateMatrix(
  matrix: TransformMatrix,
  x: number,
  y: number
): TransformMatrix {
  return multiplyMatrix(matrix, [1, 0, 0, 1, x, y]);
}

function rotateMatrix(
  matrix: TransformMatrix,
  degrees: number
): TransformMatrix {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return multiplyMatrix(matrix, [cos, sin, -sin, cos, 0, 0]);
}

function scaleMatrix(
  matrix: TransformMatrix,
  x: number,
  y: number
): TransformMatrix {
  return multiplyMatrix(matrix, [x, 0, 0, y, 0, 0]);
}

function fit(sw: number, sh: number, dw: number, dh: number): Dimensions {
  const wScale = sw / dw;
  const hScale = sh / dh;
  const scale = Math.min(wScale, hScale);
  const [w, h] = scale < 1 ? [dw * scale, dh * scale] : [dw, dh];
  return [Math.ceil(w), Math.ceil(h)];
}

function preparePixelationCanvas(
  source: CanvasWithContext,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number
): CanvasWithContext {
  const [sw2, sh2] = fit(sw, sh, dw, dh);
  const canvasWithContext = makeCanvasWithContext(sw2, sh2);
  canvasWithContext.context.imageSmoothingEnabled = false;
  canvasWithContext.context.drawImage(
    source.canvas,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    sw2,
    sh2
  );
  return canvasWithContext;
}

function parseHex(value: string): number | null {
  const hex = value.startsWith("#") ? value.slice(1) : value;
  if (hex.length === 6) {
    const f = parseInt(hex, 16);
    if (isNaN(f)) {
      return null;
    }
    return Math.floor(f);
  }
  return null;
}

function shift(value: number, shift: number): number {
  return (value >> shift) & 255;
}

export function hexToRGB(hex: string): [number, number, number] | null {
  const value = parseHex(hex);
  if (value === null) {
    return null;
  }
  const r = shift(value, 16);
  const g = shift(value, 8);
  const b = shift(value, 0);
  return [r, g, b];
}

export function hexToColor(hex: string): Color | null {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  if (!(clean.length === 6 || clean.length === 8)) return null;
  const value = parseInt(clean, 16);
  if (isNaN(value)) return null;

  const r = shift(value, clean.length === 6 ? 16 : 24);
  const g = shift(value, clean.length === 6 ? 8 : 16);
  const b = shift(value, clean.length === 6 ? 0 : 8);
  const a = clean.length === 8 ? shift(value, 0) : 255;

  return { r, g, b, a };
}

function multiplyColorsByDye(base: Color, dye: Color): Color {
  // Previous renderer behavior:
  // return {
  //   r: Math.floor((base.r * dye.r) / 255),
  //   g: Math.floor((base.g * dye.g) / 255),
  //   b: Math.floor((base.b * dye.b) / 255),
  //   a: Math.floor((base.a * dye.a) / 255),
  // };
  return {
    r: (base.r / 255) * dye.r,
    g: (base.g / 255) * dye.g,
    b: (base.b / 255) * dye.b,
    a: base.a,
  };
}

function sourceOverMinecraft(source: Color, destination: Color): Color {
  const sourceAlpha = source.a / 255;
  const destinationAlpha = destination.a / 255;

  return {
    r: source.r * sourceAlpha + destination.r * (1 - sourceAlpha),
    g: source.g * sourceAlpha + destination.g * (1 - sourceAlpha),
    b: source.b * sourceAlpha + destination.b * (1 - sourceAlpha),
    a: 255 * (sourceAlpha + destinationAlpha * (1 - sourceAlpha)),
  };
}

function writeColor(
  data: Uint8ClampedArray,
  index: number,
  color: Color
): void {
  data[index + 0] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}

function makeDrawMatrix(
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  rotate: Rotate,
  flip: Flip
): TransformMatrix {
  let matrix: TransformMatrix = [1, 0, 0, 1, 0, 0];
  matrix = translateMatrix(matrix, dx, dy);

  if (rotate.kind === "Corner") {
    matrix = rotateMatrix(matrix, rotate.degrees);
  } else if (rotate.kind === "Center") {
    matrix = translateMatrix(matrix, dw / 2, dh / 2);
    matrix = rotateMatrix(matrix, rotate.degrees);
    matrix = translateMatrix(matrix, -dw / 2, -dh / 2);
  }

  if (flip === "Horizontal") {
    matrix = translateMatrix(matrix, dw, 0);
    matrix = scaleMatrix(matrix, -1, 1);
  } else if (flip === "Vertical") {
    matrix = translateMatrix(matrix, 0, dh);
    matrix = scaleMatrix(matrix, 1, -1);
  }

  return matrix;
}

function transformedPixel(
  matrix: TransformMatrix,
  x: number,
  y: number
): [number, number] {
  const centerX = x + 0.5;
  const centerY = y + 0.5;
  const transformedX = matrix[0] * centerX + matrix[2] * centerY + matrix[4];
  const transformedY = matrix[1] * centerX + matrix[3] * centerY + matrix[5];
  return [Math.round(transformedX - 0.5), Math.round(transformedY - 0.5)];
}

function compositeMultiplyDirect({
  page,
  sourcePixels,
  sw,
  sh,
  dw,
  dh,
  blendColor,
  rotate,
  flip,
  dx,
  dy,
}: {
  page: CanvasWithContext;
  sourcePixels: Uint8ClampedArray;
  sw: number;
  sh: number;
  dw: number;
  dh: number;
  blendColor: Color;
  rotate: Rotate;
  flip: Flip;
  dx: number;
  dy: number;
}): void {
  const pageImageData = page.contextWithAlpha.getImageData(
    0,
    0,
    page.width,
    page.height
  );
  const pagePixels = pageImageData.data;
  const matrix = makeDrawMatrix(dx, dy, dw, dh, rotate, flip);

  const deltax = dw / sw;
  const deltay = dh / sh;
  const pixwInitial = Math.floor(deltax);
  const pixhInitial = Math.floor(deltay);
  const pixw = pixwInitial < deltax ? pixwInitial + 1 : pixwInitial;
  const pixh = pixhInitial < deltay ? pixhInitial + 1 : pixhInitial;

  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const sourceIndex = (y * sw + x) * 4;
      const sourceAlpha = sourcePixels[sourceIndex + 3] ?? 255;
      if (sourceAlpha <= 0) {
        continue;
      }

      const source = multiplyColorsByDye(
        {
          r: sourcePixels[sourceIndex + 0] ?? 0,
          g: sourcePixels[sourceIndex + 1] ?? 0,
          b: sourcePixels[sourceIndex + 2] ?? 0,
          a: sourceAlpha,
        },
        blendColor
      );
      const tx = Math.floor(x * deltax);
      const ty = Math.floor(y * deltay);

      for (let row = 0; row < pixh; row += 1) {
        for (let col = 0; col < pixw; col += 1) {
          const [pageX, pageY] = transformedPixel(matrix, tx + col, ty + row);
          if (
            pageX < 0 ||
            pageY < 0 ||
            pageX >= page.width ||
            pageY >= page.height
          ) {
            continue;
          }

          const destinationIndex = (pageY * page.width + pageX) * 4;
          const destination: Color = {
            r: pagePixels[destinationIndex + 0] ?? 0,
            g: pagePixels[destinationIndex + 1] ?? 0,
            b: pagePixels[destinationIndex + 2] ?? 0,
            a: pagePixels[destinationIndex + 3] ?? 0,
          };
          writeColor(
            pagePixels,
            destinationIndex,
            sourceOverMinecraft(source, destination)
          );
        }
      }
    }
  }

  page.context.putImageData(pageImageData, 0, 0);
}

function replaceColorsFromPalette(
  color: Color,
  palette: Color[],
  replacements: Color[]
): Color | undefined {
  const index = palette.findIndex(
    (c) =>
      c.r === color.r && c.g === color.g && c.b === color.b && c.a === color.a
  );
  return index !== -1 ? replacements[index] : undefined;
}

function makeInitialValues(
  texture: Texture,
  coordinates: Coordinates,
  pixelate: boolean
) {
  if (pixelate) {
    const canvasWithContext = preparePixelationCanvas(
      texture.imageWithCanvas.canvasWithContext,
      coordinates.sx,
      coordinates.sy,
      coordinates.sw,
      coordinates.sh,
      coordinates.dw,
      coordinates.dh
    );
    const sx = 0;
    const sy = 0;
    const sw = canvasWithContext.canvas.width;
    const sh = canvasWithContext.canvas.height;
    const { dx, dy, dw, dh } = coordinates;
    return { canvasWithContext, sx, sy, sw, sh, dx, dy, dw, dh };
  }

  const canvasWithContext = texture.imageWithCanvas.canvasWithContext;
  const { sx, sy, sw, sh, dx, dy, dw, dh } = coordinates;
  return { canvasWithContext, sx, sy, sw, sh, dx, dy, dw, dh };
}

export function rotateNone(): RotateNone {
  return { kind: "None" };
}

export function rotateCorner(degrees: number): RotateCorner {
  return { kind: "Corner", degrees };
}

export function rotateCenter(degrees: number): RotateCenter {
  return { kind: "Center", degrees };
}

type DrawNearestNeighborOptions = {
  rotate?: Rotate;
  flip?: Flip;
  blend?: Blend;
  pixelate?: boolean;
  plugin?: TexturePlugin;
};

function drawNearestNeighbor(
  page: CanvasWithContext,
  texture: Texture,
  coordinates: Coordinates,
  options: DrawNearestNeighborOptions
): void {
  const rotateOption = options.rotate ?? { kind: "None" };
  const flipOption = options.flip ?? "None";
  const blendOption = options.blend ?? { kind: "None" };
  const pixelateOption = options.pixelate ?? false;
  const pluginOption = options.plugin;

  const { canvasWithContext, sx, sy, sw, sh, dx, dy, dw, dh } =
    makeInitialValues(texture, coordinates, pixelateOption);

  if (sw > 0 && sh > 0 && dw > 0 && dh > 0) {
    const imageData = canvasWithContext.context.getImageData(sx, sy, sw, sh);

    const pix = imageData.data;

    const blendColor: Color | null =
      blendOption.kind === "MultiplyHex"
        ? hexToColor(blendOption.hex)
        : blendOption.kind === "MultiplyColor"
          ? blendOption.color
          : null;

    const replaceColors: [Color[], Color[]] | null =
      blendOption.kind === "ReplaceHex"
        ? [
            blendOption.hex1.map(
              (hex: string) => hexToColor(hex) ?? { r: 0, g: 0, b: 0, a: 255 }
            ),
            blendOption.hex2.map(
              (hex: string) => hexToColor(hex) ?? { r: 0, g: 0, b: 0, a: 255 }
            ),
          ]
        : blendOption.kind === "ReplaceColor"
          ? [blendOption.color1, blendOption.color2]
          : null;

    if (blendColor && !pluginOption) {
      compositeMultiplyDirect({
        page,
        sourcePixels: pix,
        sw,
        sh,
        dw,
        dh,
        blendColor,
        rotate: rotateOption,
        flip: flipOption,
        dx,
        dy,
      });
      return;
    }

    const temp = makeCanvasWithContext(dw, dh);
    const deltax = dw / sw;
    const deltay = dh / sh;
    const pixwInitial = Math.floor(deltax);
    const pixhInitial = Math.floor(deltay);
    const pixw = pixwInitial < deltax ? pixwInitial + 1 : pixwInitial;
    const pixh = pixhInitial < deltay ? pixhInitial + 1 : pixhInitial;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const tx = x * deltax;
        const ty = y * deltay;

        // Source pixel
        const i = (y * sw + x) * 4;

        const source: Color = {
          r: pix[i + 0] ?? 0,
          g: pix[i + 1] ?? 0,
          b: pix[i + 2] ?? 0,
          a: pix[i + 3] ?? 255,
        };

        let out = blendColor ? multiplyColorsByDye(source, blendColor) : source;

        const replaced = replaceColors
          ? replaceColorsFromPalette(out, replaceColors[0], replaceColors[1])
          : undefined;

        if (replaced) {
          out = replaced;
        }

        temp.context.fillStyle = `rgba(${out.r}, ${out.g}, ${out.b}, ${out.a / 255})`;
        temp.context.fillRect(Math.floor(tx), Math.floor(ty), pixw, pixh);
      }
    }

    const pageContext = page.context;

    // Save the current state of the page
    pageContext.save();

    // Move to the destination coordinate
    pageContext.translate(dx, dy);

    if (rotateOption.kind === "Corner") {
      const radians = (rotateOption.degrees * Math.PI) / 180;
      pageContext.rotate(radians);
    } else if (rotateOption.kind === "Center") {
      const radians = (rotateOption.degrees * Math.PI) / 180;
      pageContext.translate(dw / 2, dh / 2);
      pageContext.rotate(radians);
      pageContext.translate(-dw / 2, -dh / 2);
    }

    if (flipOption === "Horizontal") {
      pageContext.translate(dw, 0);
      pageContext.scale(-1, 1);
    } else if (flipOption === "Vertical") {
      pageContext.translate(0, dh);
      pageContext.scale(1, -1);
    }

    if (pluginOption) {
      const pluginCanvas = pluginOption(coordinates, temp);
      pageContext.drawImage(pluginCanvas, 0, 0);
    } else {
      pageContext.drawImage(temp.canvas, 0, 0);
    }

    pageContext.restore();
  }
}

export type DrawTextureOptions = {
  flip?: Flip;
  blend?: Blend;
  pixelate?: boolean;
  rotate?: number;
  plugin?: TexturePlugin;

  /** @deprecated Use `rotate` instead. */
  rotateLegacy?: number;
};

export function drawTexture(
  page: CanvasWithContext,
  texture: Texture,
  [sx, sy, sw, sh]: Region,
  [dx, dy, dw, dh]: Region,
  options: DrawTextureOptions
): void {
  const rotate: Rotate = options.rotateLegacy
    ? rotateCorner(options.rotateLegacy)
    : options.rotate
      ? rotateCenter(options.rotate)
      : rotateNone();

  const drawNearestNeightbourOptions: DrawNearestNeighborOptions = {
    rotate,
    flip: options.flip,
    blend: options.blend,
    pixelate: options.pixelate,
    plugin: options.plugin,
  };

  if (sh > 0 && dh > 0 && sw > 0 && dw > 0) {
    const sourceScaleX = texture.imageWithCanvas.width / texture.standardWidth;
    const sourceScaleY =
      texture.imageWithCanvas.height / texture.standardHeight;

    const sxScaled = Math.floor(sx * sourceScaleX);
    const syScaled = Math.floor(sy * sourceScaleY);
    const swScaled = Math.max(
      1,
      Math.ceil((sx + sw) * sourceScaleX) - sxScaled
    );
    const shScaled = Math.max(
      1,
      Math.ceil((sy + sh) * sourceScaleY) - syScaled
    );

    drawNearestNeighbor(
      page,
      texture,
      {
        sx: sxScaled,
        sy: syScaled,
        sw: swScaled,
        sh: shScaled,
        dx,
        dy,
        dw,
        dh,
      },
      drawNearestNeightbourOptions
    );
  }
}
