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
