# Research Vault (Obsidian)

## Purpose
This vault is the canonical research workspace for OpenPlans development. It stores discovery, decisions, evidence, and implementation handoff notes used by humans and agents.

## Folder Map
- `_templates/`: reusable note templates.
- `inbox/`: quick capture notes before triage.
- `projects/`: project-specific research and active work threads.
- `topics/`: reusable knowledge that applies across projects.
- `assets/`: local media for notes (ignored by git).

## Note Naming Rules
- Project notes: `YYYY-MM-DD--<slug>.md`
- Topic notes: `<topic>--<slug>.md`
- Experiment notes: `exp--YYYY-MM-DD--<slug>.md`
- Source notes: `src--<author-or-site>--<slug>.md`

## Required Frontmatter Fields
Every structured note should include these YAML keys:
- `id`
- `title`
- `status`
- `created`
- `updated`
- `tags`
- `project`
- `topic`
- `sources`
- `decisions`
- `next_actions`

## Daily Workflow
1. Capture raw findings quickly in `inbox/`.
2. Triage notes into `projects/` or `topics/`.
3. Update project note `decisions` and `next_actions` before ending the session.
4. Link evidence sources in `sources` instead of keeping claims unreferenced.

## Weekly Review Workflow
1. Review `projects/*/_index.md` for active blockers and stale notes.
2. Promote reusable findings from `projects/` into `topics/`.
3. Merge duplicate notes and archive dead experiments.
4. Ensure each active project note has clear `next_actions`.
5. Refresh topic indexes with latest promoted notes.

## Obsidian Usage
Open `/Users/gangsta/Work/OpenGeometry/OpenPlans/brain/research` as an Obsidian vault.
No plugin is required. Templates are plain markdown files.
