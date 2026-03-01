# Default Skin UI Decoupling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce a dedicated Minecraft skin control that centralizes preset/model-type behavior while restoring generic `TextureControl` and removing cross-layer coupling.

**Architecture:** Add a first-class `MinecraftSkinInput` control type in builder control schema and render it with a new `MinecraftSkinControl` component. Keep session-only metadata (`source`, `presetName`) inside the UI component, resolve presets via shared helper utilities, and migrate all generators currently using `enableMinecraftSkinInput: true` to the new control API.

**Tech Stack:** TypeScript, React, Next.js, existing builder modules/UI controls, npm scripts (`lint`, `types:check`).

---

### Task 1: Add Control Schema for Minecraft Skins

**Files:**
- Modify: `src/builder/modules/modelControls.ts`

**Step 1: Write the failing type usage**

```ts
// expected future usage in controls.tsx:
case "MinecraftSkinInput": {
  return null;
}
```

**Step 2: Run type-check to verify it fails before schema update**

Run: `npm run types:check`
Expected: FAIL when trying to use `MinecraftSkinInput` kind not present in `Control` union.

**Step 3: Write minimal schema implementation**

```ts
export type MinecraftSkinInputControlProps = {
  standardWidth: number;
  standardHeight: number;
  choices: string[];
  modelTypeInputId: string;
};

export type MinecraftSkinInputControl = {
  kind: "MinecraftSkinInput";
  id: string;
  props: MinecraftSkinInputControlProps;
};

export type Control =
  | TextControl
  | CustomInputControl
  | RegionControl
  | TextureInputControl
  | MinecraftSkinInputControl
  | BooleanInputControl
  | SelectInputControl
  | RangeControl
  | ButtonControl;
```

**Step 4: Run type-check to verify schema compiles**

Run: `npm run types:check`
Expected: PASS (or next expected failures from unfinished downstream tasks).

**Step 5: Commit**

```bash
git add src/builder/modules/modelControls.ts
git commit -m "feat: add minecraft skin input control schema"
```

### Task 2: Expose New Control API in Model and Generator

**Files:**
- Modify: `src/builder/modules/model.ts`
- Modify: `src/builder/modules/generator.ts`

**Step 1: Write the failing usage in a generator (temporary local edit)**

```ts
generator.defineMinecraftSkinInput("Skin", {
  standardWidth: 64,
  standardHeight: 64,
  choices: ["Steve"],
  modelTypeInputId: "Skin Model Type",
});
```

**Step 2: Run type-check to verify it fails before API addition**

Run: `npm run types:check`
Expected: FAIL with missing `defineMinecraftSkinInput`.

**Step 3: Write minimal API implementation**

```ts
// model.ts
addMinecraftSkinControl(id: string, props: MinecraftSkinInputControlProps) {
  this.addControl({ kind: "MinecraftSkinInput", id, props });
}

// generator.ts
defineMinecraftSkinInput(id: string, props: MinecraftSkinInputControlProps): void {
  this.model.addMinecraftSkinControl(id, props);
}
```

**Step 4: Run type-check**

Run: `npm run types:check`
Expected: PASS (or next expected failures from unfinished UI wiring).

**Step 5: Commit**

```bash
git add src/builder/modules/model.ts src/builder/modules/generator.ts
git commit -m "feat: add generator and model APIs for minecraft skin input"
```

### Task 3: Add Centralized Preset Resolver and Session-State Helpers

**Files:**
- Create: `src/builder/ui/controls/minecraftSkinState.ts`
- Create: `src/builder/ui/controls/minecraftSkinResolver.ts`

**Step 1: Write failing resolver/state tests as inline assertions in a temporary harness**

```ts
// temp harness expectations:
// resolveBundledMinecraftSkin("Alex", "Wide") returns URL
// transitionOnPresetSelect("Alex") => { source: "preset", presetName: "Alex" }
// transitionOnCustomInput() => { source: "custom", presetName: null }
```

**Step 2: Run type-check to verify helper symbols are missing**

