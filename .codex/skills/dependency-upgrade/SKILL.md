---
name: dependency-upgrade
description: Use when updating or aligning npm package versions in this repo, especially when changes need risk-based verification, changelog and usage review, targeted screenshot or build checks, and a short keep/defer decision record.
---

# Dependency Upgrade

Use this skill for package upgrades, version alignment, and dependency-risk review in this repository.

## Goal

Make package changes with enough confidence to keep them, not just enough confidence to edit `package.json`.

## Workflow

1. Confirm the target package, the source-of-truth version, and whether the change is a single package or a coupled set.
2. Review package context before editing:
   - inspect current version in `package.json` and lockfile
   - inspect repo usage with `rg`
   - inspect relevant config files
   - inspect local git history for prior upgrade fixes or reversions
   - inspect changelog or release notes when available
3. Classify the update risk:
   - `type-only`
   - `lint/tooling`
   - `build/config`
   - `runtime/UI`
   - `native/binary`
4. Choose the smallest gate set that covers the affected surface.
5. Apply the dependency change and regenerate lockfile state.
6. Run the selected gates.
7. Record the outcome as one of:
   - `safe to keep`
   - `safe with follow-up`
   - `revert or defer`

## Risk Matrix

`type-only`
- Default gates:
  - `npm run types:check`
  - `npm run lint`

`lint/tooling`
- Default gates:
  - `npm run lint`
  - `npm run types:check`
  - `npm run build`

`build/config`
- Default gates:
  - `npm run types:check`
  - `npm run lint`
  - `npm run build`
- Add a targeted runtime or screenshot check if the package affects generated CSS, bundling, or rendered output.

`runtime/UI`
- Default gates:
  - `npm run types:check`
  - `npm run lint`
  - `npm run build`
- Also run the smallest relevant Playwright generator coverage for the affected surface.

`native/binary`
- Default gates:
  - `npm run types:check`
  - `npm run lint`
  - `npm run build`
- Also exercise at least one real execution path that depends on the package.

## Changelog And History Review

Before changing versions, look for:

- breaking changes hidden in a minor or patch bump
- peer-dependency or engine shifts
- changed defaults
- config syntax changes
- install/build notes for native packages

Use local history first:

- `git log -- package.json package-lock.json`
- `git log -- <relevant config files>`
- `git show <commit>` for prior upgrade fixes

If online release notes are needed, use them to inform judgment, but do not treat them as a substitute for repo-specific impact analysis.

## Affected-Surface Review

Use `rg` to find:

- direct imports
- package mentions in config
- related build scripts
- screenshot tests or generators that would expose regressions

For rendering-sensitive changes, prefer a targeted before/after comparison over a broad test sweep.

## Decision Record

After each upgrade, add a short record to the active task or plan file with:

- package name and version change
- risk class
- gates run
- outcome:
  - `safe to keep`
  - `safe with follow-up`
  - `revert or defer`
- one short note on residual risk or why the gate set was sufficient

## Repo Notes

- This repo already has useful baseline gates:
  - `npm run types:check`
  - `npm run lint`
  - `npm run build`
  - `npm run test:generators`
  - `npm run test:generators:update`
- Screenshot tests live under `tests/generators`.
- After creating a new worktree for this repo, run `npm install` and then `npm run setup` before checks or edits.
