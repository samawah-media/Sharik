# Contract: Stage 2C Evidence Redaction

## Allowed Evidence

- Pass, fail, skipped, blocked, and no-op statuses.
- Counts of local synthetic mutations, denials, audit expectations, test cases, and defects.
- Role categories, scenario categories, status labels, and command names.
- Value-free summaries of findings and blockers.

## Forbidden Evidence

- Real customer names, emails, phone numbers, or identifiers.
- Hosted project URLs, deployment URLs, signed file URLs, storage paths, or tokens.
- Hosted file content or screenshots containing customer content.
- Non-Hadna data.
- Secrets, API keys, cookies, session values, or raw auth payloads.

## Redaction Rule

Evidence must describe what was proven without revealing the underlying sensitive value. If proof requires a sensitive value, record the category and count only.

## Mutation Rule

Every local synthetic mutation must record:

- scenario category
- role category
- mutation count
- no-op count
- audit expectation
- rollback/no-op expectation when applicable

Hosted mutations are not authorized in Stage 2C.
