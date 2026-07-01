# UI Contract: F-005 UX Rescue Product Shell

## Reviewed Routes

| Route                                                 | Contract                                                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/clients`                                            | Renders inside management shell with Arabic title, clients list or empty state, and scoped actions.       |
| `/clients/[clientId]`                                 | Renders inside management shell with client name, route cards, and no unauthorized board exposure.        |
| `/clients/[clientId]/contracts`                       | Renders inside management shell with contracts list/empty/denied states.                                  |
| `/clients/[clientId]/contracts/[contractId]/packages` | Renders inside management shell with packages and balance summary.                                        |
| `/clients/[clientId]/deliverables`                    | Renders inside management shell with deliverables list and existing create/board actions when permitted.  |
| `/clients/[clientId]/deliverables/board`              | Renders inside management shell with readable horizontal Kanban layout and existing status update action. |

## Product Shell Contract

- `html` and management shell must remain `dir="rtl"`.
- Sidebar is visible on desktop and becomes a compact horizontal/stacked navigation region on smaller screens.
- Top header identifies Sharik/Samawah operations and does not expose real client data.
- Breadcrumbs are visible and Arabic.
- Page content is bounded by a max-width except the Kanban scroll area, which intentionally uses horizontal overflow.
- Focus states are visible for links, buttons, selects, inputs, and disclosure controls.

## Kanban Layout Contract

- Board region has accessible label `لوحة Kanban الداخلية`.
- Columns are rendered as regions with Arabic status labels.
- Each column width is at least 320px.
- The board horizontal scrollbar is expected when all ten columns cannot fit.
- Card content must wrap safely and remain inside the card and column.
- Progress, status, priority, and SLA are labels/badges, not color-only signals.
- Status update controls remain form based and use existing hidden fields and server action inputs.
- Invalid transition options remain disabled according to existing rules.

## Explicit Non-Contracts

- No drag/drop API.
- No files UI.
- No comments UI.
- No approvals UI.
- No social scheduling UI.
- No AI UI.
- No new public API or database contract.
