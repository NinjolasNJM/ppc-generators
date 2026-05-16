# Project Context

This project is a papercraft template generator focused mainly on Minecraft-inspired designs.

It includes many generators that turn characters, creatures, items, and other game-themed subjects into printable paper templates. Many of these generators let a player use their own Minecraft skin to create unusual variants of themselves, such as creeper-themed or cow-themed versions.

# Agent Rules

- Always use the `gh` command for GitHub operations.
- After creating a new git worktree for this repo, run `npm install` and then `npm run setup` in the new worktree before running checks or making changes.

# Change Strategy

- Keep changes incremental and narrow in scope.
- Inspect the existing implementation and any related tests before editing code.
- Use a test-driven mindset for all work.
- Build a quality gate foundation as part of the change:
  - add or update tests before or alongside the implementation
  - verify the smallest relevant test set first
  - expand to broader checks when shared behavior changes
- When behavior can regress visually, add or extend a focused visual regression test before changing the implementation.
- Prefer the existing `testing` generator for Generator Builder features and other shared builder-level screenshot cases.
- Keep generator-specific visual regressions in the specific generator unless the behavior is genuinely shared across generators.
- Keep the testing board small and purposeful:
  - include a reference sheet or fixture page when useful
  - group common render cases together
  - add a rotation/flip matrix only when it meaningfully exercises the space
  - use density comparison pages for source-size behavior
- Use bitmap fixtures for visual tests when pixel accuracy matters; avoid text in screenshots unless the text itself is what you are testing.
- Add short code comments for board pages or other non-obvious test intent so future agents do not need to rediscover the rationale.
- Update the session handover notes when you learn a root cause, choose a testing strategy, or leave a follow-up for the next agent.
- Run the smallest relevant verification set first, then expand to the broader checks if the change touches shared behavior.
- Push back on multiple independent features in a single change.
  - Split unrelated generator work into separate PRs.
  - Split builder changes and new-generator work into separate PRs unless the builder change is fully proven by tests first and the follow-on generator change is clearly dependent.
  - If a request mixes unrelated work, propose the smallest safe slice and leave the rest for a follow-up PR.
