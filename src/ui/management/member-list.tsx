import type { RoleAssignment } from "@/modules/memberships/membership";
import { roleLabelAr } from "@/modules/roles/role-labels";
import type { InternalTeamMember } from "@/server/actions/internal-team-members";

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

export function InternalTeamDirectory({
  members,
}: {
  members: InternalTeamMember[];
}) {
  if (members.length === 0) {
    return (
      <section aria-label="أعضاء الفريق">
        <p>لا يوجد أعضاء فريق مفعّلون بعد.</p>
      </section>
    );
  }

  return (
    <section aria-label="أعضاء الفريق" className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">أعضاء الفريق</h2>
          <p className="text-xs text-muted">العضويات المفعلة ونطاق كل عضو.</p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {members.length}
        </span>
      </div>
      <div className="grid min-w-0 gap-2">
        {members.map((member) => (
          <article
            className="grid min-w-0 gap-2 rounded-xl border border-border bg-surface p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center lg:gap-4"
            data-status={member.status}
            key={member.membershipId}
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 break-words font-semibold [overflow-wrap:anywhere] [unicode-bidi:plaintext]">{member.displayName}</h3>
              <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs">
                {member.status === "active" ? "عضوية نشطة" : "عضوية معطلة"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2" aria-label="أدوار العضو">
              {member.roleKeys.map((roleKey) => (
                <span
                  className="max-w-full rounded-full bg-background px-3 py-1 text-xs [overflow-wrap:anywhere]"
                  key={roleKey}
                >
                  {roleLabelAr(roleKey)}
                </span>
              ))}
            </div>
            {member.clientNames.length > 0 ? (
              <div aria-label="عملاء العضو" className="flex min-w-0 flex-wrap gap-2">
                {member.clientNames.map((clientName, index) => (
                  <span
                    className="min-w-0 max-w-full rounded-full border border-border px-3 py-1 text-xs text-muted [overflow-wrap:anywhere] [unicode-bidi:plaintext]"
                    key={`${clientName}-${index}`}
                  >
                    {clientName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="min-w-0 break-words text-sm text-muted">
                صلاحية إدارية على مساحة سماوة.
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
