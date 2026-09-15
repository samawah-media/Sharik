# Task Spec: SIL-53

## Goal
Fix SIL-53: "Client decisions silently return to an empty pending inbox; stale approval notifications remain actionable and duplicate notifications can exist for the same work/version"

## Details & Tasks
This issue requires three fixes:
1. **Notifications deduplication**: In supabase/migrations/202608010002_s015_x010b4_in_app_notifications.sql, the DeliverableVersionSentToClient event uses 'client_send:' || new.id::text as the dedupe_key (where new.id is the audit event ID). Because every send creates a new audit event, this causes duplicate notifications if the same version is sent again.
   - **Fix**: Change the dedupe_key for client_send to 'client_send:' || v_version::text (or deliverable+version). Similarly, review other workflow notifications (like internal_changes_requested, client_approved, delivery_prepared, etc.) and ensure their dedupe_key uses _version or _deliverable_id instead of
ew.id so that multiple actions on the same version don't flood the inbox.
2. **Notification HREF**: The DeliverableVersionSentToClient sets _href := '/client/pending'. If the client clicks this after already approving the work, they see an empty inbox, which feels broken (stale notification).
   - **Fix**: Change the _href for client_send to '/client/work/' || v_deliverable_id::text. This ensures the notification always takes the client to the deliverable's detail page, which natively handles both "actionable" and "already approved" states gracefully.
3. **Empty Pending Inbox UX**: In src/ui/client/client-pending-inbox.tsx, when a user approves the last item, the form uses Next.js server actions and calls evalidatePath("/client/pending"), which refreshes the page and silently leaves an empty inbox.
   - **Fix**: In ClientPendingInbox, add a success state (like a toast or an inline message) that says "تم إرسال قرارك بنجاح" when the inbox becomes empty after an action, or just make sure there's clear feedback. Actually, returning a success status from the action and showing it would be ideal. But keep it simple: just ensure the empty state of ClientPendingInbox says something reassuring like "لا توجد أعمال بانتظار اعتمادك حالياً. تم استلام قراراتك السابقة." (No work awaiting your approval currently. Your previous decisions have been received.)

## Constraints
- Do not alter table structures or RLS policies.
- Do not commit to git. Just modify the files.
- Return the exact lines changed.
