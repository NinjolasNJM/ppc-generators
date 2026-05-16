# Execution Plan: `block-generator-updates-v2`

## Goal

Port the block/item texture picker updates in a way that stays incremental, test-driven where practical, and verifiable with the existing visual test harness.

## Why this approach

- The repo already has Playwright screenshot tests for generators, so visual regression coverage is available.
- The picker and texture metadata changes include enough pure logic to justify unit tests first.
- The block generator has cross-cutting state handling, so an incremental sequence reduces the risk of breaking unrelated generators.

## Step-by-step plan

- [x] Add unit tests for the pure helper logic first.
  - `src/builder/ui/texturePicker/selectedTexture.ts`
  - `src/builder/ui/texturePicker/rotation.ts`
  - `src/builder/modules/textureData.ts`
  - `src/generators/minecraftBlock/selectedTextureWithBlend.ts`
  - Covered:
    - encode/decode round-trips
    - texture frame conversion from tile metadata
    - frame label formatting
    - rotation and flip transitions
    - erase/reset encoding behavior

- [x] Add or extend screenshot tests for the generators.
  - Used the existing Playwright setup under `tests/generators`.
  - Covered block generator states for:
    - no texture selected
    - texture selected
    - horizontal flip
    - vertical flip
    - erase/reset
    - tint preview
  - Added block generator coverage for:
    - rotate once + vertical flip
    - rotate once + horizontal flip

- [x] Port the shared picker primitives.
  - Added the missing flip helper in the shared texture picker layer.
  - Extended `SelectedTexture` to include `flip`.
  - Updated the shared picker UI to support:
    - rotation
    - horizontal flip
    - vertical flip
    - erase/reset
    - tint preview
  - Kept this step isolated so it could be verified before touching the consumers.

- [x] Add or align the block tint wrapper.
  - Introduced `SelectedTextureWithBlend` handling where the block generator stores current selection.
  - Preserved blend state when selecting textures.
  - Verified erase/reset clears the selected texture in the intended way without dropping unrelated state unless that is required.

- [x] Update block face rendering.
  - Combined rotation, flip, and blend when drawing faces.
  - Verified empty-selection handling remains safe.
  - Checked accumulation logic for face inputs, especially where erase/reset is encoded through an empty texture id.

- [ ] Update the item generator path.
  - Thread the updated selection shape through the item workflow if needed.
  - Preserve rendering of selected frames.
  - Apply blend/tint values where the item flow is expected to carry them.

- [x] Validate incrementally.
  - Ran `npm run types:check` after the major change sets.
  - Ran targeted Playwright generator tests once picker behavior and consumer wiring landed.
  - Updated screenshots only for intentional visual changes.

- [x] Defer texture asset churn unless it becomes necessary.
  - Left asset regeneration and broad generated-data updates until the code path was stable.
  - Only ported the texture refresh work where the updated picker or frame metadata depended on it.

## Notes

- This plan intentionally avoids implementation details and keeps the migration staged.
- The visual test harness already exists, so additional test files can focus on the new pure logic and any new generator states introduced by the picker update.
