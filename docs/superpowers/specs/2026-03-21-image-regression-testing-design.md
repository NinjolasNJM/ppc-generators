# Image Regression Testing Design

## Summary

This document proposes a first-pass image regression testing system for the papercraft generator project.

The goal is to detect visual regressions in generated papercraft template images during refactoring without relying on browser UI tests. The first implementation slice focuses on the example generator at `src/generators/example/exampleGenerator.ts`, but the design intentionally supports generators that render multiple pages.

## Goals

- Verify rendered papercraft output at the image level.
- Exercise the real generator script and drawing pipeline instead of the React UI.
- Keep the initial workflow simple and deterministic.
- Support strict pixel-for-pixel snapshot comparison.
- Allow intentional updates through an explicit snapshot refresh command.
- Shape the test harness around ordered page output so multi-page generators are supported by design.

## Non-Goals

- Testing browser UI behavior.
- Adding tolerant or fuzzy image comparison in v1.
- Covering many generators in the first slice.
- Building a full visual diff viewer before the basic harness is working.
- Refactoring the entire rendering stack into a public test API before the first regression test lands.

## Current Context

The existing rendering path already has a strong seam for internal testing:

- Generator scripts are executed through `runScript(...)`.
- Scripts render into a fresh `Model`.
- A `Model` accumulates one or more pages in `model.pages`.
- Each page owns a canvas representing the final printable page image.

This is a good fit for regression testing because it lets tests render the same output users ultimately export, while bypassing the UI layer completely.

The main gap is runtime compatibility. Today, the rendering stack depends on browser primitives such as `document.createElement("canvas")` and `new Image()`. Tests running in Node will need a small abstraction seam or test-only runtime implementation so the same renderer logic can execute without a browser.

## Proposed Approach

### 1. Add a Node-based render harness around the existing builder modules

Add a test-focused helper that renders a generator directly through the existing script pipeline:

1. Create a fresh `Values` instance.
2. Load declared generator images and textures into `Values`.
3. Seed input variables needed for the scenario under test.
4. Create a `Model`.
5. Execute the generator script with `runScript(...)`.
6. Read the resulting ordered page list from the rendered model.
7. Serialize each page canvas to PNG for assertion.

This keeps tests close to the real rendering behavior while avoiding browser-driven automation.

### 2. Introduce a small runtime seam for canvas and image creation

The first version should avoid broad renderer rewrites. Instead, introduce a narrow abstraction around:

- creating canvases
- creating images
- loading images from URLs or paths

App code can continue using the browser implementation. Tests can supply a Node-compatible implementation backed by a server-side canvas/image library.

This keeps the change set focused and reduces the chance of behavior drift between production rendering and test rendering.

### 3. Use strict PNG snapshots

Snapshot assertions should compare decoded PNG pixel data exactly, pixel-for-pixel with no tolerance.

This is appropriate for the internal render pipeline because:

- the purpose is regression detection in generated images
- the rendering path should be deterministic
- strict comparison gives the clearest signal when a refactor changes layout, cropping, rotation, fold overlays, or composition

The comparison should be based on decoded image pixels rather than raw file bytes so the test focuses on visual output instead of PNG encoder details.

### 4. Support multi-page generators by API shape

Even though the example generator currently renders a single page, the harness should return an ordered page collection from the beginning.

That means:

- tests define the expected number of pages
- snapshots are stored with page-specific names such as `page-1.png`, `page-2.png`
- a mismatch in page count fails the test immediately

This keeps the pilot small while avoiding a single-page assumption that would be expensive to unwind later.

## Initial Test Scope

The first implementation slice should only cover the example generator.

Proposed scenarios:

- default skin with `Show Folds = true`
- default skin with `Show Folds = false`

Both scenarios should use stable fixture assets so the snapshot output is deterministic.

The test does not need to generalize to every generator in the first iteration, but the helper APIs should make later expansion straightforward.

## Developer Workflow

Add an explicit regression workflow:

1. Run `npm run test:images`
2. If rendered output differs from the stored snapshots, the test fails
3. If the change is intentional, run `npm run test:images:update`
4. Review the updated PNG files in git

Important behavior:

- normal test runs must never silently rewrite snapshots
- missing snapshots should fail clearly instead of auto-creating files
- snapshot refresh should be an explicit command

## Snapshot And Artifact Layout

The exact folder structure can be finalized during implementation, but the design should support:

- checked-in expected snapshots
- generated `actual` output when a test fails or when snapshots are refreshed
- page-oriented naming

One reasonable structure is a top-level image regression test directory with per-generator, per-scenario folders.

Example naming shape:

- `example/default-folds-on/page-1.png`
- `example/default-folds-off/page-1.png`

If helpful during implementation, failure artifacts can also include an `actual` folder or similarly named output location. A dedicated visual diff PNG is optional for v1.

## Required Code Changes

### Test runner and scripts

Add a lightweight TypeScript-friendly test runner, likely Vitest, plus scripts such as:

- `test:images`
- `test:images:update`

### Runtime abstraction

Introduce a minimal seam around browser-only image and canvas creation so tests can run the renderer in Node.

### Render harness

Add a helper that:

- loads generator assets
- seeds variables
- executes the generator script
- returns ordered page PNG outputs

### Example generator regression tests

Add the first test file for the example generator using the two approved scenarios.

### Documentation

Add a short contributor-facing explanation covering:

- what the tests protect
- how to run them
- how to refresh snapshots intentionally

## Error Handling Expectations

The harness and tests should fail with clear messages when:

- a generator asset cannot be loaded
- a required snapshot file is missing
- rendered page count differs from expected
- a snapshot comparison fails

The failure output should make it easy to identify which generator, scenario, and page failed.

## Testing Strategy

The regression tests should validate:

- page count
- page ordering
- exact rendered PNG content for each page

This complements, rather than replaces, lower-level unit tests. The main purpose here is to catch visual regressions that are hard to detect from command-level assertions alone.

## Risks And Constraints

### Node canvas/runtime setup

The biggest implementation risk is choosing and wiring a Node-compatible canvas/image runtime that behaves consistently enough for strict snapshots.

This should be treated as the first implementation decision gate. The plan should begin by selecting and validating one Node runtime for both local development and CI before the harness work continues. If the first candidate proves unstable or difficult to install in CI, the implementation should stop and switch to the fallback candidate rather than continuing with an uncertain rendering backend.

### Asset loading differences

Generators currently import assets in a way that works in the Next.js app. Tests may need a stable way to resolve those assets for Node-based rendering.

### Runtime consistency

If the server-side canvas runtime behaves differently from the browser in subtle ways, strict snapshots could become noisy. The first implementation should choose one deterministic runtime and document it clearly.

## Recommendation

Implement the first slice as a Node-based internal render harness around the existing generator pipeline, using strict page PNG snapshots for the example generator only.

This gives the project a high-signal regression safety net quickly, without prematurely expanding into UI testing, fuzzy comparisons, or a larger rendering refactor.

## Open Follow-Ups

These items are intentionally deferred until after the first slice is working:

- broader generator coverage
- optional diff image generation
- friendlier test authoring utilities
- CI integration details
- possible extraction of a cleaner public render API shared by the app and tests
