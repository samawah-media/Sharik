import type { InvitationRecord } from "@/modules/invitations/invitation-repository";

export function InvitationList({
  invitations,
}: {
  invitations: InvitationRecord[];
}) {
  if (invitations.length === 0) {
    return (
      <section aria-label="الدعوات">
        <p>لا توجد دعوات معلقة</p>
      </section>
    );
  }

  return (
    <section aria-label="الدعوات" className="grid gap-3">
      {invitations.map((invitation) => (
        <article
          key={invitation.id}
          className="rounded-md border border-border p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                {invitation.invitedEmail}
              </h2>
              <p className="text-sm text-muted-foreground">
                {invitation.status === "pending" ? "دعوة معلقة" : "دعوة منتهية"}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button">إعادة الإرسال</button>
              <button type="button">إلغاء الدعوة</button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
