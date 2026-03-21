# Playwright Image Snapshot Testing Design

## Summary

This document replaces the earlier Vitest browser-mode testing direction with a Playwright-first browser testing approach.

The goal is to add the project's first automated image snapshot tests using the real Next.js application routes directly. The first implementation slice focuses on the example generator at `src/generators/example/exampleGenerator.ts`, and uses Playwright Test as the checked-in test runner. Playwright CLI is treated as a complementary browser-control tool for investigation and debugging, not as the primary automated test runner.

## Goals

- Add the project's first automated test framework for browser-based image regression checks.
- Use Playwright Test for checked-in browser automation and screenshot assertions.
- Drive the real Next.js application URL directly instead of using a browser-test harness shim.
- Start with one generator as a foundation: the example generator.
- Exercise the actual generator page and actual browser controls.
- Keep the first workflow deterministic, reviewable, and easy to extend.

## Non-Goals

- Using Vitest browser mode for browser automation.
- Building a custom Node rendering harness.
- Covering all generators in the first iteration.
- Testing every input type or generator variant in the first slice.
- Building a separate visual diff product beyond Playwright's baseline screenshot flow.

## Current Context

The application already has a direct browser route for generators:

- `src/app/generator/[generatorId]/page.tsx` is a thin route.
- `src/ui/pages/generatorPage.tsx` resolves the generator and renders the shared generator UI.
- `src/builder/ui/generator.tsx` loads resources, creates the model, runs the script, and renders controls and pages.
- `src/builder/ui/pages/pages.tsx` exposes the rendered page image as an `<img>` sourced from the internal canvas.

This is exactly the route we want to test.

The prior Vitest browser-mode attempt surfaced an important constraint: Vitest browser mode is not a good fit for directly navigating to and asserting against the live Next.js app URL. That added unnecessary harness complexity and made route-level assertions awkward.

Playwright Test removes that mismatch by letting the test runner navigate directly to the real application URL with first-class browser automation and screenshot assertions.

## Approaches Considered

### 1. Recommended: Playwright Test for the automated suite, Playwright CLI as a companion tool

Use Playwright Test for checked-in tests and baseline screenshots. Use Playwright CLI for exploration, debugging, selector discovery, and interactive validation while developing tests.

Why this is recommended:

- direct navigation to the real app URL
- first-class screenshot testing support
- built-in web server orchestration for Next.js
- no browser-mode harness needed
- Playwright CLI still adds value as an agent-friendly debugging tool

Trade-offs:

- introduces the Playwright test stack instead of Vitest
- browser test setup now lives in Playwright config rather than Vitest config

### 2. Playwright Test only

Use Playwright Test for everything and do not add Playwright CLI to the project workflow.

Trade-offs:

- simplest implementation
- misses the agent-friendly CLI workflow that could help with ongoing debugging and exploration

### 3. Playwright CLI only

Use only CLI commands and custom scripts for browser automation and screenshot comparison.

Trade-offs:

- good for ad hoc automation
- poor fit for maintainable checked-in regression tests
- would recreate features Playwright Test already provides

## Recommendation

Use Playwright Test as the automated runner and Playwright CLI as a supporting browser-control tool.

Specifically:

- add Playwright Test to the repository
- run the real Next.js app during tests using Playwright web server support
- navigate directly to `/generator/example`
- drive the actual browser controls on the page
- capture screenshots of the rendered generator output region
- keep the first implementation slice limited to the example generator

This gives the project a more natural and robust browser testing stack than the earlier Vitest browser-mode approach.

## Design

### Test runner and browser environment

Add Playwright Test as the main automated test runner.

The Playwright configuration should:

- start the Next.js app for the test run
- wait for the app to become available
- define a base URL for direct route navigation
- support screenshot snapshots through Playwright's built-in assertions

The result should be a self-contained command that a contributor can run without first starting the app manually.

### Playwright CLI role

