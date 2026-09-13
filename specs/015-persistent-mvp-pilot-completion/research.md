# Research and decisions

- Existing `deliverables` and `audit_events` tables are retained as the workflow anchors.
- Version-aware approval, visibility, and SLA history require append-only relational tables rather than route-local state.
- Existing RLS helper `f001_has_active_role` and composite scope conventions are reused.
- No new package or dependency is justified for this local MVP slice.
