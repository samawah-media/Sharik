import type { RoleAssignment } from "@/modules/memberships/membership";

export type MemberListItem = {
  id: string;
  name: string;
  email: string;
  status: "active" | "disabled" | "removed";
  roles: RoleAssignment[];
};

export function RoleSelector() {
  return (
    <label className="grid gap-2 text-sm font-medium">
      الدور
      <select
        aria-label="الدور"
        className="rounded-md border border-border bg-background px-3 py-2"
        defaultValue="account_manager"
      >
        <option value="account_manager">مدير حساب</option>
        <option value="content_writer">كاتب محتوى</option>
        <option value="designer">مصمم</option>
        <option value="client_viewer">مشاهد عميل</option>
        <option value="client_approver">معتمد عميل</option>
      </select>
    </label>
  );
}

export function ResponsibilityTransferBlockedState() {
  return (
    <div role="alert" className="rounded-md border border-amber-300 p-4">
      لا يمكن تعطيل العضوية قبل توثيق نقل المسؤوليات النشطة.
    </div>
  );
}

export function MemberList({ members }: { members: MemberListItem[] }) {
  if (members.length === 0) {
    return (
      <section aria-label="الأعضاء">
        <p>لا توجد عضويات بعد</p>
      </section>
    );
  }

  return (
    <section aria-label="الأعضاء" className="grid gap-3">
      {members.map((member) => (
        <article
          key={member.id}
          className="rounded-md border border-border p-4"
          data-status={member.status}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{member.name}</h2>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
            <span>
              {member.status === "disabled" ? "عضوية معطلة" : "عضوية نشطة"}
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            <RoleSelector />
            <button type="button">تحديث الدور</button>
            <button type="button">تعطيل العضوية</button>
          </div>
        </article>
      ))}
    </section>
  );
}
