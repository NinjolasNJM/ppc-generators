# Generators-Only Security Upgrade Plan

This plan covers the vulnerable packages that currently exist in `pixel-papercraft-generators` but do not exist in `pixel-papercraft-v2`.

## Progress

- [x] Upgrade `vite`
- [x] Replace or upgrade `ts-node`
- [ ] Upgrade `jimp`

## Scope

Packages in scope:

- `jimp`
- `@jimp/custom`
- `@jimp/core`
- `file-type`
- `load-bmfont`
- `phin`
- `min-document`
- `diff`
- `vite`

Current dependency paths:

- `jimp` -> `@jimp/custom` -> `@jimp/core` -> `file-type`
- `jimp` -> `@jimp/plugin-print` -> `load-bmfont` -> `phin`
- `jimp` -> `@jimp/plugin-print` -> `load-bmfont` -> `xhr` -> `global` -> `min-document`
- `ts-node` -> `diff`
- `vite` and `vitest` -> `vite`

## Strategy

Work on one upgrade at a time. After each step:

1. Update the package.
2. Regenerate the lockfile with `npm install`.
3. Run targeted validation.
4. Re-run `npm audit`.
5. Commit only that upgrade if it passes.

Do not combine these upgrades into one dependency sweep. `jimp` is the highest-risk migration because it is a major-version jump and touches local texture-generation code.

## Upgrade Order

### 1. Upgrade `vite`

- [x] Package updated
- [x] Lockfile regenerated
- [x] Validation completed
- [x] `npm audit` confirmed clean for `vite`
- [x] Changes committed

Goal:

- Remove the direct `vite` advisory without affecting runtime app dependencies.

Why first:

- Smallest likely blast radius.
- Only affects the test/tooling path.

Tasks:

- [ ] Bump `vite` to a non-vulnerable version.
- [ ] Confirm `vitest` still resolves cleanly against that `vite` version.
- [ ] Run the relevant Vitest command set used in this repo.

Validation:

- [x] `npm audit` no longer reports `vite`.
- [x] `vitest` still starts and runs successfully.

Risk:

- Low.

### 2. Replace or upgrade `ts-node`

- [x] Package updated or replaced
- [x] Lockfile regenerated
- [x] Validation completed
- [x] `npm audit` confirmed clean for `diff`
- [ ] Changes committed

Goal:

- Remove the `diff` advisory introduced by `ts-node`.

Why second:

- The dependency is only used by the `makeTextures` script.
- The migration can likely be isolated to one package script and one tool path.

Risk assessment:

- Risk class: `lint/tooling`
- Upgrade size: `minor` dependency swap
- Assumptions:
  - `makeTextures` only needs direct TypeScript execution and does not rely on `ts-node`-specific runtime hooks.
  - The repo's existing `types:check`, `lint`, and `build` commands are sufficient default gates for this tooling change.

Release-note review summary:

- `ts-node` upstream's latest stable release is still `10.9.2`, so there is no newer stable line to upgrade to for removing `diff`.
- `tsx` upstream documents itself as a drop-in TypeScript execution tool for Node.js scripts, which matches this repo's `npm run makeTextures` use case.
- `tsx` does not perform type checking itself, so the repo must keep explicit TypeScript verification via `tsc`.

Supply-chain notes:

- Replacing `ts-node` removes the direct `ts-node` -> `diff` path currently present in the lockfile.
- `tsx` uses `esbuild` under the hood, so lockfile review should confirm the swap stays scoped to the runner change.

Tasks:

- [x] Check whether a safe `ts-node` release removes `diff`.
- [x] Replace `ts-node` with `tsx` for `src/tools/makeTextures/makeTextures.ts`.
- [x] Remove stale `ts-node` configuration from `tsconfig.json` if it becomes unused.
- [x] Confirm the `makeTextures` script still runs.
- [x] Override `postcss-load-config` to `^6.0.1` so Tailwind's optional config loader no longer installs `ts-node`.

