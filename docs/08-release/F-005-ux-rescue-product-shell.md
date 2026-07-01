# F-005 UX Rescue: Product Shell + UI System + Kanban Redesign

**Date**: 2026-07-01
**Branch**: `codex/f-005-ux-rescue-product-shell`
**Scope**: UX rescue only for current management pages and current Kanban board.

## What Changed

- Added a unified Arabic RTL management product shell with sidebar, top context bar, breadcrumbs, and bounded content area.
- Added local UI primitives: Button, Card, Badge, PageHeader, StatCard, EmptyState, ErrorState, LoadingSkeleton, and SectionPanel.
- Applied the visual system to current clients, client detail, contracts, packages, deliverables list, and deliverables board surfaces.
- Redesigned the current Kanban board to use horizontal scrolling, 320px minimum columns, contained cards, compact metadata, clear status/progress/SLA badges, and a collapsed status action control.

## Before Evidence

Before F-005, code and visual review found:

- Management layout was a minimal `max-w-6xl` wrapper without product shell, sidebar, top header, or breadcrumbs.
- Reviewed pages repeated local heading/action/card styles.
- Kanban used `grid-cols-10` inside `min-w-[1120px]`, making columns too narrow.
- Each Kanban card displayed a long status form inline, causing the card to dominate the column.
- RTL and responsive behavior relied on per-page styles rather than a shared shell.

## After Screenshots

- [Clients shell desktop](../../specs/006-ux-rescue-product-shell/evidence/screenshots/after-clients-shell-desktop.png)
- [Kanban desktop](../../specs/006-ux-rescue-product-shell/evidence/screenshots/after-kanban-desktop.png)
- [Kanban mobile](../../specs/006-ux-rescue-product-shell/evidence/screenshots/after-kanban-mobile.png)

## Explicitly Not Added

- No files feature.
- No comments feature.
- No approvals feature.
- No drag/drop.
- No AI.
- No social scheduling.
- No dependencies.
- No Production Supabase.
- No real client data.

## Verification Status

See `specs/006-ux-rescue-product-shell/evidence/verification.md` for the command-by-command evidence table.
