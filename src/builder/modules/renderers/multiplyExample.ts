// Java Edition CPU-side approx. of banner rendering
export type RGBA = {
  r: number; // 0-255
  g: number;
  b: number;
  a: number;
};

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export function multiplyTextureByDye(texture: RGBA, dye: RGB): RGBA {
  return {
    r: (texture.r / 255) * dye.r,
    g: (texture.g / 255) * dye.g,
    b: (texture.b / 255) * dye.b,
    a: texture.a,
  };
}

export function alphaBlend(src: RGBA, dst: RGBA): RGBA {
  const srcA = src.a / 255;
  const dstA = dst.a / 255;

  return {
    r: src.r * srcA + dst.r * (1 - srcA),
    g: src.g * srcA + dst.g * (1 - srcA),
    b: src.b * srcA + dst.b * (1 - srcA),

    // Minecraft's translucent blend uses:
    // src alpha factor ONE, dst alpha factor ONE_MINUS_SRC_ALPHA
    a: 255 * (srcA + dstA * (1 - srcA)),
  };
}

export function compositeBannerLayer(
  current: RGBA,
  layerTexturePixel: RGBA,
  dye: RGB
): RGBA {
  const tinted = multiplyTextureByDye(layerTexturePixel, dye);
  return alphaBlend(tinted, current);
}

// Formula for one pixel and one layer, not including normalizing answer to 0-255>
export function compositeBannerLayerNormalizedFormula({
  texture,
  dye,
  destination,
}: {
  texture: RGBA;
  dye: RGB;
  destination: RGBA;
}): RGBA {
  const texR = texture.r / 255;
  const texG = texture.g / 255;
  const texB = texture.b / 255;
  const texA = texture.a / 255;

  const dyeR = dye.r / 255;
  const dyeG = dye.g / 255;
  const dyeB = dye.b / 255;

  const dstR = destination.r / 255;
  const dstG = destination.g / 255;
  const dstB = destination.b / 255;
  const dstA = destination.a / 255;

  const srcR = texR * dyeR;
  const srcG = texG * dyeG;
  const srcB = texB * dyeB;
  const srcA = texA;

  const outR = srcR * srcA + dstR * (1 - srcA);
  const outG = srcG * srcA + dstG * (1 - srcA);
  const outB = srcB * srcA + dstB * (1 - srcA);
  const outA = srcA + dstA * (1 - srcA);

  return {
    r: outR * 255,
    g: outG * 255,
    b: outB * 255,
    a: outA * 255,
  };
}

