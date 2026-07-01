# Data Model: F-005 UX Rescue Product Shell

F-005 introduces no persisted business data, schema migration, or new Supabase table. The entities below are view models and UI contracts only.

## ProductShell

| Field             | Description                                            | Validation                                                                      |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `currentPath`     | Current route used to mark navigation and breadcrumbs. | Must be a local app path.                                                       |
| `navigationItems` | Shell sidebar links for current management surfaces.   | Labels must be Arabic and links must not expose client-only or forbidden areas. |
| `children`        | Current management page content.                       | Rendered inside bounded content container.                                      |

## PageHeader

| Field         | Description                              | Validation                                                                  |
| ------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `title`       | Main page heading.                       | Required, Arabic-friendly wrapping.                                         |
| `description` | Optional supporting copy or client name. | Optional, muted style.                                                      |
| `breadcrumbs` | Ordered path labels.                     | Optional; must not include secret IDs beyond already visible route context. |
| `actions`     | Primary/secondary page actions.          | Optional; keyboard focusable.                                               |
| `status`      | Optional success/error page message.     | Text label required; no color-only signal.                                  |

## UI Primitive

| Primitive       | Purpose                          | Constraints                                                |
| --------------- | -------------------------------- | ---------------------------------------------------------- |
| Button          | Shared action/link styling.      | Supports primary, secondary, ghost, danger; focus visible. |
| Card            | Contained repeated item.         | Stable padding/border/radius; no nested decorative cards.  |
| Badge           | Short status/progress/SLA label. | Text required; color not sole meaning.                     |
| StatCard        | Numeric or short summary.        | Fixed readable metric/title.                               |
| EmptyState      | Safe no-data state.              | No tenant/client leakage beyond scoped page.               |
| ErrorState      | Safe denied/error state.         | Clear Arabic message; no stack traces.                     |
| LoadingSkeleton | Placeholder state.               | Non-interactive, accessible label when needed.             |
| SectionPanel    | Bounded content section.         | Used for page sections, not nested card soup.              |

## KanbanBoardLayout

| Field           | Description                                                | Validation                                                  |
| --------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| `columns`       | Existing active Kanban statuses.                           | Must match active deliverable statuses; no new statuses.    |
| `columnWidth`   | Visual minimum width.                                      | Minimum 320px.                                              |
| `cards`         | Existing `DeliverableSafeSummary` items grouped by status. | Tenant/client scoping is inherited from existing read path. |
| `actionControl` | Existing status update form.                               | Compact disclosure; reuses existing server action.          |

## State Transitions

No new business state transitions are introduced. Existing deliverable status rules remain the source of truth.
