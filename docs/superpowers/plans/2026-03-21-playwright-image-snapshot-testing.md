# Playwright Image Snapshot Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the project's first real browser-based image snapshot tests using Playwright Test against the live `/generator/example` page.

**Architecture:** Replace the Vitest browser-mode testing path with Playwright Test as the automated runner. Use Playwright's built-in web server support to start the real Next.js app, navigate directly to `/generator/example`, and capture snapshots of the rendered output region. Playwright CLI remains a companion debugging tool, not the checked-in test runner.

**Tech Stack:** Next.js, React, TypeScript, Playwright Test, Playwright CLI

---

## File Map

- Modify: `package.json`
  Responsibility: add Playwright scripts and remove or stop relying on the current Vitest browser-entrypoint for this feature path.
- Modify: `package-lock.json`
  Responsibility: lock the Playwright testing dependency graph.
- Create: `playwright.config.ts`
  Responsibility: define browser config, base URL, web server startup, and snapshot behavior.
- Create: `tests/generators/exampleGenerator.spec.ts`
  Responsibility: drive the real generator route and assert the example generator screenshots.
- Modify: `src/generators/generators.ts`
  Responsibility: expose the example generator outside production.
- Modify: `src/builder/ui/pages/pages.tsx`
  Responsibility: add a stable selector for the rendered generator output region if needed.
- Modify: `README.md`
  Responsibility: document how to run and update the Playwright image tests and where Playwright CLI fits.

## Scope Note

This plan replaces the earlier Vitest browser-mode approach for the browser-testing path. Existing exploratory Vitest work in the branch should be treated as superseded unless it remains useful for non-browser support work. The automated image snapshot path should converge on Playwright Test only.

### Task 1: Add Playwright Test Infrastructure

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `tests/generators/exampleGenerator.spec.ts`

- [ ] **Step 1: Write the failing Playwright smoke test**

Create `tests/generators/exampleGenerator.spec.ts` with a minimal route smoke test:

```ts
import { expect, test } from '@playwright/test';

test('example generator route loads', async ({ page }) => {
  await page.goto('/generator/example');
  await expect(page.getByRole('heading', { name: 'Example' })).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted test to verify Playwright is not configured yet**

Run: `npx playwright test tests/generators/exampleGenerator.spec.ts`
Expected: FAIL because Playwright Test and config are not set up yet.

- [ ] **Step 3: Add Playwright Test dependencies and scripts**

Update `package.json` with the minimal browser-testing scripts, for example:

```json
{
  "scripts": {
    "test:images": "playwright test tests/generators",
    "test:images:update": "playwright test tests/generators --update-snapshots"
  },
  "devDependencies": {
    "@playwright/test": "..."
  }
}
```

Do not keep Vitest in the browser-testing path.

- [ ] **Step 4: Add Playwright config with real app startup**

Create `playwright.config.ts` that:

- starts the Next.js app with Playwright `webServer`
- uses `http://127.0.0.1:3000` as `baseURL`
- runs Chromium for the initial slice
- keeps the configuration minimal and focused on image regression tests

Use the real app route directly. Do not introduce iframe harnesses or proxy shims.