/*
Yes — this is very likely an alpha/compositing mismatch.

The key thing: **Minecraft banner layers use straight-alpha source colors, then the GPU blend stage premultiplies by alpha during blending.** You should **not** premultiply the RGB yourself before handing the pixel to Canvas.

## Minecraft’s exact banner blend

For each banner pattern pixel:

```ts
texture = patternPixel; // RGBA from PNG
dye = dyeColor.textureDiffuseColor; // RGB
dst = alreadyRenderedBannerPixel;
```

Minecraft shader produces this source color:

```ts
src.r = texture.r * dye.r;
src.g = texture.g * dye.g;
src.b = texture.b * dye.b;
src.a = texture.a;
```

Normalized `0..1`, that is:

```ts
srcRGB = textureRGB * dyeRGB;
srcA   = textureA;
```

Then the `BANNER_PATTERN` render pipeline uses:

```text
color blend:
  SRC_ALPHA, ONE_MINUS_SRC_ALPHA

alpha blend:
  ONE, ONE_MINUS_SRC_ALPHA
```

So the actual layer-over-layer result is:

```ts
outRGB = srcRGB * srcA + dstRGB * (1 - srcA);
outA   = srcA          + dstA   * (1 - srcA);
```

That is normal “source over” alpha blending, but with **straight source RGB**.

## The common Canvas mistake

This is wrong for Minecraft-style banner compositing:

```ts
// WRONG if you later draw this with normal canvas source-over
src.r = texture.r * dye.r * texture.a;
src.g = texture.g * dye.g * texture.a;
src.b = texture.b * dye.b * texture.a;
src.a = texture.a;
```

Because then Canvas does source-over and effectively applies alpha again:

```ts
outRGB = (srcRGBAlreadyAlphaMultiplied) * srcA + dstRGB * (1 - srcA);
```

So a 50% transparent pattern becomes too weak/dark, because it gets multiplied by alpha twice.

Correct:

```ts
src.r = texture.r * dye.r;
src.g = texture.g * dye.g;
src.b = texture.b * dye.b;
src.a = texture.a;
```

Then let Canvas blend it.

## Canvas compared to Minecraft

Canvas’s default `globalCompositeOperation` is `"source-over"`, and drawing operations use the current compositing operator after applying `globalAlpha`; the default `globalAlpha` is `1.0`. The HTML spec also says Canvas’s internal output bitmap uses **premultiplied alpha**, even though `ImageData` values are conceptually straight/non-premultiplied when you read and write them. ([HTML Living Standard][1])

So Canvas can match Minecraft **if** you do this:

```ts
ctx.globalCompositeOperation = "source-over";
ctx.globalAlpha = 1;
ctx.imageSmoothingEnabled = false;
```

And your layer image data is:

```ts
layerPixel.rgb = texturePixel.rgb * dye.rgb;
layerPixel.a   = texturePixel.a;
```

Not:

```ts
layerPixel.rgb = texturePixel.rgb * dye.rgb * texturePixel.a;
```

## Correct CPU-side banner compositing

For the most Minecraft-faithful result, I would honestly avoid Canvas compositing for the banner layers and do the blending manually into one final `ImageData`.

Use this:

```ts
type Pixel = {
  r: number; // 0-255
  g: number;
  b: number;
  a: number;
};

type Color = {
  r: number;
  g: number;
  b: number;
};

function tintBannerPixel(texture: Pixel, dye: Color): Pixel {
  return {
    // Straight alpha RGB. Do NOT multiply by texture.a here.
    r: (texture.r / 255) * dye.r,
    g: (texture.g / 255) * dye.g,
    b: (texture.b / 255) * dye.b,
    a: texture.a,
  };
}

function sourceOverMinecraft(src: Pixel, dst: Pixel): Pixel {
  const sa = src.a / 255;
  const da = dst.a / 255;

  return {
    r: src.r * sa + dst.r * (1 - sa),
    g: src.g * sa + dst.g * (1 - sa),
    b: src.b * sa + dst.b * (1 - sa),

    // Minecraft's TRANSLUCENT alpha blend:
    // src alpha factor = ONE
    // dst alpha factor = ONE_MINUS_SRC_ALPHA
    a: 255 * (sa + da * (1 - sa)),
  };
}

function applyBannerLayer(dst: Pixel, texture: Pixel, dye: Color): Pixel {
  const src = tintBannerPixel(texture, dye);
  return sourceOverMinecraft(src, dst);
}
```

Then full banner order:

```ts
let dst = sampleBannerBaseUntinted(x, y);

// base dye cloth layer
dst = applyBannerLayer(dst, sampleBannerBasePattern(x, y), baseDye);

// pattern layers, in order
for (const layer of patternLayers.slice(0, 16)) {
  dst = applyBannerLayer(
    dst,
    samplePatternTexture(layer.pattern, x, y),
    layer.dye
  );
}
```

## The important transparent-pixel cases

### Fully transparent pattern pixel

```ts
srcA = 0;
outRGB = srcRGB * 0 + dstRGB * 1;
outA = 0 + dstA * 1;
```

So it changes **nothing**.

Even if the transparent pixel’s RGB is weird, it should not matter if alpha is exactly `0`.

### 50% transparent pattern pixel

Suppose:

```ts
dst = rgb(100, 80, 60)
src = rgb(200, 40, 40), alpha 128
```

Minecraft does:

```ts
out = src * 0.50196 + dst * 0.49804
```

So:

```ts
out.r ≈ 150
out.g ≈ 60
out.b ≈ 50
```

If you accidentally premultiply before giving it to Canvas, you get more like:

```ts
wrongSrc = rgb(100, 20, 20), alpha 128
out.r ≈ 100
out.g ≈ 50
out.b ≈ 40
```

That makes semi-transparent areas too dark and too close to the background.

## What I would check in your project

The biggest suspects are:

```ts
// Bad:
rgb *= alpha;
```

before calling `putImageData` or `drawImage`.

Also check for these:

```ts
ctx.globalCompositeOperation = "multiply"; // wrong for layer placement
ctx.globalAlpha !== 1;                    // wrong unless intentionally applying extra opacity
ctx.imageSmoothingEnabled = true;          // can blur alpha/color at edges
```

Use `"multiply"` only if you are using Canvas as a shortcut to create the **tinted source texture** in an isolated temporary canvas. Do **not** use `"multiply"` to place the layer onto the banner. The final placement should be plain `"source-over"`.

## Best practical Canvas pipeline

Do this:

```ts
// 1. Build each tinted layer manually with ImageData.
//    RGB = textureRGB * dyeRGB
//    A = textureA

// 2. Put that layer into a temporary canvas.
layerCtx.putImageData(tintedLayerImageData, 0, 0);

// 3. Draw it onto the final banner canvas with source-over.
finalCtx.globalCompositeOperation = "source-over";
finalCtx.globalAlpha = 1;
finalCtx.imageSmoothingEnabled = false;
finalCtx.drawImage(layerCanvas, 0, 0);
```

But for exactness, the safest version is: **do every layer with manual per-pixel `sourceOverMinecraft`**, then only `putImageData` once at the end. That avoids Canvas’s internal premultiplied-alpha conversions from slightly altering semi-transparent pixels.

[1]: https://html.spec.whatwg.org/multipage/canvas.html "HTML Standard"
*/
