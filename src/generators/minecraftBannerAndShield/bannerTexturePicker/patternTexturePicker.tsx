import React from "react";
import { type TextureDef } from "@genroot/builder/modules/generatorDef";
import { type TextureFrame } from "@genroot/builder/modules/textureData";
import {
  EraseButton,
  Search,
} from "@genroot/builder/ui/texturePicker/texturePicker";
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
const bgGray200 = "rgb(229 231 235)";
const bgGray400 = "rgb(156 163 175)";
const borderSize = 4;

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
      <Search
        value={search}
        onChange={(value) => {
          setSearch(value);
        }}
        onClear={() => {
          setSearch("");
        }}
      />
      <div className="mb-8 flex">
        <div className="h-60 w-full overflow-y-auto">
          {filteredPatterns.map(({ pattern, textureDef, frame }) => (
            <PatternTileButton
              key={pattern.id}
              pattern={pattern}
              textureDef={textureDef}
              frame={frame}
              isSelected={selectedId === pattern.id}
              onClick={() => {
                setSelectedId(pattern.id);
                onChange({
                  versionId,
                  patternId: pattern.id,
                  blend,
                });
              }}
            />
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

function PatternTileButton({
  pattern,
  textureDef,
  frame,
  isSelected,
  onClick,
}: {
  pattern: BannerShieldPattern;
  textureDef: TextureDef;
  frame: TextureFrame;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [isHover, setIsHover] = React.useState(false);
  const width = getPreviewWidth(64);
  const height = 64;
  const borderColor = isSelected || isHover ? bgGray400 : bgGray200;

  return (
    <button
      title={pattern.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: width + borderSize * 2,
        height: height + borderSize * 2,
        margin: `0 ${borderSize}px ${borderSize}px 0`,
        border: `${borderSize}px solid ${borderColor}`,
        backgroundColor: "white",
      }}
      onClick={onClick}
      onMouseEnter={() => {
        setIsHover(true);
      }}
      onMouseLeave={() => {
        setIsHover(false);
      }}
    >
      <PatternPreview
        textureDef={textureDef}
        frame={frame}
        size={64}
        blend={null}
      />
    </button>
  );
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
  const width = getPreviewWidth(size);
  const height = size;
  const imagePosition = `${-(frameX + sourceX)}px ${-(frameY + sourceY)}px`;
  const imageSize = `${textureDef.standardWidth}px ${textureDef.standardHeight}px`;
  const tintMaskStyle = makeTintMaskStyle({
    textureDef,
    imagePosition,
    imageSize,
    blend,
  });

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
          position: "relative",
          width: sourceWidth,
          height: sourceHeight,
          overflow: "hidden",
          imageRendering: "pixelated",
          transform: `scale(${scale})`,
          backgroundImage: `url(${textureDef.url})`,
          backgroundPosition: imagePosition,
          backgroundRepeat: "no-repeat",
          backgroundSize: imageSize,
        }}
      >
        {tintMaskStyle ? <div style={tintMaskStyle} /> : null}
      </div>
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
      <div
        className="flex items-center justify-center bg-white"
        style={{
          width: getPreviewWidth(128) + borderSize * 2,
          height: 128 + borderSize * 2,
          border: `${borderSize}px solid ${bgGray200}`,
        }}
      >
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

function getPreviewWidth(height: number): number {
  const [, , sourceWidth, sourceHeight] = bannerFrontSource;
  return (sourceWidth / sourceHeight) * height;
}

function makeTintMaskStyle({
  textureDef,
  imagePosition,
  imageSize,
  blend,
}: {
  textureDef: TextureDef;
  imagePosition: string;
  imageSize: string;
  blend: string | null;
}): React.CSSProperties | undefined {
  if (!blend) {
    return undefined;
  }

  const image = `url(${textureDef.url})`;
  return {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundColor: blend,
    mixBlendMode: "multiply",
    WebkitMaskImage: image,
    maskImage: image,
    WebkitMaskPosition: imagePosition,
    maskPosition: imagePosition,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: imageSize,
    maskSize: imageSize,
  };
}
