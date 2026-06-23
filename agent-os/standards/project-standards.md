# Agent OS Project Standards: Sharik / Samawah

Agent OS version reference: v3.0 from `buildermethods/agent-os` public documentation and repository, used as a standards layer only.

These standards do not replace AGENTS.md, accepted ADRs, or the Spec Kit constitution. They make implementation expectations discoverable for future agents.

## TypeScript Standards

- Use TypeScript strict mode as far as the selected Next.js setup allows.
- Model domain states with explicit union types or enums; avoid free-form status strings.
- Validate external input with Zod before commands mutate state.
- Do not encode permission or tenant rules only in UI types.

## Next.js Standards

- Use Next.js with server-side command paths for sensitive operations.
- Keep business transitions out of client components.
- Route handlers/server actions must derive tenant and client scope from authenticated membership, not from trusted request fields alone.

## React Component Standards

- Build RTL-first Arabic interfaces.
- Use shadcn/ui, Radix UI, Tailwind CSS, and Lucide icons when UI implementation begins.
- Client portal screens must stay simple: pending approvals, contract/package progress, files, and settings.

## Supabase and PostgreSQL Standards

- Use Supabase Auth, PostgreSQL, Storage, and RLS per ADR-003/004/005/007.
- Every customer-data table must have tenant/client scope directly or through mandatory FK.
- Use transactions for approval, delivery, ledger, and SLA state changes.

## Authorization and Tenant Context Standards

- Deny by default.
- Evaluate identity, tenant membership, client scope, role, permission, resource state, and version freshness.
- Client roles never access internal comments, internal files, internal audit, or other clients.

## RLS Standards

- RLS is defense in depth and must be paired with server-side authorization.
- Views exposed to the app must not bypass RLS or leak internal fields.
- RLS tests must include cross-tenant, cross-client, and internal-only denial cases.

## File Security Standards

- Use Uppy plus Supabase Storage in V1.
- No public URLs for protected client or internal files.
- File metadata controls visibility and version/final status.
- Cloudflare R2 requires ADR when video/egress thresholds justify it.

## Testing Standards

- Use Vitest for domain/security functions and Playwright for critical flows.
- Required negative tests: Client A cannot see Client B, client cannot see internal comments/files, viewer cannot approve, stale version cannot be approved.
- Domain/security logic should be test-first or have documented test cases before implementation.

## Accessibility and RTL Standards

- Arabic RTL is default.
- Important client actions must work on mobile.
- Keyboard and screen-reader behavior are required for approvals, navigation, dialogs, and Kanban alternatives.

## Error Handling Standards

- Permission errors must not reveal whether another client resource exists.
- Sensitive retries must be idempotent.
- User-facing Arabic copy should be simple and non-internal.

## Audit and Logging Standards

- Approval, rejection, change request, send-to-client, SLA pause/resume, delivery, ledger adjustment, file visibility, role/membership changes require audit events.
- Audit records include actor, scope, target, previous/new state where safe, reason, and correlation id.

## Git and Commit Standards

- Planning baseline is tagged `planning-architecture-baseline-v1`.
- Build work after spec approval should use isolated branches/worktrees.
- Do not use `git add .` before reviewing sensitive files.

## Documentation Standards

- Feature work requires `spec.md`, `plan.md`, and `tasks.md` only after owner approval to proceed.
- Any architecture/security/stack/workflow change that crosses an ADR trigger must create or update an ADR.
- Keep traceability from requirement to feature, slice, permission, and test.
