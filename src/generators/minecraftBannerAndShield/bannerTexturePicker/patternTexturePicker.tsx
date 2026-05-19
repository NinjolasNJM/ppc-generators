import React from "react";
import { type TextureDef } from "@genroot/builder/modules/generatorDef";
import { type TextureFrame } from "@genroot/builder/modules/textureData";
import { Button } from "@genroot/builder/ui/button/button";
import { EraseButton } from "@genroot/builder/ui/texturePicker/texturePicker";
import { TintSelector } from "@genroot/generators/_common/tintSelector/tintSelector";
import { type TintChoiceGroup } from "@genroot/generators/_common/tintSelector/tints";
import { findBannerShieldTextureVersion } from "../textures/textureVersions";
import {
  type BannerShieldPattern,
  type SelectedBannerShieldPattern,
} from "./types";

type PreviewPattern = {
  pattern: BannerShieldPattern;
  textureDef: TextureDef;
  frame: TextureFrame;
};

const bannerFrontSource = [1, 1, 20, 40] as const;

export function PatternTexturePicker({
  versionId,
  selectedPattern,
  tintChoiceGroups,
  onChange,
  enableErase = true,
}: {
  versionId: string;
  selectedPattern: SelectedBannerShieldPattern | null;
  tintChoiceGroups: TintChoiceGroup[];
  onChange: (pattern: SelectedBannerShieldPattern) => void;
  enableErase?: boolean;
}): JSX.Element | null {
  const textureVersion = findBannerShieldTextureVersion(versionId);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    selectedPattern?.patternId ?? null
  );

  React.useEffect(() => {
    setSelectedId(selectedPattern?.patternId ?? null);
  }, [selectedPattern, versionId]);

  if (!textureVersion) {
    return null;
  }

  const blend = selectedPattern?.blend ?? null;
  const previewPatterns = textureVersion.patterns.flatMap((pattern) => {
    const preview = makePreviewPattern(pattern, textureVersion);
    return preview ? [preview] : [];
  });
  const searchLower = search.toLowerCase();
  const filteredPatterns = searchLower
    ? previewPatterns.filter(({ pattern }) =>
        pattern.label.toLowerCase().includes(searchLower)
      )
    : previewPatterns;
  const selectedPreview =
    previewPatterns.find(({ pattern }) => pattern.id === selectedId) ?? null;

  const emit = ({
    patternId = selectedId,
    nextBlend = blend,
  }: {
    patternId?: string | null;
    nextBlend?: string | null;
  }) => {
    if (!patternId) {
      return;
    }

    onChange({
      versionId,
      patternId,
      blend: nextBlend,
    });
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          className="w-full border border-gray-300 p-2"
          type="search"
          placeholder="Search banner patterns"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
        {search ? (
          <Button
            title="Clear search"
            size="Small"
            color="Gray"
            onClick={() => {
              setSearch("");
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <div className="mb-8 flex">
        <div className="h-60 w-full overflow-y-auto">
          {filteredPatterns.map(({ pattern, textureDef, frame }) => (
            <button
              key={pattern.id}
              type="button"
              className={
                "mb-2 mr-2 inline-flex h-20 w-12 items-center justify-center border bg-white p-1 " +
                (selectedId === pattern.id
                  ? "border-blue-500"
                  : "border-gray-300")
              }
              title={pattern.label}
              onClick={() => {
                setSelectedId(pattern.id);
                onChange({
                  versionId,
                  patternId: pattern.id,
                  blend,
                });
              }}
            >
              <PatternPreview
                textureDef={textureDef}
                frame={frame}
                size={64}
                blend={null}
              />
            </button>
          ))}
        </div>
        <div className="w-24 shrink-0">
          <SelectedPatternPreview
            selectedPreview={selectedPreview}
            blend={blend}
          />
          <div className="mt-3 flex justify-around">
            {enableErase ? (
              <EraseButton
                onClick={() => {
                  setSelectedId(null);
                  onChange({
                    versionId,
                    patternId: "",
                    blend: null,
                  });
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <TintSelector
          value={blend}
          choiceGroups={tintChoiceGroups}
          onChange={(nextBlend) => {
            emit({ nextBlend });
          }}
        />
      </div>
    </div>
  );
}

function makePreviewPattern(
  pattern: BannerShieldPattern,
  textureVersion: NonNullable<ReturnType<typeof findBannerShieldTextureVersion>>
): PreviewPattern | null {
  if (pattern.bannerFrame) {
    return {
      pattern,
      textureDef: textureVersion.bannerTextureDef,
      frame: pattern.bannerFrame,
    };
  }
  if (pattern.shieldFrame) {
    return {
      pattern,
      textureDef: textureVersion.shieldTextureDef,
      frame: pattern.shieldFrame,
    };
  }
  return null;
}

function PatternPreview({
  textureDef,
  frame,
  size,
  blend,
}: {
  textureDef: TextureDef;
  frame: TextureFrame;
  size: number;
  blend: string | null;
}) {
  const [frameX, frameY] = frame.rectangle;
  const [sourceX, sourceY, sourceWidth, sourceHeight] = bannerFrontSource;
  const scale = size / sourceHeight;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const tintStyle = blend
    ? {
        backgroundColor: blend,
        backgroundBlendMode: "multiply" as const,
      }
    : undefined;

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        width,
        height,
      }}
    >
      <div
        style={{
          width: sourceWidth,
          height: sourceHeight,
          imageRendering: "pixelated",
          transform: `scale(${scale})`,
          backgroundImage: `url(${textureDef.url})`,
          backgroundPosition: `${-(frameX + sourceX)}px ${-(frameY + sourceY)}px`,
          backgroundSize: `${textureDef.standardWidth}px ${textureDef.standardHeight}px`,
          ...tintStyle,
        }}
      />
    </div>
  );
}

function SelectedPatternPreview({
  selectedPreview,
  blend,
}: {
  selectedPreview: PreviewPattern | null;
  blend: string | null;
}) {
  return (
    <div className="flex flex-col items-center" style={{ width: "96px" }}>
      <div className="flex h-36 w-20 items-center justify-center border-4 border-gray-200 bg-white">
        {selectedPreview ? (
          <PatternPreview
            textureDef={selectedPreview.textureDef}
            frame={selectedPreview.frame}
            size={128}
            blend={blend}
          />
        ) : null}
      </div>
      <div className="max-w-full p-2 pt-0 text-center text-gray-500">
        {selectedPreview?.pattern.label ?? ""}
      </div>
    </div>
  );
}