Playwright CLI is not the checked-in regression runner. Instead, it is a development companion for:

- opening the app manually
- exploring selectors
- checking page state during debugging
- taking one-off screenshots while authoring tests

This keeps the automated test path stable while still making the CLI useful for iterative work.

### Generator availability rule

The example generator should be available in all non-production environments, not only when `NODE_ENV === "development"`.

The intent remains:

- visible in local development
- visible in automated tests
- hidden in production

The implementation should express that intent clearly.

### Screenshot target

The tests should snapshot the rendered generator output region, not the entire page.

That reduces noise from:

- headings
- navigation links
- control chrome outside the rendered output
- native browser UI differences on unrelated elements

If the current DOM does not provide a reliable output target, add a stable test-facing selector in the page rendering path.

### Initial scenarios

The first implementation slice should cover the example generator only, with two scenarios:

- default render with folds shown
- render after turning `Show Folds` off

These remain the right first scenarios because they are:

- deterministic
- visually meaningful
- easy to drive using the existing UI
- small enough to validate the full end-to-end workflow

### Browser interaction model

The tests should interact with the page as a user would:

- open `/generator/example`
- wait for the rendered output to appear
- capture the default screenshot
- toggle the `Show Folds` control
- wait for the rendered output to update
- capture the second screenshot

This keeps the tests close to real usage and avoids building custom internal state plumbing.

### Snapshot layout

Store snapshots in a structure that can grow with additional generators and scenarios.

The exact Playwright snapshot folder naming can follow Playwright conventions, but the scenario names should clearly reflect:

- generator id
- scenario
- output target or page

Even though the example generator is single-page, the naming should not assume that all future generators will remain single-page.

## Developer Workflow

The workflow should be explicit:

1. Run the Playwright image test command.
2. If snapshots differ from the checked-in baselines, the test fails.
3. If the change is intentional, run the Playwright snapshot update command.
4. Review the changed snapshot files in git.

Important behavior:

- normal test runs must not silently update baselines
- snapshot updates should be intentional
- failures should clearly identify the scenario that changed

Playwright CLI can be used alongside this flow for debugging, but it should not be the baseline update mechanism for checked-in tests.

## Required Code Changes

### Test tooling

Add:

- Playwright Test
- Playwright configuration
- scripts for running and updating image snapshot tests

### Generator registry rule

Adjust `src/generators/generators.ts` so the example generator is available outside production.

### Stable screenshot selector

If needed, add a stable selector to the rendered generator output region in `src/builder/ui/pages/pages.tsx`.

### Example screenshot test

Add the first Playwright test file covering:

- example generator default state
- example generator with folds disabled

### Contributor documentation

Add brief documentation explaining:

- what the screenshot tests cover
- how to run them
- how to update snapshots intentionally
- how Playwright CLI fits in as a debugging companion

## Error Handling Expectations

The test setup should fail clearly when:

- the app server does not start
- `/generator/example` does not resolve
- the rendered output target never appears
- the `Show Folds` control cannot be found
- a screenshot differs from the stored baseline

Failures should make it easy to identify whether the issue is app startup, route resolution, selector targeting, or image mismatch.

## Risks And Constraints

### Browser installation and CI environment

The biggest implementation risk is making sure Playwright browsers and config are installed consistently for local development and CI. The implementation should validate the browser setup early.

### Native browser UI variability

If screenshots accidentally include native file input controls or unrelated page chrome, they may become noisy across environments. The screenshot target must stay tightly scoped to the rendered generator output.

### Timing stability

The tests should wait for the rendered output to settle using real conditions tied to the page content, not arbitrary delays.

## Follow-Up Opportunities

After the first slice is working, likely next steps are:

- add more example-generator scenarios
- expand coverage to other generators in `src/generators`
- add helper utilities for shared generator interactions
- decide whether any non-browser checks should also use Vitest
- document a standard Playwright CLI debugging workflow for contributors
