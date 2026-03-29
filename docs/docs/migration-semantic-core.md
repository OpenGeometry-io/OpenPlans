---
sidebar_position: 5
---

# Migration Notes

## What changed

- OpenPlans no longer relies on a vendored `src/kernel` runtime path.
- The repo now consumes `opengeometry` as a package dependency.
- Local sibling development uses a packaged tarball build of `opengeometry`, not a directory link.
- Internal implementation is split into semantic core and Three/runtime workspaces.

## What stayed stable

- public package name: `@opengeometry/openplans`
- main runtime class: `OpenPlans`
- compatibility factories such as `wall2D`, `door2D`, and `singleWindow2D`

## Recommended direction

For new BIM/export workflows:

- prefer semantic document driven generation
- use the canonical IFC example as the reference flow
- treat visual wrappers as compatibility helpers, not as the long-term source of truth