Run: `npm run types:check`
Expected: FAIL until helper files are implemented.

**Step 3: Implement helpers**

```ts
// minecraftSkinState.ts
export type SkinSelectionSource = "preset" | "custom";

export type SkinSelectionState = {
  source: SkinSelectionSource;
  presetName: string | null;
};

export const initialSkinSelectionState: SkinSelectionState = {
  source: "custom",
  presetName: null,
};

export function selectPreset(presetName: string): SkinSelectionState {
  return { source: "preset", presetName };
}

export function selectCustom(): SkinSelectionState {
  return { source: "custom", presetName: null };
}

// minecraftSkinResolver.ts
import { getSkinUrl } from "@genroot/generators/_common/skins";

export function resolveBundledMinecraftSkin(
  presetName: string,
  modelType: "Wide" | "Slim"
): string {
  return getSkinUrl(presetName, modelType);
}
```

**Step 4: Run type-check**

Run: `npm run types:check`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/builder/ui/controls/minecraftSkinState.ts src/builder/ui/controls/minecraftSkinResolver.ts
git commit -m "feat: add minecraft skin resolver and session state helpers"
```

### Task 4: Implement `MinecraftSkinControl` Component

**Files:**
- Create: `src/builder/ui/controls/minecraftSkinControl.tsx`

**Step 1: Write failing compile-time usage in `controls.tsx` (temporary)**

```tsx
<MinecraftSkinControl
  id={control.id}
  choices={control.props.choices}
  standardWidth={control.props.standardWidth}
  standardHeight={control.props.standardHeight}
  modelType={modelType}
  textures={model.values.textures}
  onChange={(texture) => onTextureChange(control.id, texture)}
/>
```

**Step 2: Run type-check to verify missing component/props**

Run: `npm run types:check`
Expected: FAIL.

**Step 3: Implement minimal component behavior**

```tsx
// key behaviors
const [selection, setSelection] = React.useState(initialSkinSelectionState);

React.useEffect(() => {
  if (selection.source === "preset" && selection.presetName) {
    void loadPreset(selection.presetName, modelType);
  }
}, [selection, modelType]);

const onPresetSelect = (name: string) => {
  setSelection(selectPreset(name));
  void loadPreset(name, modelType);
};

const onUploadOrFetch = async (image: HTMLImageElement) => {
  setSelection(selectCustom());
  onChange(makeTextureFromImage(image, standardWidth, standardHeight));
};
```

Include:
- Bundled preset choices (`DEFAULT_SKIN_NAMES`) merged with generator choices.
- Upload flow + Minecraft username fetch flow.
- Conversion via `convertToStandardSkin` for upload/fetch path.
- Inline error state for fetch/convert/load failures.

**Step 4: Run type-check**

Run: `npm run types:check`
Expected: PASS or only expected switch wiring errors in `controls.tsx` (to be fixed next).

**Step 5: Commit**

```bash
git add src/builder/ui/controls/minecraftSkinControl.tsx
git commit -m "feat: add minecraft skin control component"
```

### Task 5: Wire New Control Into `controls.tsx`

**Files:**
- Modify: `src/builder/ui/controls/controls.tsx`

**Step 1: Write failing switch case usage**

```tsx
case "MinecraftSkinInput": {
  const modelType =
    (model.getStringVariable(control.props.modelTypeInputId) as "Wide" | "Slim" | null) ?? "Wide";
  return <MinecraftSkinControl ... modelType={modelType} ... />;
}
```

**Step 2: Run type-check to verify missing/exhaustiveness issues**

Run: `npm run types:check`
Expected: FAIL until imports/props are complete.

**Step 3: Implement minimal wiring**

```tsx
import { MinecraftSkinControl } from "./minecraftSkinControl";

