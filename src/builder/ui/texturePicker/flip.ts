import { makeNextRotation, Rotation } from "./rotation";

export type Flip = "None" | "Horizontal" | "Vertical";

export function makeNextFlipAndRotation(current: Flip, flip: Flip, rotation: Rotation): [Flip, Rotation] {
    switch (current) {
        case "None":
          switch (flip) {
            case "None": return ["None", rotation];
            case "Vertical": return ["Vertical", rotation];
            case "Horizontal": return ["Horizontal", rotation];
          }
          break;
          
        case "Vertical":
          switch (flip) {
            case "None": return ["Vertical", rotation];
            case "Vertical": return ["None", rotation];
            case "Horizontal": return ["None", makeNextRotation(makeNextRotation(rotation))];
          }
          break;
    
        case "Horizontal":
          switch (flip) {
            case "None": return ["Horizontal", rotation];
            case "Vertical": return ["None", makeNextRotation(makeNextRotation(rotation))];
            case "Horizontal": return ["None", rotation];
          }
          break;
      }
}

export function toTransform(flip: Flip) {
    switch (flip) {
        case "Horizontal": return "scaleX(-1)"
        case "Vertical": return "scaleY(-1)"
        case "None": return ""
    }
}
