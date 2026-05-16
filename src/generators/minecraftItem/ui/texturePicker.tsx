import { TexturePicker as CommonTexturePicker } from "@genroot/generators/_common/texturePicker/texturePicker";
import { type SelectedTexture } from "@genroot/generators/_common/texturePicker/selectedTexture";
import { type TextureVersion } from "./textureVersions";

export function TexturePicker(props: {
  textureVersion: TextureVersion;
  onSelect: (texture: SelectedTexture) => void;
}): JSX.Element {
  const { textureDef, frames } = props.textureVersion;
  return (
    <div className="mb-4">
      <CommonTexturePicker
        textureDef={textureDef}
        frames={frames}
        onSelect={props.onSelect}
        enableRotation={false}
      />
    </div>
  );
}
