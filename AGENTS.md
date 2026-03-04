# OpenPlans Agent Operating Guide

## Purpose
This file defines the canonical operating contract for development agents in this repository.

## Source of Truth Order
1. `AGENTS.md` (this file)
2. `brain/README.md` and linked files under `brain/`
3. Legacy operational notes under `.agent/`

## Development Workflow
1. Research-first discovery for non-trivial tasks.
2. Write or update a project research note before implementation.
3. Implement with minimal, targeted changes.
4. Verify behavior and capture evidence in research notes.
5. Promote reusable conclusions into topic notes.

## Research Brain Contract
For every non-trivial task:
1. Start from an existing note or create a note in `brain/research/projects/...`.
2. Before final delivery, update `decisions` and `next_actions` in that note.
3. If findings are reusable, promote them into `brain/research/topics/...` and backlink from the project note.

## Research Naming Conventions
- Project notes: `YYYY-MM-DD--<slug>.md`
- Topic notes: `<topic>--<slug>.md`
- Experiment notes: `exp--YYYY-MM-DD--<slug>.md`
- Source notes: `src--<author-or-site>--<slug>.md`

## Practical Rules
- Keep claims evidence-backed with links to source notes.
- Keep one active cockpit note per project in `projects/<project>/_index.md`.
- Use `inbox/` for raw capture; triage daily.
- Keep research assets local-only (`brain/research/assets/` is git-ignored).

## Scope Guardrails
- This rollout changes process and documentation only.
- Do not treat research notes as runtime code or API changes.
