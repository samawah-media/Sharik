# Samawah Product Experience Contract

## Product personality

Samawah is calm, explicit, and operational. Every screen answers what needs attention, who owns it, what happens next, and whether the client can see it. Arabic is the primary language; internal workflow complexity stays with the team and management.

## Direction and tokens

- Use RTL-first layouts with `dir="rtl"`; keep URLs, dates, numbers, file names, and Latin channel names in isolated LTR spans when needed.
- Use the existing Arabic-capable system font stack and the shared tokens in `src/app/globals.css`. Do not introduce page-specific color values.
- Semantic colors: accent for active navigation and primary actions, success for completed/approved, warning for at-risk or waiting states, danger for overdue/denied/destructive actions, and muted for secondary information.
- Prefer 8px spacing rhythm, 12–16px radii, one-pixel borders, and restrained shadows. Cards are grouped by purpose, not used as decoration.
- Minimum interactive target is 44px. Focus must remain visible; motion is optional and must respect `prefers-reduced-motion`.

## Shell and information architecture

Management gets an exception-first dashboard, scoped client context, and team workspace. Team members get `مهماتي`, قائمة, and لوحة العمل. Clients get `الرئيسية`, `بانتظار موافقتي`, `العقد والمتابعة`, `الملفات`, and an always-discoverable profile/sign-out menu. Negative-control data is never a normal navigation destination.

## Shared patterns

Use the same hierarchy for metric cards, deliverable cards, drawers, tabs, badges, comments, file previews, approval bars, empty states, loading states, errors, and permission-denied states. A deliverable entry point must show title, client, type/channel, owner display name, due date, priority, SLA, state, and the next action; detail belongs in the focused drawer or detail surface.

Client approval actions are sticky and visually distinct. Internal comments, quality notes, private activity, and internal files are excluded server-side from client payloads; conditional rendering is not an authorization boundary.

## Responsive and accessibility rules

Desktop may use a sidebar and multi-column board. Mobile collapses navigation into a horizontal scrollable row, prioritizes pending approvals and due work, and never creates unexpected horizontal overflow outside an intentional board region. Keyboard users can reach every card and action, use a non-drag status control, and return focus after a drawer/dialog closes. Long Arabic text wraps; mixed Arabic/Latin content uses safe bidi isolation.

## Do / don't

- Do say `بانتظار موافقتك` to a client and `بانتظار اعتماد العميل` to the team.
- Do use a generic content-type/channel thumbnail when media is unavailable.
- Do resolve scoped member names before rendering an assignee.
- Don't expose raw UUIDs, internal states, internal comments, synthetic Alpha/Beta controls, or copied competitor identity.
- Don't let visual grouping bypass the persistent state machine.

## Experience primitives

### Typography and tokens

- Use the project font stack and semantic tokens only: `background`, `surface`, `foreground`, `muted`, `border`, `accent`, `success`, `warning`, and `danger`.
- Headings establish one clear page title, then section titles, then card labels. Body copy stays short and readable at 15–16px with line height around 1.7 for Arabic.
- Use `font-variant-numeric: tabular-nums` for counts, dates, SLA timers, and package quantities. Wrap mixed Arabic/Latin values in an isolated bidi span.

### Universal deliverable drawer

Every role may open the same deliverable detail surface, but the server determines its safe sections and actions. The order is: overview, content/version preview, execution, files, comments, quality, and activity. The header always shows client scope, status, SLA, owner display name, due date, and the next permitted action. A drawer is a focused workspace, not a second permission system; deep links must resolve to the same tenant/client/version checks.

The client view omits internal quality notes, internal comments, private activity, hidden versions, and internal files from the payload. Management and team views can show those sections only within their scoped client context. Loading, empty, error, and denied states use the same surface structure so the layout does not reveal whether another tenant has data.

### Board and list

The team workspace has `مهماتي`, `قائمة`, and `لوحة العمل`. `قائمة` is the operational default for scanning owner, due date, SLA, and next action; `لوحة العمل` is a visual macro-lane view. Drag-and-drop is an enhancement over the keyboard/status form, uses optimistic updates with rollback, and never bypasses the transition state machine. Cards expose a visible title and status; identifiers remain data attributes or hidden form values, never visible copy.

### Content, files, comments, approvals

- Version metadata is attached to the exact version: brief, body/caption, channel, format, objective, KPI, and source reference.
- Preview uses a generic type/channel fallback when no image or video preview exists; it never invents client-facing media.
- Uploads show version, visibility, file type, size, and final/draft state. Uppy/Storage integration must preserve tenant/client/deliverable context and deny a direct URL without permission.
- Comments are visibly labelled as client-facing or internal. Tiptap is preferred for rich text; a textarea is acceptable only as a documented fallback while preserving visibility and audit rules.
- Approval controls show the exact version, require an approver role, use idempotency keys, and expose a neutral result after a duplicate submission. Every decision is auditable.

### States and imagery

Use the lifecycle labels from the domain rules, not bespoke UI labels. SLA states distinguish `متوقف بانتظار العميل` from internal waiting and overdue. Every async surface has loading, retryable error, empty, and permission-denied variants. Missing media uses an Arabic-safe type tile with icon and label; broken media never collapses the card or leaks a storage path.

### Responsive, RTL, and accessibility QA

At 375px, navigation may scroll only inside its intentional region, cards stack, and primary approval actions remain reachable without horizontal page overflow. At desktop widths, sidebars and board columns may expand while the content reading width remains controlled. Test keyboard focus, visible focus rings, semantic headings/regions, 44px controls, reduced motion, Arabic wrapping, Latin URL/file names, screen-reader labels, and focus return after drawers. Test both client viewer and approver so read-only behavior is obvious.
