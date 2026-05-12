import { makeNextRotation, type Rotation } from "@genroot/builder/ui/texturePicker/rotation";

export type Flip = "None" | "Horizontal" | "Vertical";

export function makeNextFlip(
  current: Flip,
  flip: Flip,
  rotation: Rotation
): [Flip, Rotation] {
  switch (current) {
    case "None":
      switch (flip) {
        case "None":
          return ["None", rotation];
        case "Vertical":
          return ["Vertical", rotation];
        case "Horizontal":
          return ["Horizontal", rotation];
      }
      break;
    case "Vertical":
      switch (flip) {
        case "None":
          return ["Vertical", rotation];
        case "Vertical":
          return ["None", rotation];
        case "Horizontal":
          return ["None", makeNextRotation(rotation)];
      }
      break;
    case "Horizontal":
      switch (flip) {
        case "None":
          return ["Horizontal", rotation];
        case "Vertical":
          return ["None", makeNextRotation(rotation)];
        case "Horizontal":
          return ["None", rotation];
      }
  }
}

export function flipToTransform(flip: Flip): string {
  switch (flip) {
    case "Horizontal":
      return "scaleX(-1)";
    case "Vertical":
      return "scaleY(-1)";
    case "None":
      return "";
  }
}

export function flipToString(flip: Flip): string {
  switch (flip) {
    case "Horizontal":
      return "Horizontal";
    case "Vertical":
      return "Vertical";
    case "None":
      return "None";
  }
}