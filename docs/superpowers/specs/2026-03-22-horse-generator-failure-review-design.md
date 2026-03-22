# Horse Generator Failure Review Design

## Goal

Improve the failure-review experience for the `minecraftHorseGenerator` Playwright image snapshot tests so human reviewers see image diffs instead of a terminal dump of a base64 `src` string.

## Current Problem

The white-horse test in `tests/generators/minecraftHorseGenerator/minecraftHorseGenerator.spec.ts` checks that the image `src` changes after selecting "White Horse". Because the image is stored as a `data:image/png;base64,...` URL, a failure causes Playwright to print the full base64 string to the terminal. That output is noisy and prevents the screenshot assertion from becoming the primary failure mode.

When `toHaveScreenshot(...)` fails, Playwright already produces the useful reviewer artifacts we want:
- expected image
- actual image
- diff image

The test should fail there whenever possible.

## Design

### Test Behavior

- Remove the raw `src` string comparison from the white-horse test.
- Keep the selection interaction that chooses "White Horse".
- Rely on `toHaveScreenshot("minecraft-horse-white-page-1.png")` as the main visual assertion.

This makes visual regressions fail through Playwright's screenshot matcher, which produces human-reviewable PNG artifacts instead of dumping the full encoded image string.

### Reporting

- Keep Playwright's `html` reporter alongside the current terminal reporter.
- Keep the existing console output so local runs still show quick pass/fail feedback.
- Keep an npm script that serves the latest Playwright report for browser review.

This gives reviewers a predictable workflow:
1. Run the targeted image test.
2. Open or serve the Playwright HTML report.
3. Inspect expected, actual, and diff images for failures.

The canonical report artifact lives at `playwright-report/index.html`. The helper script may serve that report on a local URL, depending on environment support.

## Scope

This slice updates the horse generator test and uses the existing shared Playwright reporting configuration. It does not yet refactor the rest of the generator suite.

## Verification

- Run the horse generator image test.
- Use the branch's current default-horse screenshot mismatch as the intentional failure case.
- Confirm the white-horse test no longer fails with the large base64 `src` payload.
- Confirm the default-horse failure points reviewers to expected/actual/diff artifacts.
- Confirm Playwright writes an HTML report at `playwright-report/index.html`.
