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

- [ ] Package updated
- [ ] Lockfile regenerated
- [ ] Validation completed
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

Known touch points:

- `src/tools/makeTextures/utils.ts`

Tasks:

- [ ] Upgrade `jimp` to a non-vulnerable release.
- [ ] Fix any import or constructor API changes in the texture tool.
- [ ] Re-test image reading, canvas creation, blitting, and file output.
- [ ] Confirm generated output is still structurally correct.

Validation:

- [ ] `npm audit` no longer reports the `jimp` dependency chain.
- [ ] `npm run makeTextures ...` completes successfully.
- [ ] Generated `.png`, `.json`, and `.ts` outputs still match expected structure.

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
