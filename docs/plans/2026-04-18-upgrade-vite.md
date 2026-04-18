# Upgrade vite

## Scope

- Package: `vite`
- Current version: `8.0.1`
- Target version: `8.0.8`
- Coupled packages: `none`
- Reason: `security`

## Risk Assessment

- Risk class: `build/config`
- Upgrade size: `patch`
- Key release-note findings:
  - `8.0.5` is the first patched release after the locally-audited vulnerable range `8.0.0` through `8.0.4`, including fixes for `server.fs` query bypass and optimized-deps sourcemap path traversal.
  - `8.0.6` through `8.0.8` add patch-level changes in optimizer behavior, CSS error handling, DNS handling, and SSR import/hoisting behavior.
  - `8.0.3` bumps `picomatch` from `4.0.3` to `4.0.4`, reducing related transitive risk in the Vite toolchain.
- Supply-chain notes:
  - No install or postinstall scripts were introduced by the package metadata review.
  - Node engine is unchanged at `^20.19.0 || >=22.12.0`, which is compatible with the repo's Node 22 setup.
  - Peer dependency surface is effectively unchanged except `esbuild` now allows `^0.28.0` in addition to `^0.27.0`.
  - Direct Vite dependencies remain the same package set; notable version shifts are `rolldown` `1.0.0-rc.10` to `1.0.0-rc.15` and `picomatch` `^4.0.3` to `^4.0.4`.
- Assumptions:
  - The repo's existing Vitest browser flow in `scripts/test-images.mjs` is the intended Vite-adjacent validation path even though there is no dedicated `npm` script for it.
  - This change should remain isolated to `vite` and its lockfile-resolved transitives without moving `vitest`.

## Planned Gates

- Mandatory defaults:
  - `npm run types:check`
  - `npm run lint`
  - `npm run build`
- Targeted gates:
  - `node scripts/test-images.mjs tests/imageRegression/example.spec.ts`
  - `npm audit --json`
- Baseline to capture before edit:
  - `none`

## Execution Notes

- Dependency changes made:
  - Updated `vite` from `^8.0.1` to `^8.0.8` in `package.json`.
  - Regenerated `package-lock.json`, which updated the expected Vite transitive chain including `rolldown` `1.0.0-rc.10` to `1.0.0-rc.15` and `picomatch` `4.0.3` to `4.0.4`.
- Commands run:
  - `npm audit --json`
  - `npm view vite version versions --json`
  - `gh api repos/vitejs/vite/contents/packages/vite/CHANGELOG.md --jq .content | tr -d '\n' | base64 --decode | sed -n '/## <small>\\[8.0.8\\]/,/## \\[8.0.0\\]/p'`
  - `npm view vite@8.0.1 engines peerDependencies dependencies optionalDependencies scripts --json`
  - `npm view vite@8.0.8 engines peerDependencies dependencies optionalDependencies scripts --json`
  - `npm install vite@8.0.8 --save-dev`
  - `git diff -- package.json package-lock.json`
  - `npm run lint`
  - `npm run build`
  - `npm run types:check`
  - `node scripts/test-images.mjs`
- Notable results:
  - Pre-upgrade audit reported `vite` advisories affecting `>=8.0.0 <=8.0.4`.
  - `8.0.8` is the latest published stable `8.0.x` release.
  - Post-upgrade audit no longer reports a `vite` vulnerability entry.
  - `npm run lint` passed.
  - `npm run build` passed.
  - `npm run types:check` passed after running it after `build`; when run before `build`, it fails because this repo includes `.next/types/**/*.ts` in `tsconfig.json`.
  - `node scripts/test-images.mjs` started the local Next server successfully but failed in Vitest with `No projects matched the filter "browser"`, which points to a repo-local Vitest configuration issue rather than a `vite` install failure.
- Lockfile/diff assessment:
  - Diff is scoped to `package.json` plus the Vite dependency subtree in `package-lock.json`.
  - No unrelated top-level packages moved.
- Outcome:
  - `safe with follow-up`
- Residual risks:
  - Patch releases in this span touch SSR and dev-server internals; build-time coverage is good, but the intended Vitest browser verification path is currently blocked by the repo's missing `browser` project configuration.
  - The `types:check` command is order-sensitive in this repo because it depends on generated `.next/types` files.
