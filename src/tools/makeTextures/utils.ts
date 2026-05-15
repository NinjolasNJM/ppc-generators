import Path from "path";
import Fs from "fs";
import ChildProcess from "child_process";
import Jimp from "jimp";
import { type ImageInfo, readImageInfo } from "../common/imageInfo";
import {
  type Rectangle,
  type TextureData_Tile,
  imageToTextureFrames,
  sortTextureDataTiles,
} from "../../builder/modules/textureData";
import { packImages } from "../../builder/modules/texturePacking";

type ImageWithInfo = {
  name: string;
  path: string;
  info: ImageInfo;
};

type ImageWithCoordinates = {
  image: ImageWithInfo;
  coordinates: [number, number];
};

function makeSafeFileName(prefix: string, version: string): string {
  return prefix + "_" + version.replace(/[-.]/g, "_");
}

function hasImageExtension(path: string): boolean {
  return path.endsWith(".png");
}

function toImageWithInfo(path: string): ImageWithInfo {
  const { name } = Path.parse(path);
  const file = Fs.readFileSync(path);
  const info = readImageInfo(file);
  if (!info) {
    throw new Error(`Failed to read image info from ${path}`);
  }
  return { name, path, info };
}

function isFile(path: string): boolean {
  const stats = Fs.statSync(path);
  return stats.isFile();
}

function isImageFile(path: string): boolean {
  return hasImageExtension(path) && isFile(path);
}

function readImagesInDirectory(directoryPath: string): ImageWithInfo[] {
  return Fs.readdirSync(directoryPath)
    .map((fileName: string) => Path.join(directoryPath, fileName))
    .filter(isImageFile)
    .map(toImageWithInfo);
}

function calculateImagesWithCoordinates(
  images: ImageWithInfo[],
  canvasWidth: number
): {
  imagesWithCoordinates: ImageWithCoordinates[];
  canvasHeight: number;
} {
  const packableImages = images.map((image, index) => ({
    id: image.name,
    label: image.name,
    rectangle: [0, 0, image.info.width, image.info.height] satisfies Rectangle,
    sourceIndex: index,
  }));

  const packed = packImages(packableImages, canvasWidth);
  const sourceImageById = new Map(
    packableImages.map((image) => [image.id, image.sourceIndex] as const)
  );

  const imagesWithCoordinates = packed.frames
    .map((frame) => ({
      sourceIndex: sourceImageById.get(frame.id) ?? 0,
      coordinates: [frame.rectangle[0], frame.rectangle[1]] as [number, number],
    }))
    .sort((a, b) => a.sourceIndex - b.sourceIndex)
    .map((packedFrame) => ({
      image: images[packedFrame.sourceIndex]!,
      coordinates: packedFrame.coordinates,
    }));

  return {
    imagesWithCoordinates,
    canvasHeight: packed.atlasHeight,
  };
}

function makeCanvas(width: number, height: number): Promise<Jimp> {
  return new Promise((resolve, reject) => {
    new Jimp(width, height, (error: Error, canvas: Jimp) => {
      if (error) {
        reject(error);
      } else {
        resolve(canvas);
      }
    });
  });
}

async function makeTiledImagesCanvas(
  images: ImageWithInfo[],
  canvasWidth: number
): Promise<[ImageWithCoordinates[], Jimp, number, number]> {
  const { imagesWithCoordinates, canvasHeight } =
    calculateImagesWithCoordinates(images, canvasWidth);

  return imagesWithCoordinates
    .reduce(
      (acc, imageWithCoordinates) => {
        const { image, coordinates } = imageWithCoordinates;
        const [x, y] = coordinates;
        return acc.then((canvas) => {
          return Jimp.read(image.path).then((image: Jimp) => {
            return canvas.blit(image, x, y);
          });
        });
      },
      makeCanvas(canvasWidth, canvasHeight)
    )
    .then((canvas) => {
      return [imagesWithCoordinates, canvas, canvasWidth, canvasHeight];
    });
}

async function writeTileImage(
  canvas: Jimp,
  tileImagePath: string
): Promise<void> {
  await canvas.writeAsync(tileImagePath);
}

function printStdOutput(stdout: string | null, stderr: string | null): void {
  if (stdout && stdout.length > 0) {
    console.log(stdout);
  }
  if (stderr && stderr.length > 0) {
    console.log(stderr);
  }
}

function formatTypeScriptFile(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ChildProcess.exec("npx prettier --write " + path, (exn, stdout, stderr) => {
      if (exn) {
        reject(exn);
      } else {
        printStdOutput(stdout, stderr);
        resolve();
      }
    });
  });
}

function writeTileTypeScript(
  id: string,
  tileImagePath: string,
  tiles: TextureData_Tile[],
  canvasWidth: number,
  canvasHeight: number,
  tileTypeScriptPath: string
): void {
  const { base } = Path.parse(tileImagePath);
  const code = `
    // This is a generated file

    type TextureDef = {
      id: string;
      url: string;
      standardWidth: number;
      standardHeight: number;
    };

    import image from "./${base}";

    const textureDef: TextureDef = {
      id: "${id}",
      url: image.src,
      standardWidth: ${canvasWidth},
      standardHeight: ${canvasHeight},
    }

    export const tiles = ${JSON.stringify(tiles)}

    export const data = { textureDef, tiles };
  `;
  Fs.writeFileSync(tileTypeScriptPath, code);
  formatTypeScriptFile(tileTypeScriptPath);
}

function makeTileInfos(
  imagesWithCoordinates: ImageWithCoordinates[]
): TextureData_Tile[] {
  const tiles: Array<{ name: string; frames: Rectangle[] }> =
    imagesWithCoordinates.map(({ image, coordinates }) => {
      const { name, info } = image;
      const { width, height } = info;
      const [imageX, imageY] = coordinates;
      const frames = imageToTextureFrames(name, width, height).map((frame) => {
        const [frameX, frameY, frameWidth, frameHeight] = frame.rectangle;
        return [
          imageX + frameX,
          imageY + frameY,
          frameWidth,
          frameHeight,
        ] satisfies Rectangle;
      });
      return { name, frames };
    });

  return sortTextureDataTiles(tiles, inferUsualFrameSize(tiles));
}

function inferUsualFrameSize(tiles: Array<{ frames: Rectangle[] }>): number {
  const frameSizes = tiles.flatMap((tile) => {
    if (tile.frames.length !== 1) {
      return [];
    }

    const frame = tile.frames[0];
    if (!frame) {
      return [];
    }

    const [, , width, height] = frame;
    return width === height ? [width] : [];
  });

  return frameSizes.length > 0 ? Math.min(...frameSizes) : 0;
}

export async function makeTiledImages(
  id: string,
  sourceDirectory: string,
  outputDirectory: string,
  outputPrefix: string
): Promise<void> {
  const canvasWidth = 512;

  const fileName = makeSafeFileName(outputPrefix, id);
  const basePath = outputDirectory + "/" + fileName;
  const tileImagePath = basePath + ".png";
  const tileTypeScriptPath = basePath + ".ts";

  const images = readImagesInDirectory(sourceDirectory);

  const [imagesWithCoordinates, canvas, atlasWidth, atlasHeight] =
    await makeTiledImagesCanvas(images, canvasWidth);
  await writeTileImage(canvas, tileImagePath);
  writeTileTypeScript(
    id,
    tileImagePath,
    makeTileInfos(imagesWithCoordinates),
    atlasWidth,
    atlasHeight,
    tileTypeScriptPath
  );
}
