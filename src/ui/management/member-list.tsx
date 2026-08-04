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
      <h2 className="text-lg font-semibold">أعضاء الفريق</h2>
      {members.map((member) => (
        <article
          className="grid gap-3 rounded-xl border border-border bg-surface p-4"
          data-status={member.status}
          key={member.membershipId}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-semibold">{member.displayName}</h3>
            <span className="rounded-full border border-border px-3 py-1 text-xs">
              {member.status === "active" ? "عضوية نشطة" : "عضوية معطلة"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="أدوار العضو">
            {member.roleKeys.map((roleKey) => (
              <span
                className="rounded-full bg-background px-3 py-1 text-xs"
                key={roleKey}
              >
                {roleLabelAr(roleKey)}
              </span>
            ))}
          </div>
          {member.clientNames.length > 0 ? (
            <p className="text-sm text-muted">
              يعمل على: {member.clientNames.join("، ")}
            </p>
          ) : (
            <p className="text-sm text-muted">صلاحية إدارية على مساحة سماوة.</p>
          )}
        </article>
      ))}
    </section>
  );
}
