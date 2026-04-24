# Visual references

This directory holds **industry-standard reference images** for the symbols, markers, and drawing conventions that OpenPlans renders. They are the ground truth a screenshot is compared against during visual verification.

## Why this exists

Code review and compile-green are not proof that a rendered symbol is correct. Section-line arrows, elevation markers, grid heads, and similar glyphs all follow conventions that a developer may not have internalized. A committed reference image turns "looks right" into a concrete, repeatable check.

## Layout

Organize by feature area, mirroring `src/packages/openplans-core/src/`:

```
docs/references/
  datums/
    section-line/
      README.md          <-- cite source, describe what "correct" means
      ncs-example.png    <-- reference image (optional)
      expected.md        <-- ASCII or bullet description of the symbol
    elevation-marker/
    grid-line/
  shapes/
  layouts/
```

Each feature directory should contain:

- `README.md` citing the standard (NCS, AIA, ISO, office convention) and linking to the external source(s).
- Optionally one or more reference PNGs. Keep them small (≤ 200 KB) and checked in.
- `expected.md` describing, in words, the traits the OpenPlans render must satisfy — arrow direction, label layout, line weight, etc. This is what a reviewer (human or agent) checks the screenshot against.

## Workflow

When you add or change a datum / marker / symbol:

1. If a reference doesn't yet exist, add one under the appropriate subdirectory before or alongside the code change. A symbol with no reference has no definition of "correct."
2. Take the screenshot via the Playwright MCP (see `AGENTS.md` § Visual Verification).
3. Open both the screenshot and the reference side-by-side. Confirm each trait in `expected.md` is satisfied.
4. Cite the reference path in your handoff message.