case "MinecraftSkinInput": {
  const raw = model.getStringVariable(control.props.modelTypeInputId);
  const modelType: "Wide" | "Slim" = raw === "Slim" ? "Slim" : "Wide";

  return (
    <MinecraftSkinControl
      key={control.id}
      id={control.id}
      choices={control.props.choices}
      standardWidth={control.props.standardWidth}
      standardHeight={control.props.standardHeight}
      modelType={modelType}
      textures={model.values.textures}
      onChange={(texture) => onTextureChange(control.id, texture)}
    />
  );
}
```

**Step 4: Run type-check**

Run: `npm run types:check`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/builder/ui/controls/controls.tsx
git commit -m "feat: render minecraft skin input controls"
```

### Task 6: Restore Generic `TextureControl`

**Files:**
- Modify: `src/builder/ui/controls/textureControl.tsx`

**Step 1: Write failing expectation (temporary): no model getters/setters props**

```tsx
<TextureControl
  id={control.id}
  choices={control.props.choices}
  standardWidth={control.props.standardWidth}
  standardHeight={control.props.standardHeight}
  textures={model.values.textures}
  onChange={(texture) => onTextureChange(control.id, texture)}
/>
```

**Step 2: Run type-check to confirm props mismatch before cleanup**

Run: `npm run types:check`
Expected: FAIL.

**Step 3: Remove Minecraft-specific coupling from `TextureControl`**

```tsx
// remove imports/props tied to model getters/setters and default skin catalog
// keep behavior:
// - optional select over provided choices
// - file upload to texture
// - no awareness of model type or skin presets
```

**Step 4: Run type-check**

Run: `npm run types:check`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/builder/ui/controls/textureControl.tsx src/builder/ui/controls/controls.tsx
git commit -m "refactor: return texture control to generic behavior"
```

### Task 7: Remove Model-Layer Skin Inference/Coupling

**Files:**
- Modify: `src/builder/modules/model.ts`
- Modify: `src/generators/_common/skins/index.ts` (only if now-unused exports remain)

**Step 1: Write failing compile expectation by deleting one usage of removed helper**

```ts
// remove calls to getSkinNameForUrl/isTextureDefaultBundle* and re-run checks
```

**Step 2: Run type-check to locate dead references**

Run: `npm run types:check`
Expected: FAIL if any references remain.

**Step 3: Remove runtime inference logic**

```ts
// model.addTexture
addTexture(id: string, texture: Texture) {
  this.values.addTexture(id, texture);
}

// delete isTextureDefaultBundle + isTextureDefaultBundleId
```

Also remove now-unused imports and skin helpers not needed outside migration.

**Step 4: Run lint + type-check**

Run: `npm run lint && npm run types:check`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/builder/modules/model.ts src/generators/_common/skins/index.ts
git commit -m "refactor: remove model-level default skin inference"
```

### Task 8: Migrate Generators to `defineMinecraftSkinInput`

**Files:**
- Modify all files returned by:
  - `rg -l "enableMinecraftSkinInput:\s*true" src/generators | sort`

Expected initial set:
- `src/generators/amogusBendable/amogusBendableGenerator.tsx`
- `src/generators/example/exampleGenerator.ts`
- `src/generators/minecraftActionFigure/minecraftActionFigureGenerator.ts`
- `src/generators/minecraftAllayCharacter/minecraftAllayCharacterGenerator.ts`
- `src/generators/minecraftAxolotlCharacter/minecraftAxolotlCharacterGenerator.ts`
- `src/generators/minecraftBeeCharacter/minecraftBeeCharacterGenerator.ts`
- `src/generators/minecraftCatCharacter/minecraftCatCharacterGenerator.ts`
- `src/generators/minecraftCharacter/minecraftCharacterGenerator.ts`
- `src/generators/minecraftCharacterHeads/minecraftCharacterHeadsGenerator.ts`
- `src/generators/minecraftCharacterMini/minecraftCharacterMiniGenerator.ts`
- `src/generators/minecraftCowCharacter/minecraftCowCharacterGenerator.ts`
- `src/generators/minecraftCreeperCharacter/minecraftCreeperCharacterGenerator.ts`
- `src/generators/minecraftEndermanCharacter/minecraftEndermanCharacterGenerator.ts`
- `src/generators/minecraftGolemCharacter/minecraftGolemCharacterGenerator.ts`
- `src/generators/minecraftMutantCharacter/minecraftMutantCharacterGenerator.ts`
- `src/generators/minecraftPigCharacter/minecraftPigCharacterGenerator.ts`
- `src/generators/minecraftSquidCharacter/minecraftSquidCharacterGenerator.ts`
- `src/generators/minecraftUltimateBendable/minecraftUltimateBendableGenerator.ts`
- `src/generators/minecraftVillagerCharacter/minecraftVillagerCharacterGenerator.ts`
- `src/generators/minecraftWolfCharacter/minecraftWolfCharacterGenerator.ts`

