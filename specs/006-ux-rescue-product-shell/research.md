# Research: F-005 UX Rescue Product Shell

Date: 2026-07-01

## Current Page Review

| Surface            | Current finding                                                                                                | F-005 response                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Clients list       | Uses page-local heading/actions and repeated raw card/button styles.                                           | Wrap in shared shell and use PageHeader, Card, Button, Badge/SectionPanel where useful.                                |
| Client detail      | Provides route links but no consistent breadcrumbs, header, or product frame.                                  | Use shell breadcrumbs and card-style route tiles.                                                                      |
| Contracts          | Uses local header/action layout and list cards.                                                                | Normalize page header/action, list cards, status badges, and empty/denied states.                                      |
| Packages           | Uses local list card and balance blocks.                                                                       | Normalize card/panel/badge styling while keeping ledger summary behavior unchanged.                                    |
| Deliverables list  | Uses local header/actions and dense cards with cancellation control.                                           | Normalize page header/actions and list cards without adding workflow.                                                  |
| Deliverables board | Ten columns are compressed into `min-w-[1120px]`; cards contain a long status form; RTL scroll/layout is weak. | Use horizontal flex/grid with 320px minimum columns, clear gaps, contained cards, badges, and compact status controls. |

## Decisions

### Decision: No dependency additions

**Rationale**: The owner explicitly forbids new dependencies without ADR. F-005 can achieve the rescue with existing React, Tailwind CSS, and Lucide React.

**Alternatives considered**:

- Add shadcn/ui: rejected because it changes dependencies and may generate broad files outside F-005.
- Add dnd-kit: rejected because drag/drop is explicitly forbidden in this phase.

### Decision: Product shell at management layout level

**Rationale**: `src/app/(management)/layout.tsx` already wraps all management pages. Replacing the minimal wrapper with a reusable ProductShell gives consistent RTL, sidebar, top header, breadcrumbs, and content width without changing each route's authorization logic.

**Alternatives considered**:

- Add page-level shell wrappers one by one: rejected because consistency would depend on every page remembering the shell.
- Add a new route group: rejected because current URLs must remain stable for internal trial and tests.

### Decision: PageHeader derives breadcrumbs from current path

**Rationale**: Reviewed pages already have predictable URLs. A shared component can accept explicit page title/actions and the shell can provide path-based breadcrumbs without creating a new navigation dependency.

**Alternatives considered**:

- Add a route metadata registry: deferred because it is broader navigation architecture.

### Decision: Kanban compact action control instead of long inline form

**Rationale**: Existing status update is a sensitive server action and must remain available, but the current full form dominates every card. A native `details` disclosure keeps the form keyboard accessible and compact without new JS dependencies.

**Alternatives considered**:

- Dropdown menu library: rejected because it would require a dependency or custom client component.
- Remove status controls: rejected because existing smoke coverage expects the status update path.

### Decision: Visual evidence through Playwright screenshots

**Rationale**: Playwright is already installed and used for E2E. Screenshots can be captured from local fixture routes before and after implementation without real client data.

**Alternatives considered**:

- Manual screenshots only: rejected because repeatability matters for the PR evidence.
