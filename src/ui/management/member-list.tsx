"use client";

import { useActionState, useState } from "react";
import {
  initialMemberActionState,
  type MemberActionState,
} from "@/modules/memberships/member-action-state";
import type { RoleAssignment } from "@/modules/memberships/membership";
import { roleLabelAr } from "@/modules/roles/role-labels";
import {
  type InternalTeamMember,
  type InternalTeamMemberAssignment,
} from "@/server/actions/internal-team-members";

type MemberMutationAction = (
  previousState: MemberActionState,
  formData: FormData,
) => Promise<MemberActionState>;

const clientRoleOptions = [
  "account_manager",
  "content_writer",
  "designer",
  "performance_specialist",
] as const;
const tenantRoleOptions = [
  "tenant_owner",
  "tenant_administrator",
  "project_manager",
  "marketing_manager",
] as const;

function ActionFeedback({ state }: { state: MemberActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      className={state.status === "success" ? "text-sm text-emerald-700" : "text-sm text-red-700"}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function AssignmentEditor({
  member,
  assignment,
  updateAction,
  removeAction,
}: {
  member: InternalTeamMember;
  assignment: InternalTeamMemberAssignment;
  updateAction: MemberMutationAction;
  removeAction: MemberMutationAction;
}) {
  const [updateKey, setUpdateKey] = useState(() => crypto.randomUUID());
  const [removeKey, setRemoveKey] = useState(() => crypto.randomUUID());
  const [updateState, updateFormAction, updatePending] = useActionState(
    async (previousState: MemberActionState, formData: FormData) => {
      const result = await updateAction(previousState, formData);
      setUpdateKey(crypto.randomUUID());
      return result;
    },
    initialMemberActionState,
  );
  const [removeState, removeFormAction, removePending] = useActionState(
    async (previousState: MemberActionState, formData: FormData) => {
      const result = await removeAction(previousState, formData);
      setRemoveKey(crypto.randomUUID());
      return result;
    },
    initialMemberActionState,
  );
  const roles = assignment.scopeType === "tenant" ? tenantRoleOptions : clientRoleOptions;
  const availableClients = member.availableClients ?? [];
  const currentClientIsAvailable = availableClients.some(
    (client) => client.clientId === assignment.scopeId,
  );
  const clientOptions = assignment.scopeType === "client" && !currentClientIsAvailable
    ? [{ clientId: assignment.scopeId, clientName: `${assignment.scopeName} (غير نشط)` }, ...availableClients]
    : availableClients;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
      <form action={updateFormAction} className="grid gap-3 sm:grid-cols-2">
        <input name="membershipId" type="hidden" value={member.membershipId} />
        <input name="assignmentId" type="hidden" value={assignment.assignmentId} />
        <input name="scopeType" type="hidden" value={assignment.scopeType} />
        <input name="idempotencyKey" type="hidden" value={`member-update-${updateKey}`} />
        <label className="grid gap-1 text-sm font-medium">
          الدور
          <select
            aria-label="الدور"
            className="min-h-11 rounded-md border border-border bg-surface px-3"
            defaultValue={assignment.roleKey}
            name="roleKey"
          >
            {roles.map((roleKey) => (
              <option key={roleKey} value={roleKey}>{roleLabelAr(roleKey)}</option>
            ))}
          </select>
        </label>
        {assignment.scopeType === "client" ? (
          <label className="grid gap-1 text-sm font-medium">
            نطاق العميل
            <select
              aria-label="نطاق العميل"
              className="min-h-11 rounded-md border border-border bg-surface px-3"
              defaultValue={assignment.scopeId}
              name="scopeId"
            >
              {clientOptions.map((client) => (
                <option key={client.clientId} value={client.clientId}>{client.clientName}</option>
              ))}
            </select>
          </label>
        ) : (
          <input name="scopeId" type="hidden" value={assignment.scopeId} />
        )}
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">
          سبب التعديل
          <input
            className="min-h-11 rounded-md border border-border bg-surface px-3"
            maxLength={300}
            minLength={3}
            name="reason"
            placeholder="مثال: تحديث توزيع الفريق"
            required
          />
        </label>
        <button
          className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-60"
          disabled={updatePending}
          type="submit"
        >
          {updatePending ? "جارٍ الحفظ…" : "حفظ التعديل"}
        </button>
        <ActionFeedback state={updateState} />
      </form>
      {assignment.scopeType === "client" ? (
        <form action={removeFormAction} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <input name="membershipId" type="hidden" value={member.membershipId} />
          <input name="assignmentId" type="hidden" value={assignment.assignmentId} />
          <input name="idempotencyKey" type="hidden" value={`member-remove-${removeKey}`} />
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium sm:col-span-2">
            <input name="confirmation" required type="checkbox" value="confirmed" />
            أؤكد إزالة دور «{roleLabelAr(assignment.roleKey)}» للعضو «{member.displayName}» من العميل «{assignment.scopeName}» فقط
          </label>
          <label className="grid gap-1 text-sm font-medium">
            سبب إزالة النطاق
            <input
              className="min-h-11 rounded-md border border-border bg-surface px-3"
              maxLength={300}
              minLength={3}
              name="reason"
              required
            />
          </label>
          <button
            className="min-h-11 rounded-md border border-red-300 px-4 text-sm font-semibold text-red-700 disabled:opacity-60"
            disabled={removePending}
            type="submit"
          >
            {removePending ? "جارٍ الإزالة…" : "إزالة نطاق العميل"}
          </button>
          <ActionFeedback state={removeState} />
        </form>
      ) : null}
    </div>
  );
}

function DisableMembershipForm({
  member,
  action,
}: {
  member: InternalTeamMember;
  action: MemberMutationAction;
}) {
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [state, formAction, pending] = useActionState(
    async (previousState: MemberActionState, formData: FormData) => {
      const result = await action(previousState, formData);
      setIdempotencyKey(crypto.randomUUID());
      return result;
    },
    initialMemberActionState,
  );
  return (
    <form action={formAction} className="grid gap-2 rounded-lg border border-red-200 bg-red-50/40 p-3">
      <input name="membershipId" type="hidden" value={member.membershipId} />
      <input name="idempotencyKey" type="hidden" value={`member-disable-${idempotencyKey}`} />
      <label className="grid gap-1 text-sm font-medium">
        سبب تعطيل العضوية
        <input
          className="min-h-11 rounded-md border border-border bg-surface px-3"
          maxLength={300}
          minLength={3}
          name="reason"
          placeholder="لن يتم التعطيل إذا كانت لديه أعمال نشطة"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        اكتب «تعطيل» للتأكيد
        <input
          autoComplete="off"
          className="min-h-11 rounded-md border border-red-300 bg-surface px-3"
          name="confirmation"
          pattern="تعطيل"
          required
        />
      </label>
      <p className="text-sm text-red-800">
        سيُعطّل دخول «{member.displayName}» وتُلغى أدواره ودعواته المعلقة. لا يمكن إعادة تفعيله من هذه الشاشة، ولن يتم التعطيل إذا كانت لديه مسؤوليات نشطة.
      </p>
      <button
        className="min-h-11 rounded-md border border-red-300 px-4 text-sm font-semibold text-red-700 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "جارٍ التحقق…" : "تعطيل العضوية"}
      </button>
      <ActionFeedback state={state} />
    </form>
  );
}

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
  updateAssignmentAction = async () => initialMemberActionState,
  removeClientScopeAction = async () => initialMemberActionState,
  disableMembershipAction = async () => initialMemberActionState,
}: {
  members: InternalTeamMember[];
  updateAssignmentAction?: MemberMutationAction;
  removeClientScopeAction?: MemberMutationAction;
  disableMembershipAction?: MemberMutationAction;
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
            className="grid min-w-0 gap-3 rounded-xl border border-border bg-surface p-3"
            data-status={member.status}
            key={member.membershipId}
          >
            <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center lg:gap-4">
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
            </div>
            {member.status === "active" ? (
              <details className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer font-semibold">إدارة العضو</summary>
                <div className="mt-3 grid gap-3">
                  {(member.assignments ?? []).filter((assignment) => assignment.status === "active").map((assignment) => (
                    <AssignmentEditor
                      assignment={assignment}
                      key={`${assignment.assignmentId}-${assignment.roleKey}-${assignment.scopeType}-${assignment.scopeId}`}
                      member={member}
                      removeAction={removeClientScopeAction}
                      updateAction={updateAssignmentAction}
                    />
                  ))}
                  <DisableMembershipForm action={disableMembershipAction} member={member} />
                </div>
              </details>
            ) : (
              <p className="text-sm text-muted">السجل محفوظ للرجوع إليه. إعادة التفعيل غير متاحة في هذه الدفعة.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
