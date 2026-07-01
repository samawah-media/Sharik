# Feature Specification: F-005 UX Rescue Product Shell

**Feature Branch**: `codex/f-005-ux-rescue-product-shell`

**Created**: 2026-07-01

**Status**: Draft - Spec Kit before implementation

**Input**: Stop adding new Sharik features and rescue the internal trial UX. Build a unified RTL product shell, basic UI system, and redesigned non-drag Kanban layout for the current clients, client detail, contracts, packages, deliverables list, and deliverables board pages. Do not add files, comments, approvals, drag/drop, AI, social scheduling, dependencies, Production behavior, or real client data.

## User Scenarios & Testing

### User Story 1 - Navigate Through A Professional Product Shell (Priority: P1)

As a Samawah internal operator, I want a consistent Arabic RTL shell around the existing management pages so that clients, contracts, packages, deliverables, and the board feel like one product instead of disconnected proof-of-concept screens.

**Why this priority**: The internal trial is blocked by poor basic usability. A shared shell is the foundation for every reviewed page.

**Independent Test**: Open the clients list, client detail, contracts, packages, deliverables list, and deliverables board pages. Each page uses the same RTL shell, sidebar, top header, breadcrumbs, page title/action area, and bounded content container without exposing extra product capabilities.

**Acceptance Scenarios**:

1. **Given** an authorized internal user, **When** they open any reviewed management page, **Then** they see one consistent RTL shell with sidebar navigation, top header, breadcrumbs, page title, optional action area, and a readable content width.
2. **Given** the viewport is tablet or mobile width, **When** the same pages render, **Then** content stacks without horizontal text clipping except the Kanban board's intentional horizontal scroll area.
3. **Given** a user reaches a denied, empty, loading, or error state, **When** the state renders, **Then** it follows the same visual system and does not leak tenant, client, internal comment, approval, or file data.

---

### User Story 2 - Scan Current Records With A Shared UI System (Priority: P1)

As a Samawah manager or team member, I want the existing lists and summaries to use consistent buttons, cards, badges, panels, stat cards, and states so that I can scan status, scope, and actions quickly.

**Why this priority**: Current pages repeat raw styles and vary spacing, actions, and empty states. The internal trial needs predictable visual language before deeper feature work resumes.

**Independent Test**: Render the component tests for the shell and core UI primitives, then open the reviewed pages and confirm their primary actions, cards, badges, and states are visually consistent.

**Acceptance Scenarios**:

1. **Given** a page has a primary action, **When** the action renders, **Then** it uses the shared button treatment and remains keyboard focusable.
2. **Given** a list item, summary panel, or empty state renders, **When** the user scans it, **Then** spacing, border, radius, typography, and muted text are consistent with the shared UI components.
3. **Given** Arabic text is longer than expected, **When** it appears in a title, badge, button, or card, **Then** it wraps or truncates safely without overlapping adjacent content.

---

### User Story 3 - Use A Readable Kanban Board Without Drag/Drop (Priority: P1)

As an authorized internal user, I want the current deliverables Kanban board to have readable columns, contained cards, compact status controls, and clear status/progress/SLA badges so that I can use it during the internal trial without visual breakage.

**Why this priority**: The board is the most visibly broken surface. It must be usable without adding drag/drop or new workflow behavior.

**Independent Test**: Open the existing board with synthetic Client A deliverables on desktop, tablet, mobile, and RTL locale. The board horizontally scrolls, each column is at least 320px wide, cards stay inside columns, action controls are compact, and status changes still use the existing server action path.

**Acceptance Scenarios**:

1. **Given** the board has ten active lifecycle columns, **When** it renders on desktop, **Then** it uses horizontal scrolling with clear gaps and a minimum 320px column width.
2. **Given** a card has type, priority, SLA, progress, owner, contributors, and dates, **When** it renders inside a column, **Then** the data is summarized with badges and compact metadata without a long form taking over the card.
3. **Given** an authorized internal user changes a card status through the existing select/action flow, **When** the control is used, **Then** the UI remains compact and the existing transition rules continue to deny invalid moves.

---

### User Story 4 - Produce UX Evidence For Internal Trial Readiness (Priority: P2)

As the project owner, I want before/after screenshots and command evidence so that the PR can be reviewed as a UX rescue, not as a feature expansion.

**Why this priority**: The purpose of F-005 is internal trial readiness. Evidence must show that the current surfaces improved and that no forbidden scope was added.

**Independent Test**: Review the evidence document and screenshot files for before/after captures of the current shell and Kanban board, plus the requested verification commands and outcomes.