**Step 1: Write failing compile by replacing one generator first**

```ts
generator.defineMinecraftSkinInput("Skin", {
  standardWidth: 64,
  standardHeight: 64,
  choices: [...],
  modelTypeInputId: "Skin Model Type",
});
```

**Step 2: Run type-check to verify migration path compiles for one file**

Run: `npm run types:check`
Expected: PASS for migrated file.

**Step 3: Migrate remaining generators with same contract**

Rules:
- Replace only `defineTextureInput(... enableMinecraftSkinInput: true ...)` with `defineMinecraftSkinInput(...)`.
- Preserve `standardWidth`, `standardHeight`, and `choices`.
- Set `modelTypeInputId` to generator’s existing model-type select id (commonly `"Skin Model Type"`; use generator-specific id where different).
- Leave `enableMinecraftSkinInput: false` texture inputs untouched.

**Step 4: Run lint + type-check after full migration**

Run: `npm run lint && npm run types:check`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/generators
git commit -m "refactor: migrate minecraft generators to minecraft skin input control"
```

### Task 9: Remove Legacy Flag and Final Cleanup

**Files:**
- Modify: `src/builder/modules/modelControls.ts`
- Modify: `src/builder/ui/controls/controls.tsx`
- Modify: `src/builder/ui/controls/textureControl.tsx`
- Modify: any generator files still referencing `enableMinecraftSkinInput`

**Step 1: Write failing check for stale references**

Run: `rg -n "enableMinecraftSkinInput|getModelSelectValue|getModelStringValue|setModelStringValue" src`
Expected: at least one hit before cleanup.

**Step 2: Remove stale API surface and references**

```ts
// modelControls.ts
export type TextureInputControlProps = {
  standardWidth: number;
  standardHeight: number;
  choices: string[];
};
```

Also remove stale props/plumbing from `controls.tsx` and `textureControl.tsx`.

**Step 3: Run stale-reference check again**

Run: `rg -n "enableMinecraftSkinInput|getModelSelectValue|getModelStringValue|setModelStringValue" src`
Expected: no results.

**Step 4: Run full verification**

Run: `npm run lint && npm run types:check && npm run build`
Expected: all PASS.

**Step 5: Commit**

```bash
git add src
git commit -m "refactor: remove legacy minecraft skin flag and coupling hooks"
```

### Task 10: Manual UI Verification and Handoff Notes

**Files:**
- Create: `docs/plans/2026-03-01-default-skin-ui-decoupling-verification.md`

**Step 1: Write manual verification checklist**

```md
- Select bundled preset (e.g., Alex) -> texture loads.
- Toggle model type Wide/Slim -> preset swaps variant.
- Upload custom skin -> texture updates.
- Toggle model type after upload -> texture remains unchanged.
- Fetch username skin -> texture updates.
- Toggle model type after fetch -> texture remains unchanged.
- Non-Minecraft texture controls still work as before.
```

**Step 2: Run app for manual checks**

Run: `npm run dev`
Expected: app boots; flows above are manually verifiable in migrated generators.

**Step 3: Capture results in verification doc**

```md
Result: PASS/FAIL per checklist item with generator names tested.
```

**Step 4: Final validation run**

Run: `npm run lint && npm run types:check && npm run build`
Expected: PASS.

**Step 5: Commit**

```bash
git add docs/plans/2026-03-01-default-skin-ui-decoupling-verification.md
git commit -m "docs: add decoupled default skin UI verification results"
```
