# 019 — Team email in administration

Workspace owners and administrators can distinguish team members with similar display names by seeing their sign-in email under the name in Team. Use the same tenant-scoped administrative directory as the existing membership controls. Show the current account email when available and omit the email line for records without an auth email. The customer portal and ordinary team workspaces receive no new personal data.

Acceptance: the directory returns the expected email to the workspace owner/administrator, excludes other tenants, and denies staff and anonymous callers. Render long email addresses in the RTL layout. Keep membership mutations unchanged.
