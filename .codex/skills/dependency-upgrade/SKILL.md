---
name: dependency-upgrade
description: Use when updating npm packages with high-confidence verification, release-note review, risk-based gate selection, plan-file tracking, and strict no-commit/no-PR boundaries unless the user explicitly asks.
---

# Dependency Upgrade

Use this skill for dependency upgrades where the goal is to change the package and verify it with enough confidence to detect likely regressions before a human reviews the diff.

## Default Mode

By default, this skill should:

1. inspect the current dependency state
2. review release notes and changelog material from the current version to the target version
3. write a plan document under `docs/plans`
4. apply the dependency change
5. run risk-based verification
6. record the outcome in the plan
7. stop before any commit or PR creation

Do not commit changes.
Do not create a PR.
Only do either if the user explicitly asks.

Assume the user is responsible for preparing the environment before the upgrade. Work in the current branch unless the user asks otherwise.

## Goal

Make the package change with a high degree of confidence that it did not introduce regressions, not just enough confidence to edit `package.json`.

## Workflow

1. Confirm the target package, target version, and whether the change is a single package or a coupled set.
2. Inspect local package context before editing:
   - current version in `package.json`
   - current lockfile state
   - repo usage with `rg`
   - config files and scripts that mention the package
   - local git history for prior upgrade fixes, follow-ups, or reversions
3. Decide whether the upgrade should stay isolated or include tightly coupled packages:
   - upgrade companion packages together when release notes, peer dependency constraints, or repo conventions make isolated movement misleading or unsafe
   - avoid opportunistic version churn outside the intended package set
4. Review upstream changes from the current version through the target version:
   - fetch changelog and release notes for all relevant releases in the upgrade span
   - identify breaking changes, default changes, removals, migrations, engine shifts, peer dependency changes, ESM/CJS changes, install/build notes, and security-impact statements
5. Classify the upgrade risk based on both package role and release-note findings.
6. Create or update a plan file in `docs/plans` before editing.
7. Choose the smallest gate set that covers the affected surface, but always include the mandatory default gates if available:
   - type check
   - lint
   - build
8. If the change affects output-sensitive or behavior-sensitive areas, capture a small baseline before editing when the repo has an efficient way to do so.
9. Apply the dependency change and regenerate lockfile state intentionally.
10. Run the selected gates.
11. Review the resulting diff and lockfile churn for unexpected changes.
12. Record the outcome in the plan file and stop for human review.

## Mandatory Defaults

For non-trivial upgrades, run these by default if the repo provides them:

- type check
- lint
- build

Use the repo’s actual command names. Do not invent commands that are not present.

## Risk Model

Classify the change using the highest applicable risk level:

- `type-only`
- `lint/tooling`
- `build/config`
- `runtime`
- `rendering/output`
- `native/binary`
- `security-sensitive`

Also note upgrade size:

- `patch`
- `minor`
- `major`

Release notes can raise the effective risk above what the package category suggests. For example, a patch release with changed defaults or output generation behavior should be treated as higher risk.

## Gate Selection

Start with the mandatory defaults, then add targeted gates based on the affected surface.

`type-only`
- mandatory defaults are usually sufficient unless release notes indicate wider impact

`lint/tooling`
- mandatory defaults
- add the smallest relevant command that exercises the updated tooling path

`build/config`
- mandatory defaults
- add any config-specific or bundling-specific verification that the repo provides

`runtime`
- mandatory defaults
- add the smallest relevant runtime, integration, or end-to-end coverage for the affected area

`rendering/output`
- mandatory defaults
- add targeted regression checks against generated output
- prefer before/after comparison where the repo has snapshot, screenshot, PDF, SVG, PNG, or other artifact-sensitive checks

`native/binary`
- mandatory defaults
- add at least one real execution path that loads or exercises the dependency

`security-sensitive`
- mandatory defaults
- add any targeted checks needed to confirm the fix does not break usage
- confirm the vulnerability or advisory target is actually addressed

Prefer targeted verification over broad, expensive sweeps when the risk is localized. Expand the gate set when release notes, diff size, or package role suggest wider impact.

When a repo has an efficient regression mechanism, capture a narrow before/after baseline for:

- rendered output
- generated artifacts
- key CLI output
- error messages or warnings that are expected to remain stable

## Release-Note Review

Review release notes and changelog entries for every release from the current version to the target version, not just the destination release.

Look for:

- breaking changes
- changed defaults
- migration steps
- removed or renamed APIs
- config format changes
- engine and peer dependency shifts
- ESM/CJS packaging changes
- install-script or native-build changes
- security fixes and caveats
- output or rendering changes

Use this review to decide what verification is required. Do not treat release-note review as optional.

If a package does not provide usable release notes or changelog material and the upgrade is not trivial, raise that as a risk and ask the user before proceeding.

