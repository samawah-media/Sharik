import { InvitationList } from "@/ui/management/invitation-list";
import {
  MemberList,
  ResponsibilityTransferBlockedState,
} from "@/ui/management/member-list";

const members = [
  {
    id: "tm_internal_a",
    name: "عضو فريق سماوة",
    email: "internal-a@example.test",
    status: "active" as const,
    roles: [],
  },
  {
    id: "tm_disabled_a",
    name: "عضو معطل",
    email: "disabled@example.test",
    status: "disabled" as const,
    roles: [],
  },
];

const invitations = [
  {
    id: "inv_pending",
    tenantId: "tenant_a",
    invitedEmail: "pending@example.test",
    membershipType: "internal" as const,
    roleKey: "account_manager" as const,
    clientIds: ["client_a"],
    status: "pending" as const,
    token: "redacted",
    expiresAt: "2026-07-01T00:00:00.000Z",
    createdBy: "tenant_admin_a",
    createdAt: "2026-06-24T00:00:00.000Z",
    deliveryState: "sent" as const,
  },
];

export default function MembersPage() {
  return (
    <main className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold">إدارة العضويات والأدوار</h1>
        <p className="text-sm text-muted-foreground">
          تحديث الأدوار وتعطيل العضويات وإدارة الدعوات المعلقة ضمن نطاق العميل.
        </p>
      </header>
      <ResponsibilityTransferBlockedState />
      <MemberList members={members} />
      <InvitationList invitations={invitations} />
    </main>
  );
}
