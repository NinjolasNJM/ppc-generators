# Horse Generator Failure Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the horse generator image test failure experience so reviewers get screenshot diffs and an HTML report instead of a base64 terminal dump.

**Architecture:** Keep the horse test focused on user interaction plus screenshot verification. Move the review UX improvement into shared Playwright reporter configuration so later generator tests can benefit from the same workflow.

**Tech Stack:** Playwright Test, npm scripts, existing generator specs

---

### Task 1: Remove the noisy horse test assertion

**Files:**
- Modify: `tests/generators/minecraftHorseGenerator/minecraftHorseGenerator.spec.ts`
- Test: `tests/generators/minecraftHorseGenerator/minecraftHorseGenerator.spec.ts`

- [ ] **Step 1: Write the failing test**

The existing white-horse case already demonstrates the problem: it fails on the `src` polling assertion and prints the base64 payload.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:images -- tests/generators/minecraftHorseGenerator/minecraftHorseGenerator.spec.ts`
Expected: FAIL on the white-horse `src` polling assertion with a large `data:image/png;base64,...` payload in output.

- [ ] **Step 3: Write minimal implementation**

Remove:

```ts
const beforeSrc = await output.getAttribute("src");
await horseSelect.selectOption({ label: "White Horse" });
await expect.poll(async () => output.getAttribute("src")).not.toBe(beforeSrc);
```

Keep:

```ts
await horseSelect.selectOption({ label: "White Horse" });
await expect(output).toBeVisible();
await expect(output).toHaveScreenshot("minecraft-horse-white-page-1.png");
```

- [ ] **Step 4: Run test to verify the new failure mode**

Run: `npm run test:images -- tests/generators/minecraftHorseGenerator/minecraftHorseGenerator.spec.ts`
Expected:
- the white-horse test no longer fails on the `src` polling assertion
- the current default-horse mismatch still fails through `toHaveScreenshot(...)`
- the output points to expected/actual/diff artifacts instead of printing the full base64 image string for the white-horse path

- [ ] **Step 5: Commit**

```bash
git add tests/generators/minecraftHorseGenerator/minecraftHorseGenerator.spec.ts
git commit -m "test: simplify horse screenshot failure output"
```

### Task 2: Verify the reviewable HTML report workflow

**Files:**
- Verify: `playwright.config.ts`
- Verify: `package.json`

- [ ] **Step 1: Write the failing expectation**

The current workflow should expose a Playwright HTML report and a helper script for serving it.

- [ ] **Step 2: Verify reporter configuration**

Confirm Playwright reporters include:

```ts
reporter: [["list"], ["html", { open: "never" }]],
```

- [ ] **Step 3: Verify the npm helper script**

Confirm `package.json` includes:

```json
"test:images:report": "playwright show-report"
```

- [ ] **Step 4: Run targeted verification**

Run:
- `npm run test:images -- tests/generators/minecraftHorseGenerator/minecraftHorseGenerator.spec.ts`
- `find playwright-report -maxdepth 2 -type f`

Expected:
- test run emits normal console output
- Playwright writes `playwright-report/index.html`
- report data files exist for visual review assets
- if the local environment allows it, `npm run test:images:report` serves the latest report for browser review

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts package.json
git commit -m "test: verify playwright html report workflow"
```