**Acceptance Scenarios**:

1. **Given** the work is complete, **When** `docs/08-release/F-005-ux-rescue-product-shell.md` is opened, **Then** it links to before/after evidence and lists the exact validation commands.
2. **Given** the PR is reviewed, **When** the diff is inspected, **Then** no new dependency, drag/drop, file feature, comment feature, approval feature, AI, social scheduling, Production target, or real client data is introduced.

## Edge Cases

- A reviewed page has no records and must render a consistent empty state.
- A reviewed page is denied due to permission, disabled membership, expired session, or missing resource.
- A Kanban column has no cards.
- A card has a long Arabic title, long owner ID, no owner, no contributors, or missing due dates.
- The board has all ten columns on a narrow viewport.
- The browser is using Arabic RTL locale and mobile viewport.
- A status option is not allowed by existing transition rules.
- The shell must not hide security-state messages or make forbidden client data easier to reach.

## Requirements

### Functional Requirements

- **FR-001**: The feature MUST use a new Spec Kit package at `specs/006-ux-rescue-product-shell/` before production code changes.
- **FR-002**: The feature MUST rescue only existing pages: clients list, client detail, contracts, packages, deliverables list, and deliverables board.
- **FR-003**: The feature MUST add a unified management product shell with RTL layout, sidebar, top header, breadcrumbs, page title/action area, bounded content container, and responsive behavior.
- **FR-004**: The feature MUST add shared UI components for Button, Card, Badge, PageHeader, StatCard, EmptyState, ErrorState, LoadingSkeleton, and SectionPanel.
- **FR-005**: Reviewed pages MUST use the shared shell/page primitives for headings, actions, panels, cards, badges, empty states, and denied/error states where practical.
- **FR-006**: The Kanban board MUST use horizontal scrolling with clear spacing and a minimum column width of 320px.
- **FR-007**: Kanban cards MUST stay inside their columns and MUST summarize status, progress, SLA, owner, and dates without a long inline form dominating the card.
- **FR-008**: Status/progress/SLA badges MUST use text labels and visual styling; status must not depend on color alone.
- **FR-009**: Card action controls MUST be contained in a compact action area or disclosure pattern and MUST reuse the existing status update path.
- **FR-010**: RTL direction, Arabic labels, text alignment, overflow wrapping, mobile, and tablet behavior MUST be verified for the reviewed pages.
- **FR-011**: The work MUST add component tests for the product shell and Kanban layout.
- **FR-012**: The work MUST add or update E2E smoke coverage for opening, navigating, and using the existing status-control flow.
- **FR-013**: The work MUST add before/after screenshot or visual evidence in documentation.
- **FR-014**: The work MUST NOT add files, comments, approval flows, drag/drop, AI, social scheduling, real client data, Production Supabase behavior, or dependencies.
- **FR-015**: If a new dependency becomes necessary, the work MUST stop for ADR and owner approval rather than adding it.

### Key Entities

- **Product Shell**: Shared management page frame containing navigation, header, breadcrumbs, title/action area, and content container.
- **UI Primitive**: Reusable display/control component used to normalize visual language without changing business behavior.
- **Kanban Board Layout**: Visual grouping of existing deliverables by lifecycle status with horizontal scrolling and fixed minimum column width.
- **Kanban Card Summary**: Compact visual representation of an existing deliverable summary with badges and metadata.
- **UX Evidence**: Documentation and screenshots proving before/after visual changes and verification results.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of reviewed management pages render inside the unified management shell.
- **SC-002**: Kanban columns render with a minimum width of 320px and no card content extends outside its column in component tests.
- **SC-003**: Component tests cover the shell and Kanban layout primitives.
- **SC-004**: E2E smoke covers opening the clients surface, navigating to the board, and using the existing status control path.
- **SC-005**: Mobile/tablet/desktop evidence confirms RTL text does not overlap or clip in the reviewed pages except intentional Kanban horizontal scroll.
- **SC-006**: The requested verification suite is run before PR creation; any failed command is documented with a blocker or justified environment limitation.

## Assumptions

- Existing route guards, permissions, Supabase access, status transition rules, audit behavior, and SLA derivation remain unchanged.
- No new schema migration is needed because F-005 is a UX/layout rescue.
- Existing fixture data is sufficient for local and E2E visual smoke checks; no real client data is used.
- The status update control remains select/action based because drag/drop and new dependencies are explicitly forbidden.
- Visual evidence can be stored in `specs/006-ux-rescue-product-shell/evidence/` and summarized from `docs/08-release/F-005-ux-rescue-product-shell.md`.