If release-note coverage is partial, say so explicitly in the plan and treat that uncertainty as part of the risk assessment.

## Supply-Chain Review

Perform a strict supply-chain review by default:

- inspect newly introduced transitive dependencies
- inspect install scripts and postinstall behavior when present
- inspect engine and peer dependency changes
- inspect package rename or scope changes
- inspect ownership or publisher changes when they are discoverable
- confirm security upgrades actually remove or reduce the targeted vulnerability

If anything about package provenance, ownership, install behavior, or dependency expansion looks unusual, stop and ask the user.

For security-motivated upgrades, distinguish between:

- vulnerability addressed with high confidence
- vulnerability likely addressed but not directly verifiable from local evidence
- unclear whether the vulnerability is actually addressed

Do not overstate confidence when advisories, release notes, and resolved dependency state do not line up cleanly.

## Lockfile And Diff Review

After the upgrade:

- confirm the lockfile churn is scoped to the intended package set
- inspect for unrelated dependency movement
- inspect for unexpected script, engine, or resolved-package changes
- inspect config changes required by the upgrade

If the lockfile churn is broader than expected and you cannot clearly explain it, stop and ask the user.

## Plan File

Create or update a plan document under `docs/plans` by default.

Use a date-prefixed filename with a concise slug, for example:

- `docs/plans/2026-04-18-upgrade-vite.md`

Before editing dependencies, record:

- package name
- current version
- target version
- coupled packages, if any
- risk classification
- release-note review summary
- planned gates
- explicit assumptions

After verification, append:

- commands run
- notable results
- lockfile/diff assessment
- outcome:
  - `safe to keep`
  - `safe with follow-up`
  - `defer`
- residual risks
- questions for the user if escalation is needed

Keep the plan concise but specific enough that a human reviewer can understand what was checked and why.

Use this template unless the repo already has a better established format:

```md
# Upgrade <package>

## Scope

- Package: `<package>`
- Current version: `<current>`
- Target version: `<target>`
- Coupled packages: `<none|list>`
- Reason: `<security|bugfix|alignment|maintenance>`

## Risk Assessment

- Risk class: `<type-only|lint/tooling|build/config|runtime|rendering/output|native/binary|security-sensitive>`
- Upgrade size: `<patch|minor|major>`
- Key release-note findings:
  - `<finding>`
  - `<finding>`
- Supply-chain notes:
  - `<note>`
  - `<note>`
- Assumptions:
  - `<assumption>`

## Planned Gates

- Mandatory defaults:
  - `<typecheck command>`
  - `<lint command>`
  - `<build command>`
- Targeted gates:
  - `<command or comparison>`
  - `<command or comparison>`
- Baseline to capture before edit:
  - `<none|baseline step>`

## Execution Notes

- Dependency changes made:
  - `<change>`
- Commands run:
  - `<command>`
  - `<command>`
- Notable results:
  - `<result>`
  - `<result>`
- Lockfile and diff assessment:
  - `<assessment>`

## Outcome

- Outcome: `<safe to keep|safe with follow-up|defer>`
- Residual risks:
  - `<risk>`
  - `<risk>`
- User follow-up needed:
  - `<none|question>`
```

## Stop Conditions

Stop and ask the user if you detect anything that materially increases the risk of a successful outcome, including:

- unexplained output diffs
- broad or unexpected lockfile churn
- flaky or failing checks
- missing or incomplete release notes for a non-trivial upgrade
- peer dependency conflicts
- engine incompatibilities
- new warnings in critical build or runtime paths
- suspicious package provenance or publisher changes
- added install scripts or unusual postinstall behavior
- required migrations that are not clearly safe to apply in the current task
- uncertainty about whether the security issue is actually fixed

Do not push past unresolved risk signals just to finish the upgrade.

## Repo Discovery

Discover the repo’s real verification commands before selecting gates.

Look for:

- package scripts in `package.json`
- CI workflow commands
- existing test, snapshot, screenshot, build, lint, and typecheck commands
- generator or artifact regression tests
- setup/bootstrap scripts required by the repo

Use the smallest command set that gives good coverage for the affected surface.

If the repo’s available checks are weaker than the upgrade risk suggests, note that gap clearly in the plan and final response.

## Local History Review

Use local history to understand repo-specific risk:

- `git log -- package.json package-lock.json`
- `git log -- <relevant config files>`
- `git show <commit>` for prior upgrade fixes or reverts

Prior upgrade breakages in the same package area should increase caution and may justify broader verification.

## Output Format

In the final response:

- summarize the version change
- summarize the release-note findings that affected the gate choice
- list the gates run
- state the outcome
- call out any residual risk or user decision needed

Be explicit about confidence level when evidence is incomplete.

Do not commit.
Do not open a PR.
