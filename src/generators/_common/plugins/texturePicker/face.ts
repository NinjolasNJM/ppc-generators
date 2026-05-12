import {
  type DrawTextureOptions,
  type Blend,
} from "@genroot/builder/modules/renderers/drawTexture";
import {
  type Generator,
  type Region,
} from "@genroot/builder/modules/generator";
import { decodeSelectedTextureWithBlend, decodeSelectedTextureWithBlendArray, encodeSelectedTextureWithBlendArray, SelectedTextureWithBlend } from "./selectedTextureWithBlend";
import { makeNextFlip } from "@genroot/builder/ui/texturePicker/flip";



/* let defineInputRegion = (faceId, region) => {
  Generator.defineRegionInput(region, () => {
    let selectedTextureFrame = TexturePicker.SelectedTexture.decode(
      Generator.getStringInputValue("SelectedTextureFrame"),
    )
    let selectedTextureFrames = TexturePicker.SelectedTexture.decodeArray(
      Generator.getStringInputValue(faceId),
    )
    switch selectedTextureFrame {
    | Some(selectedTextureFrame) => {
        //if textureDefId = "" erase
        let newTextureFrames = if selectedTextureFrame.textureDefId == "" {
          let _ = Js.Array2.pop(selectedTextureFrames)
          selectedTextureFrames
        } else {
          Belt.Array.concat(selectedTextureFrames, [selectedTextureFrame])
        }
        Generator.setStringInputValue(
          faceId,
          TexturePicker.SelectedTexture.encodeArray(newTextureFrames),
        )
      }
    | None => ()
    }
  })
}
*/
export function defineInputRegion(
  generator: Generator,
  faceId: string,
  region: Region
) {
  generator.defineRegionInput(region, () => {
    const selectedTextureJson = generator.getStringInputValue(
      "CurrentBlockTexture"
    );

    const selectedTexture = selectedTextureJson
      ? decodeSelectedTextureWithBlend(selectedTextureJson)
      : null;

    if (selectedTexture) {
      const curentFaceTexturesJson = generator.getStringInputValue(faceId);
      const currentFaceTextures = curentFaceTexturesJson
        ? decodeSelectedTextureWithBlendArray(curentFaceTexturesJson)
        : [];

      const newFaceTextures =
        selectedTexture.selectedTexture?.textureDefId === ""
          ? (currentFaceTextures.pop(), currentFaceTextures)
          : currentFaceTextures.concat([selectedTexture]);
      const newFaceTexturesJson =
        encodeSelectedTextureWithBlendArray(newFaceTextures);
      generator.setStringInputValue(faceId, newFaceTexturesJson);
    }
  });
}

/* let drawTexture = (
  face: TexturePicker.SelectedTexture.t,
  (sx, sy, sw, sh),
  (dx, dy, dw, dh),
  ~flip: Generator_Texture.flip=#None,
  ~rotate: float=0.0,
  (),
) => {
  let {textureDefId, frame, rotation, flip: textureFlip, blend} = face // selectedTextureFrame
  let (tx, ty, tw, th) = frame.rectangle
  let ix = tx + sx
  let iy = ty + sy

  let (newFlip, rotation) = TexturePicker.Flip.next(flip, textureFlip, rotation)

  let source = switch rotation {
  | Rot0 => (ix, iy, sw, sh) // Default positions
  | Rot90 => (tx + sy, ty + tw - (sw + sx), sh, sw)
  | Rot180 => (tx + tw - (sw + sx), ty + th - (sh + sy), sw, sh)
  | Rot270 => (tx + th - (sh + sy), ty + sx, sh, sw)
  }
  let destination = switch rotation {
  | Rot0 => (dx, dy, dw, dh)
  | Rot90 => (dx + (dw - dh) / 2, dy - (dw - dh) / 2, dh, dw)
  | Rot180 => (dx, dy, dw, dh)
  | Rot270 => (dx + (dw - dh) / 2, dy - (dw - dh) / 2, dh, dw)
  }
  let rot = rotate +. TexturePicker.Rotation.toDegrees(rotation)
  Generator.drawTexture(
    textureDefId,
    source,
    destination,
    ~flip={newFlip},
    ~rotate={rot},
    ~blend={blend},
    (),
  )
}*/
function drawTexture(
  generator: Generator,
  face: SelectedTextureWithBlend,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions
) {
  if (!face.selectedTexture) {
    return;
  }

  const { textureDefId, frame, rotation, flip } = face.selectedTexture;
  const [dx, dy, dw, dh] = destination;

  const [sx, sy, sw, sh] = source;
  const [fx, fy, fw, fh] = frame.rectangle;

  const flipOption = options?.flip ?? "None";

  const [nextFlip, nextRotation] = makeNextFlip(flipOption, flip, rotation);

  const sourceRegion: Region = (() => {
    switch (nextRotation) {
      case "Rot0":
        return [fx + sx, fy + sy, sw, sh];
      case "Rot90":
        return [fx + sy, fy + fw - (sw + sx), sh, sw];
      case "Rot180":
        return [fx + fw - (sw + sx), fy + fh - (sh + sy), sw, sh];
      case "Rot270":
        return [fx + fh - (sh + sy), fy + sx, sh, sw];
    }
  })();

  const destinationRegion: Region = (() => {
    switch (nextRotation) {
      case "Rot0":
        return [dx, dy, dw, dh];
      case "Rot90":
        return [dx + (dw - dh) / 2, dy - (dw - dh) / 2, dh, dw];
      case "Rot180":
        return [dx, dy, dw, dh];
      case "Rot270":
        return [dx + (dw - dh) / 2, dy - (dw - dh) / 2, dh, dw];
    }
  })();

  const rotate: number = ((): number => {
    const currRotate = options ? options.rotate ?? 0 : 0;
    switch (nextRotation) {
      case "Rot0":
        return currRotate;
      case "Rot90":
        return currRotate + 90;
      case "Rot180":
        return currRotate + 180;
      case "Rot270":
        return currRotate + 270;
    }
  })();

  const blend: Blend | undefined = face.blend
    ? { kind: "MultiplyHex", hex: face.blend }
    : undefined;

  const optionsWithTransforms: DrawTextureOptions = {
    ...options,
    rotate,
    flip: nextFlip,
    blend,
  };

  generator.drawTexture(
    textureDefId,
    sourceRegion,
    destinationRegion,
    optionsWithTransforms
  );
}

export function drawFace(
  generator: Generator,
  faceId: string,
  source: Region,
  destination: Region,
  options?: DrawTextureOptions
) {
  const faceTexturesJson = generator.getStringInputValue(faceId);
  if (faceTexturesJson) {
    const faceTextures = decodeSelectedTextureWithBlendArray(faceTexturesJson);
    faceTextures.forEach((selectedTexture: SelectedTextureWithBlend) => {
      drawTexture(generator, selectedTexture, source, destination, options);
    });
  }
}
