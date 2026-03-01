# Default Skin UI Decoupling Design

Date: 2026-03-01
Status: Approved

## Context
The current branch approach couples Minecraft-specific skin behavior into generic control and model layers. We want to preserve the UI objective while maximizing long-term architecture cleanliness.

## UI Objective
- Offer bundled Minecraft default skins (Alex, Steve, etc.) in skin selection UI.
- If a bundled preset is selected, changing `Skin Model Type` (`Wide`/`Slim`) should auto-switch to the matching preset variant.
- If the user uploads or fetches a custom skin, model-type changes must not auto-switch that texture.

## Constraints
- Prioritize long-term architecture cleanliness over minimum churn.
- Per-session UI state is acceptable.
- Migrate all Minecraft generators.
- No backward compatibility required.

## Selected Approach
Adopt a dedicated Minecraft-specific control type: `MinecraftSkinInput` / `MinecraftSkinControl`.

## Architecture
- Add a new control definition and rendering path for Minecraft skins.
- Keep `TextureControl` generic (baseline behavior from `main`), with no Minecraft-specific behavior.
- Keep `controls.tsx` as control dispatcher by type, not a special-case orchestrator.
- Keep `model.ts` free of runtime URL inference and skin-specific bookkeeping conventions.

## Component and Data Flow
`MinecraftSkinControl` owns Minecraft skin behavior and emits final textures.

Inputs:
- control id/label
- generator-provided texture choices
- bundled preset catalog (shared/common module)
- current model type (`Wide`/`Slim`) as explicit prop
- `onChange(texture | null)` callback

Internal session state:
- `source`: `preset` | `custom`
- `presetName`: `string | null`

Behavior:
- Select bundled preset: set `source=preset`, set `presetName`, resolve URL by `(presetName, modelType)`, emit texture.
- Change model type while `source=preset`: re-resolve and emit matching preset variant.
- Upload or fetch skin: convert/normalize if needed, set `source=custom`, clear `presetName`, emit texture.
- Change model type while `source=custom`: no texture mutation.

Shared utility:
- `resolveBundledMinecraftSkin(presetName, modelType) => url`
- Centralized in one shared module.

## Generator Migration (All Minecraft Generators)
- Add generator API for Minecraft skin input (e.g. `defineMinecraftSkinInput(...)`).
- Migrate all generators currently using `enableMinecraftSkinInput` on `TextureInput`.
- Keep generator contracts minimal and consistent:
  - generator defines skin input once
  - generator defines model-type select as before
  - builder wiring passes model-type into `MinecraftSkinControl`
- Remove Minecraft-specific overloading from generic `TextureInput` path.
- Remove model getter/setter plumbing introduced solely for current branch coupling.

## Error Handling
- Preset resolve failure: log error, preserve last valid texture, show inline error in control.
- Upload parse/convert failure: show inline error, preserve last valid texture.
- Username fetch failure: retain existing fetch error UX pattern.

## Testing Strategy
- Unit tests:
  - resolver mapping: `preset + modelType => url`
- Component tests (`MinecraftSkinControl`):
  - preset selection emits expected texture
  - model-type changes re-emit only in preset mode
  - upload/fetch switches to custom mode and suppresses model-type-driven swapping
- Integration tests:
  - migrated generator renders new control path
  - generic `TextureControl` remains unaffected

## Non-Goals
- Backward-compatibility migration for prior saved/share state.
- Runtime inference of preset/model-type from texture URLs.

## Expected Outcome
A clean, reusable, centralized Minecraft skin workflow with explicit behavior boundaries and reduced cross-layer coupling.
