# Default Skin UI Decoupling Options

## Baseline (from `main`)
- `TextureControl` is generic and stateless beyond immediate UI interaction.
- It receives `choices`, `textures`, and emits `onChange(texture)`.
- It does not read/write model variables and does not know about model-type inputs.

## UI Objective (from this branch)
- Offer bundled Minecraft default skins (Alex, Steve, etc.) in the texture picker.
- If a bundled default is selected, changing `Skin Model Type` (`Wide`/`Slim`) should automatically switch to the matching variant.
- If user uploads/fetches a custom skin, do not auto-switch it on model-type changes.

## Why Current Branch Feels Coupled
- Generic `TextureControl` now knows Minecraft defaults, model-type variable naming, and persistence keys.
- `controls.tsx` passes model variable getters/setters into a texture widget.
- `model.ts` contains default-skin URL detection and bookkeeping logic tied to UI behavior.
- Behavior depends on string conventions (`${id} Skin Name`, `${id} Model Type`) spread across layers.

## Wide/Slim Detection: URL Inference vs Explicit State

### Should we detect Wide/Slim from URL?
- Prefer **no** for normal runtime behavior.
- URL-based detection is fragile (hashed asset names, CDN rewrites, user-provided URLs, renamed files).
- It is also implicit: behavior depends on parsing transport details, not domain intent.

### Better strategy
- Track an explicit skin-selection state shape:
  - `source`: `preset` | `custom`
  - `presetName`: string | null
  - `modelType`: `Wide` | `Slim`
- Resolution rule:
  - if `source === preset` and `presetName` is set: resolve texture via `(presetName, modelType)`
  - else (`custom`): keep user texture unchanged when model type changes
- This removes the need to infer model type or preset identity from texture URL during regular interaction.

### When URL inference is still acceptable
- One-time migration/backfill only:
  - opening legacy saved state where only raw texture URL exists
  - map known bundled URLs to `(presetName, modelType)` best-effort
  - then persist explicit state and stop inferring on subsequent edits

## Option 1 (Recommended): Dedicated `MinecraftSkinControl` + Keep `TextureControl` Generic

### Approach
- Keep `TextureControl` in baseline form for non-Minecraft use.
- Add a new control type/component for Minecraft skin workflows only (e.g. `MinecraftSkinInput`).
- `MinecraftSkinControl` owns:
  - bundled default-skin select
  - model-type select awareness (`Wide`/`Slim`)
  - upload/fetch + conversion
  - source mode state (`preset` vs `custom`)
- It emits final texture through one explicit callback; no hidden model string variables.
- It stores explicit metadata (`source`, `presetName`) in control state; no URL parsing for mode/model detection.

### Changes
- Add new control definition in builder control schema.
- Update Minecraft generators to use `MinecraftSkinInput` instead of overloading `TextureInput`.
- Remove Minecraft-specific behavior from `TextureControl`.
- Keep `model.ts` free of skin-detection helpers.

### Pros
- Clear separation of generic vs domain-specific UI.
- Much lower accidental coupling and fewer hidden conventions.
- Easier to test and reason about behavior.
- Eliminates runtime URL-based wide/slim inference.

### Cons
- Introduces a new control type and migration work across generators.

## Option 2: Orchestrator in `controls.tsx` (Container Pattern)

### Approach
- Keep `TextureControl` dumb/presentational.
- Add a small orchestration layer in `controls.tsx` for controls marked `enableMinecraftSkinInput`.
- Orchestrator tracks per-texture ephemeral state in React (not model variables):
  - selected default skin name (or null)
  - source mode (`preset`/`custom`)
- model type (`Wide`/`Slim`) from the select control
- On model-type change, orchestrator re-resolves and re-applies texture only when source mode is `preset`.

### Changes
- Add local state map keyed by control id in `controls.tsx`.
- Add a resolver utility (`resolveDefaultSkin(name, modelType)`).
- Leave `model.ts` unchanged.
- `TextureControl` receives explicit callbacks/props for preset selection events, no direct model access.

### Pros
- Minimal framework-level change.
- Avoids model-layer coupling and string-key persistence hacks.
- Easier incremental adoption.
- No need to infer from URL unless migrating old state.

### Cons
- State is UI-session scoped unless explicitly persisted.
- `controls.tsx` becomes more complex over time if more special cases are added.

## Option 3: Generator-Owned Resolution (Data-Driven Inputs)

### Approach
- Generators explicitly define two inputs:
  - `Skin Preset` (None, Alex, Steve, ...)
  - `Skin Model Type` (`Wide`/`Slim`)
- Generator script resolves default texture URL from these inputs.
- Custom upload/fetch sets the actual texture and clears/ignores `Skin Preset`.
- UI does not infer anything from texture URL and does not persist hidden side-channel state.

### Changes
- Add a shared helper for generator scripts to resolve preset + model type to URL.
- Update Minecraft generators to follow a common input contract.
- Keep `TextureControl`, `controls.tsx`, and `model.ts` mostly unchanged.

### Pros
- Highest explicitness at the domain boundary.
- Eliminates UI/model inference logic.
- Strongly deterministic behavior from declared inputs.
- No wide/slim URL detection required at runtime.

### Cons
- Requires touching many generator scripts.
- Risk of duplication unless helper usage is enforced.

## Recommendation
- Choose **Option 1** if you want the cleanest architecture and long-term maintainability.
- Choose **Option 2** if you want the fastest low-risk refactor from current branch changes.
- Choose **Option 3** if you want behavior to be fully declared in generator contracts and avoid UI intelligence.

## Practical Recommendation on URL Detection
- Treat URL detection as a **legacy migration utility only**, not core behavior.
- Core behavior should be driven by explicit state (`source`, `presetName`, `modelType`).
- If migration is needed, keep it isolated in one helper (e.g. `inferLegacyPresetFromUrl`) and call it only during model-load hydration.

## Suggested Next Step
- Run a short spike implementing one Minecraft generator with **Option 1** and verify:
  - preset auto-switches on `Wide/Slim`
  - custom upload/fetch does not auto-switch
  - generic `TextureControl` remains unchanged
