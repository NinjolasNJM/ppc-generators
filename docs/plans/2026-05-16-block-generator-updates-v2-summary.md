# Block Generator Updates V2 Summary

## Overview

This branch updates the Minecraft block and item generators with newer textures, shared picker infrastructure, tint support, and broader visual/test coverage.

## Completed Changes

- Updated the supported Minecraft texture set to include the latest 26.1.2 assets.
- Extracted shared texture data and texture-version assembly into `_common`.
- Added shared texture picker and tint selector primitives.
- Restored block texture rotation, horizontal flip, vertical flip, and erase/reset controls.
- Fixed the selected tint preview so it renders the chosen color.
- Added item tint support through the shared picker flow and item serialization.
- Fixed texture frame counting so multi-frame textures and single-frame large textures are handled correctly.
- Added a shared `testing` generator for visual regression coverage.
- Added focused unit tests and Playwright screenshots for the block generator and shared picker behavior.

## Verification

- `npm run types:check`
- `npm run lint`
- `npx vitest run src/generators/_common/minecraftTextureVersions.test.ts src/generators/_common/textureVersions.test.ts src/generators/minecraftBlock/textureVersions.test.ts src/generators/minecraftItem/ui/textureVersions.test.ts`
- `npx vitest run src/generators/_common/textureData.test.ts`
- `npx vitest run src/generators/_common/texturePicker/textureSearch.test.ts src/generators/_common/texturePicker/flip.test.ts src/generators/_common/texturePicker/texturePicker.test.ts`
- `npx vitest run src/generators/_common/tintSelector/tintSelector.test.ts`
- `npx playwright test tests/generators/minecraftBlockGenerator/minecraftBlockGenerator.spec.ts`

