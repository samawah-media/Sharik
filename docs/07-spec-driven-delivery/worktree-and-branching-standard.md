# Worktree And Branching Standard

Date: 2026-06-28

## Official Name

The official English spelling for Arabic `شريك` is `Sharik`.

Use:

- Product/brand: `Sharik`
- Package/project slug: `sharik-platform`
- Worktree parent: `D:\code - projects\sharik-worktrees\`

Avoid new active paths or metadata using `shrek`, `sherk`, or `sharek`.

## Local Workspace Layout

Keep one primary repository checkout plus isolated worktrees:

```text
D:\code - projects\sharik-platform\
D:\code - projects\sharik-worktrees\
  f002-deliverables-core\
  f003-next-feature\
  merge-gate\
```

The existing legacy checkout paths can remain temporarily when they contain local changes or historical evidence. Do not delete or move a worktree with uncommitted changes.

## Branch Naming

Preferred branch names:

- Spec Kit branch when required: `002-deliverables-core`
- Feature branch alternative: `feat/f002-deliverables-core`
- Emergency/review branch: `review/f002-<purpose>`

Keep the feature ID visible in commits, PR titles, and evidence.

## Cleanup Rules

Use Git to remove worktrees:

```powershell
git worktree list
git status --short --branch
git branch -r --contains <commit>
git worktree remove <path>
git worktree prune
```

Only remove a worktree when all are true:

- `git status --short` is clean in that worktree.
- The relevant commit is contained in `origin/main` or the branch was intentionally preserved elsewhere.
- No active task, evidence capture, or review depends on files only present in that worktree.

Never remove the primary checkout while it has local changes.

## Current Cleanup Decision

As of 2026-06-28:

- The primary legacy checkout `D:\code - projects\shrek.platform` contains local changes and must not be moved automatically.
- Completed clean legacy worktrees can be removed after confirming they are contained in `origin/main`.
- Active F-002 work should be kept on `002-deliverables-core` and moved/recreated under `D:\code - projects\sharik-worktrees\f002-deliverables-core` after the branch is safely committed.