Validation:

- [x] `npm audit` no longer reports `diff`.
- [x] `npm run makeTextures ...` still works with a direct invocation path.
- [x] `npm run types:check`
- [x] `npm run lint`
- [x] `npm run build`

Execution notes:

- Replaced the root `makeTextures` runner from `ts-node` to `tsx`.
- Removed the unused `ts-node` block from `tsconfig.json`.
- Added a scoped `overrides.postcss-load-config` entry to move Tailwind's transitive config loader from `4.0.2` to `6.0.1`.
- Confirmed the installed dependency graph changed from `postcss-load-config -> ts-node -> diff` to `postcss-load-config -> tsx`.
- `npm audit` no longer reports `diff`; total audit findings dropped from 23 to 22.
- `npm run makeTextures` exits cleanly under `tsx` and prints the expected usage message when invoked without arguments.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run types:check` passed after the successful build populated `.next/types`; this command is sensitive to whether those generated files already exist.

Lockfile and diff assessment:

- Lockfile churn stayed scoped to the intended tooling path:
  - removed `ts-node`, `diff`, and their transitive support packages
  - added `tsx`, `esbuild`, and the `postcss-load-config@6.0.1` override path
- No runtime application dependency upgrades were introduced outside the affected tooling/config-loader chain.

Outcome:

- `safe to keep`

Residual risks:

- `postcss-load-config@6.0.1` raises its Node engine floor to `>=18`, which is compatible with this repo's declared Node `22.x`.
- `npm run types:check` depends on generated `.next/types` files and may fail if run before a build creates them; this appears to be a pre-existing repo quirk rather than a change introduced by this upgrade.

Risk:

- Low to medium.

### 3. Upgrade `jimp`

- [x] Package updated
- [x] Lockfile regenerated
- [x] Validation completed
- [ ] `npm audit` confirmed clean for the `jimp` chain
- [ ] Changes committed

Goal:

- Remove the `jimp` family of advisories:
  - `jimp`
  - `@jimp/custom`
  - `@jimp/core`
  - `file-type`
  - `load-bmfont`
  - `phin`
  - `min-document`

Why last:

- This is a major-version upgrade.
- The repo has custom code under `src/tools/makeTextures/` that depends on `jimp` APIs.

Risk assessment:

- Risk class: `rendering/output`
- Upgrade size: `major`
- Current version: `0.22.12`
- Target version: `1.6.0`
- Coupled packages:
  - none directly in `package.json`; the `@jimp/*` family will move transitively with `jimp`
- Assumptions:
  - The repo only uses `jimp` in `src/tools/makeTextures/utils.ts`.
  - The narrowest meaningful regression check is to run `npm run makeTextures` against a small local PNG directory and inspect the generated `.png`, `.json`, and `.ts` outputs.

Release-note review summary:

- Upstream `jimp` latest npm release is `1.6.0`.
- Jimp's v1 migration guide documents three changes that affect this repo directly:
  - the package switched from a default export to a named `Jimp` export
  - the constructor now takes an options object like `{ width, height }`
  - async export methods were renamed, including `writeAsync` -> `write`
- Jimp v1 also standardized many positional APIs to options objects, which raises output-risk if any local image operations beyond construction and writing need adaptation.
- The `v1.4.0` and `v1.6.0` release notes mostly describe additive fixes and decoder-option support rather than new breaking migration steps; the dominant upgrade risk remains the v0 -> v1 API transition.

Supply-chain notes:

- The vulnerable `0.22.x` line currently brings in the legacy `@jimp/custom`, `@jimp/core`, `file-type`, `load-bmfont`, `phin`, and `min-document` paths called out by `npm audit`.
- Moving to the maintained `1.x` line should replace that legacy transitive chain with the current `@jimp/*` package family.
- Lockfile review must confirm the old vulnerable chain is removed rather than duplicated.

Known touch points:

- `src/tools/makeTextures/utils.ts`

Tasks:

- [ ] Upgrade `jimp` to a non-vulnerable release.
- [ ] Fix any import or constructor API changes in the texture tool.
- [ ] Re-test image reading, canvas creation, blitting, and file output.
- [ ] Confirm generated output is still structurally correct.

Validation:

- [ ] `npm audit` no longer reports the `jimp` dependency chain.
- [x] `npm run makeTextures ...` completes successfully.
- [x] Generated `.png`, `.json`, and `.ts` outputs still match expected structure.
- [x] `npm run types:check`
- [x] `npm run lint`
- [x] `npm run build`

Planned gates:

- Mandatory defaults:
  - `npm run types:check`
  - `npm run lint`
  - `npm run build`
- Targeted output gate:
  - run `npm run makeTextures <id> <sourceDir>` against a small checked-in PNG directory
  - inspect the generated `.png`, `.json`, and `.ts` files for expected structure
  - re-run `npm audit`

Execution notes:

- Updated `jimp` from `0.22.12` to `1.6.0`.
- Migrated `src/tools/makeTextures/utils.ts` to the v1 API:
  - default import -> named `Jimp` import
  - callback constructor -> `new Jimp({ width, height })`
  - `writeAsync(...)` -> `write(...)`
  - adapted `blit` calls to the v1 options-object form
  - tightened the generated PNG path type to satisfy Jimp v1's typed `write()` signature
- Verified the texture tool against `src/generators/minecraftCreeper/textures` using `npm run makeTextures jimp-upgrade-smoke ...`.
- The smoke test generated the expected `texture_jimp_upgrade_smoke.png`, `.json`, and `.ts` artifacts, then those temporary files were removed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run types:check` passed after the successful build regenerated `.next/types`; running `tsc` before that still hits the repo's existing missing-generated-types quirk.
- `npm audit` still reports the `jimp` chain because `jimp@1.6.0` currently resolves `file-type@16.5.4`, and npm flags `file-type` versions through `21.3.0` for `GHSA-5v7r-6r5c-r473`.

Commands run:

- `npm install --save-dev jimp@1.6.0`
- `npm run makeTextures jimp-upgrade-smoke src/generators/minecraftCreeper/textures`
- `npm run lint`
- `npm run build`
- `npm run types:check`
- `npm audit`

Lockfile and diff assessment:

- Diff stayed scoped to the intended package and migration surface:
  - `package.json`
  - `package-lock.json`
  - `src/tools/makeTextures/utils.ts`
  - this plan file
- The legacy vulnerable transitive path called out in the original plan was removed from the lockfile:
  - `@jimp/custom`
  - `load-bmfont`
  - `phin`
  - `min-document`
- The new lockfile now resolves the maintained `jimp@1.6.0` / `@jimp/*@1.6.0` family instead.
- Residual security churn remains because the current upstream `jimp` release still depends on a vulnerable `file-type` major line.

Outcome:

- `safe with follow-up`

Residual risks:

- The upgrade is functionally validated in this repo, but it does not fully satisfy the original security goal because `npm audit` still reports the `jimp` chain via `file-type@16.5.4`.
- Resolving the remaining advisory likely requires one of:
  - an upstream `jimp` release that moves off the vulnerable `file-type` range
  - a separately approved override experiment to a newer `file-type` major, with dedicated compatibility testing
  - replacing `jimp` for this tool if the upstream dependency does not move soon

Risk:

- Medium to high.

## Suggested Acceptance Criteria Per Upgrade

- `package.json` and `package-lock.json` only include the intended package change.
- `npm audit` shows the targeted advisory removed.
- The repo still passes the targeted validation for the changed tool.
- No unrelated dependency upgrades are bundled into the same commit.

## Notes

- The remaining shared vulnerabilities should be handled separately so the generators-only work stays easy to review.
- If `jimp` migration turns out to be disproportionately expensive, evaluate whether the texture-generation tool should move to a different image library instead of forcing compatibility work.
