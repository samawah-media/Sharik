# Contract: R-007 Readiness Boundary

## Purpose

This contract defines what R-007 may and may not do. It protects the accepted R-006 internal UAT baseline while preparing the next V1 readiness step.

## Baseline

- R-006 is accepted by the owner for Hadna-only internal UAT.
- R-006 is not production acceptance.
- R-006 does not authorize non-Hadna customer data use.
- R-006 does not authorize new hosted database mutation.
- R-006 should not be reopened as a bugfix phase by R-007.

## Allowed in R-007 Planning

- Create and update R-007 Spec Kit artifacts.
- Define V1 readiness gates around deliverables, SLA, approvals, files, permissions, audit logs, and client portal.
- Prepare implementation tasks.
- Prepare local or fixture-based validation plans.
- Identify owner decisions required for pilot expansion or production-candidate review.

## Conditionally Allowed in R-007 Implementation

The following are allowed only if task scope and owner approval are explicit:

- Hosted database mutation.
- Hosted UAT deployment or promotion.
- Use of any non-Hadna customer data.
- New pilot account creation.
- Production-candidate smoke.
- Any workflow change that affects approval, SLA, tenancy, RLS, file visibility, or package accounting.

## Not Allowed Without Separate ADR or Owner Decision

- Production acceptance.
- Social scheduling or direct social publishing.
- AI content generation.
- Advanced billing.
- Microservices.
- New backend framework.
- New tenancy model.
- New RLS model.
- New approval workflow semantics.
- New SLA calculation semantics.

## Evidence Redaction Rules

R-007 docs, logs, chat, and committed evidence must not print:

- Credentials
- Emails
- Screenshots
- Workbook content
- External links
- Captions
- Deliverable titles
- Tokens
- Secret values

Evidence may record counts, pass/fail status, route categories, role categories, non-sensitive state names, and safe summaries.

## Owner Decision Gates

R-007 must explicitly record the next needed owner decision before any of the following:

- Broader pilot expansion
- Hosted mutation
- Non-Hadna data use
- Production-candidate review
- Production acceptance
