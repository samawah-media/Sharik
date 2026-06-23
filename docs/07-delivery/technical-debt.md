# Technical Debt

## TECH-DEBT-001: Agent OS context update hook on Windows PowerShell

Status: Open, non-blocking for F-001A.

Impact: The project standards reference Agent OS context update behavior, but a
validated Windows PowerShell hook is not yet installed for this workspace.

Required decision: Owner/maintainer should decide whether to automate the hook
inside this repository or keep context refresh as a manual quality-gate step.

Current mitigation: F-001A evidence records the standards files read and the
active worktree/branch instead of relying on an implicit hook.
