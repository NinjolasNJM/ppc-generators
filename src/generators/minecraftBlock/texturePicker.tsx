import { TexturePicker as CommonTexturePicker } from "@genroot/generators/_common/texturePicker/texturePicker";
import { type SelectedTexture } from "@genroot/generators/_common/texturePicker/selectedTexture";
import { TintSelector } from "@genroot/generators/_common/tintSelector/tintSelector";
import { defaultTintChoiceGroups } from "@genroot/generators/_common/tintSelector/tints";
import { findVersion } from "./textureVersions";

export function TexturePicker({
  versionId,
  onBlendSelected,
  onTextureSelected,
  blend,
}: {
  versionId: string;
  onTextureSelected: (texture: SelectedTexture) => void;
  onBlendSelected: (blend: string | null) => void;
  blend?: string | null;
}): JSX.Element | null {
  const textureVersion = findVersion(versionId);
  if (!textureVersion) {
    return null;
  }
  const { textureDef, frames } = textureVersion;
  return (
    <div>
      <div className="mb-8">
        <CommonTexturePicker
          key={textureDef.id}
          textureDef={textureDef}
          frames={frames}
          onSelect={onTextureSelected}
          enableRotation={true}
          tint={blend ?? null}
        />
      </div>
      <div className="mb-4">
        <TintSelector
          value={blend ?? null}
          choiceGroups={defaultTintChoiceGroups}
          onChange={onBlendSelected}
        />
      </div>
    </div>
  );
}
