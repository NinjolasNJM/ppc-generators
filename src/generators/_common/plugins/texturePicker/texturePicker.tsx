import { TexturePicker as BuilderTexturePicker } from "@genroot/builder/ui/texturePicker/texturePicker";
import { type SelectedTexture } from "@genroot/builder/ui/texturePicker/selectedTexture";
import { TintSelector } from "./tintSelector";
import { findVersion } from "../../textures/textureVersions";

export function TexturePicker({
  versionId,
  selectedTexture,
  onChange,
  enableRotation,
}: {
  versionId: string;
  selectedTexture: SelectedTexture | null;
  onChange: (texture: SelectedTexture) => void;
  enableRotation?: boolean;
}): JSX.Element | null {
  const textureVersion = findVersion(versionId);
  if (!textureVersion) {
    return null;
  }
  const { textureDef, frames } = textureVersion;
  return (
    <div>
      <div className="mb-8">
        <BuilderTexturePicker
          textureDef={textureDef}
          frames={frames}
          onSelect={onChange}
          enableRotation={enableRotation ?? true}
          blend={selectedTexture?.blend ?? null}
        />
      </div>
      <div className="mb-4">
        <TintSelector
          onChange={(blend) => {
            if (selectedTexture) {
              onChange({ ...selectedTexture, blend });
            }
          }}
        />
      </div>
    </div>
  );
}