- [ ] **Step 5: Install browsers if required and run the targeted test again**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: FAIL later in the app flow, ideally because the generator is hidden or the assertion is incomplete, not because Playwright itself is missing.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/generators/exampleGenerator.spec.ts
git commit -m "test: add playwright image test infrastructure"
```

### Task 2: Expose the Example Generator Outside Production

**Files:**
- Modify: `src/generators/generators.ts`
- Modify: `tests/generators/exampleGenerator.spec.ts`

- [ ] **Step 1: Tighten the failing route smoke test**

Update the test so it clearly proves the route resolves:

```ts
test('example generator route resolves', async ({ page }) => {
  await page.goto('/generator/example');
  await expect(page.getByText('Generator not found')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Example' })).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted test to verify the current gate fails**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: FAIL because the example generator is still hidden by the current production/development gate.

- [ ] **Step 3: Implement the non-production gate**

Update `src/generators/generators.ts` so the example generator appears whenever the environment is not production. Keep the intent obvious:

```ts
const isProductionEnvironment = process.env.NODE_ENV === 'production';

export const test: GeneratorDef[] = isProductionEnvironment ? [] : [exampleGenerator];
```

- [ ] **Step 4: Run the targeted test to verify the route now resolves**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: PASS for route resolution, or fail later on the screenshot-target task.

- [ ] **Step 5: Commit**

```bash
git add src/generators/generators.ts tests/generators/exampleGenerator.spec.ts
git commit -m "test: expose example generator outside production"
```

### Task 3: Add a Stable Output Selector

**Files:**
- Modify: `src/builder/ui/pages/pages.tsx`
- Modify: `tests/generators/exampleGenerator.spec.ts`

- [ ] **Step 1: Write the failing output-target test**

Update the test to wait for the rendered output region:

```ts
test('example generator renders output', async ({ page }) => {
  await page.goto('/generator/example');
  await expect(page.getByTestId('generator-page-image')).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted test to verify the selector does not exist yet**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: FAIL because the output region does not yet expose a stable selector.

- [ ] **Step 3: Add a stable selector to the rendered output**

Modify `src/builder/ui/pages/pages.tsx` to add a small stable selector to the output image or its immediate screenshot container:

```tsx
<img
  data-testid="generator-page-image"
  ...
/>
```

If a containing element is a better screenshot target, add a selector there instead.

- [ ] **Step 4: Run the targeted test to verify the output target is reliable**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: PASS for route resolution and output visibility.

- [ ] **Step 5: Commit**

```bash
git add src/builder/ui/pages/pages.tsx tests/generators/exampleGenerator.spec.ts
git commit -m "test: add stable selector for generator output"
```

### Task 4: Add the First Failing Screenshot Assertions

**Files:**
- Modify: `tests/generators/exampleGenerator.spec.ts`

- [ ] **Step 1: Write the two screenshot scenarios**

Replace the visibility-only test with two image assertions:

```ts
test('example generator matches the default screenshot', async ({ page }) => {
  await page.goto('/generator/example');
  const output = page.getByTestId('generator-page-image');
  await expect(output).toHaveScreenshot('example-default-folds-on.png');
});

test('example generator matches the folds-off screenshot', async ({ page }) => {
  await page.goto('/generator/example');
  await page.getByText('Show Folds').click();
  const output = page.getByTestId('generator-page-image');
  await expect(output).toHaveScreenshot('example-default-folds-off.png');
});
```

Adjust the exact locator for the toggle if the label click is not reliable. Keep the target scoped to the rendered output region only.

- [ ] **Step 2: Run the targeted test to verify snapshots are missing**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: FAIL because the baseline screenshots do not exist yet.

- [ ] **Step 3: Make the wait conditions deterministic**

Before generating baselines, make sure the test waits for the output region to be visibly ready and updated after toggling `Show Folds`. Do not use arbitrary delays.

- [ ] **Step 4: Re-run the targeted test to confirm the only remaining failure is missing snapshots**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: FAIL only on missing or unmatched screenshots.

- [ ] **Step 5: Commit**

```bash
git add tests/generators/exampleGenerator.spec.ts
git commit -m "test: add example generator screenshot assertions"
```

### Task 5: Generate and Verify Baseline Screenshots

**Files:**
- Create: Playwright snapshot files for `tests/generators/exampleGenerator.spec.ts`
- Test: `tests/generators/exampleGenerator.spec.ts`

- [ ] **Step 1: Generate the initial approved screenshots**

Run: `npm run test:images:update -- tests/generators/exampleGenerator.spec.ts`
Expected: PASS and create baseline snapshots for:

- default example render
- folds-off example render

- [ ] **Step 2: Verify normal runs pass without updates**

Run: `npm run test:images -- tests/generators/exampleGenerator.spec.ts`
Expected: PASS with both screenshot assertions matching the new baselines.

- [ ] **Step 3: Run the broader image test command**

Run: `npm run test:images`
Expected: PASS for the current image regression suite.

- [ ] **Step 4: Inspect git status for expected artifacts only**

Run: `git status --short`
Expected: only intended snapshot artifacts and source changes are present.

- [ ] **Step 5: Commit**

```bash
git add tests/generators
git commit -m "test: add example generator image snapshots"
```

### Task 6: Document the Workflow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add minimal contributor docs**

Update `README.md` with a short section covering:

- what the image snapshot tests verify
- how to run `npm run test:images`
- how to run `npm run test:images:update`
- that Playwright CLI is useful for debugging and selector exploration, but not the committed runner

Suggested content:

```md
## Image Snapshot Tests

Run `npm run test:images` to verify Playwright screenshot baselines.

If an intentional rendering change updates output, run `npm run test:images:update` and review the changed snapshot files before committing them.

Playwright CLI can help inspect pages and selectors while authoring tests, but the checked-in regression suite uses Playwright Test.
```

- [ ] **Step 2: Run verification after the docs change**

Run:

```bash
npm run test:images
git diff -- README.md
```

Expected: tests still PASS and the docs diff is limited to the new instructions.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add playwright image testing workflow"
```

### Task 7: Final Verification and Cleanup

**Files:**
- Verify: `package.json`
- Verify: `playwright.config.ts`
- Verify: `src/generators/generators.ts`
- Verify: `src/builder/ui/pages/pages.tsx`
- Verify: `tests/generators/exampleGenerator.spec.ts`
- Verify: `README.md`

- [ ] **Step 1: Run the full verification set**

Run:

```bash
npm run test:images
npm run types:check
```

Expected: PASS for the Playwright image suite and PASS for TypeScript checks.

- [ ] **Step 2: Remove superseded browser-test artifacts if they are no longer needed**

Inspect and clean up obsolete Vitest browser-mode files only if they are truly superseded by the Playwright path. This may include:

- `vitest.config.ts`
- `tests/generators/setup.ts`
- any old Task 1-only Vitest smoke files or artifact folders

Do not remove anything blindly. Verify each file is genuinely obsolete before deleting it.

- [ ] **Step 3: Review the final diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: the final diff reflects the Playwright-based testing architecture, the non-production generator gate, the stable selector, documentation, and the checked-in example snapshots.

- [ ] **Step 4: Create the final implementation commit if any staged changes remain**

```bash
git add package.json package-lock.json playwright.config.ts src/generators/generators.ts src/builder/ui/pages/pages.tsx tests/generators README.md
git commit -m "test: add playwright image snapshot testing"
```

Skip this step if the prior task-level commits already leave the branch clean.
