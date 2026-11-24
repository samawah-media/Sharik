"use client";

import {
  ChartNoAxesCombined,
  Check,
  Crown,
  Megaphone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useId } from "react";
import {
  PERMISSIONS,
  roleGrantsPermission,
  type PermissionId,
} from "@/modules/authorization/permission-catalog";
import type { RoleKey } from "@/modules/memberships/membership";
import { roleLabelAr } from "@/modules/roles/role-labels";

type CatalogTeamRole = Exclude<RoleKey, "client_admin" | "client_approver" | "client_viewer">;

export type TeamRoleOption = CatalogTeamRole | "marketing_manager" | "performance_specialist";

const saudiAvatars = "/team-role-avatars.webp";
const studioAvatars = "/team-role-avatars-studio.webp";

type RolePortrait = { description: string } &
  ({ icon: LucideIcon } | { imagePath: string; position: string });

const portraits: Record<TeamRoleOption, RolePortrait> = {
  tenant_owner: { icon: Crown, description: "إشراف على مساحة سماوة" },
  tenant_administrator: { icon: ShieldCheck, description: "إدارة الفريق والعملاء" },
  project_manager: { imagePath: saudiAvatars, position: "0% 0%", description: "تنظيم العمل والمراجعة والاعتماد" },
  marketing_manager: { icon: Megaphone, description: "الإشراف على العمل التسويقي" },
  account_manager: { imagePath: saudiAvatars, position: "100% 0%", description: "تنسيق الحساب ومتابعة المخرجات" },
  content_writer: { imagePath: studioAvatars, position: "0% 100%", description: "كتابة المحتوى وتجهيز نسخه" },
  designer: { imagePath: studioAvatars, position: "100% 100%", description: "تنفيذ التصاميم وتجهيز نسخها" },
  performance_specialist: { icon: ChartNoAxesCombined, description: "متابعة الأعمال المسندة للأداء" },
};

function RoleAvatar({ portrait, selected }: { portrait: RolePortrait; selected: boolean }) {
  const Icon = "icon" in portrait ? portrait.icon : null;
  const avatarStyle = "imagePath" in portrait
    ? {
        backgroundImage: "url(" + portrait.imagePath + ")",
        backgroundPosition: portrait.position,
        backgroundSize: "200% 200%",
      }
    : undefined;

  return (
    <span
      aria-hidden="true"
      className={`grid size-11 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent-soft text-accent motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${selected ? "motion-safe:scale-105" : ""}`}
      style={avatarStyle}
    >
      {Icon ? <Icon className="size-5" strokeWidth={1.75} /> : null}
    </span>
  );
}

type TeamRoleCardProps = {
  role: TeamRoleOption;
  selected: boolean;
  onRoleChange: (role: TeamRoleOption) => void;
};

function TeamRoleCard({ role, selected, onRoleChange }: TeamRoleCardProps) {
  const cardId = useId();
  const portrait = portraits[role];

  return (
    <label className="relative block min-w-0">
      <input
        aria-describedby={`${cardId}-hint`}
        aria-labelledby={`${cardId}-label`}
        checked={selected}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        name="roleKey"
        onChange={() => onRoleChange(role)}
        required
        type="radio"
        value={role}
      />
      <span className="flex h-full min-h-20 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-start shadow-sm motion-safe:transition-[background-color,border-color,box-shadow] motion-safe:duration-200 peer-hover:border-accent/55 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:shadow-accent/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
        <RoleAvatar portrait={portrait} selected={selected} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="text-sm font-semibold text-foreground" id={`${cardId}-label`}>
            {roleLabelAr(role)}
          </span>
          <span className="text-xs leading-5 text-muted" id={`${cardId}-hint`}>
            {portrait.description}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`grid size-5 shrink-0 place-items-center rounded-full border motion-safe:transition-[background-color,border-color] motion-safe:duration-200 ${
            selected ? "border-accent bg-accent text-white" : "border-muted/65 bg-surface"
          }`}
        >
          {selected ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
        </span>
      </span>
    </label>
  );
}

export function TeamRolePicker({
  options,
  selectedRole,
  onRoleChange,
  disabled,
}: {
  options: readonly TeamRoleOption[];
  selectedRole: TeamRoleOption | "";
  onRoleChange: (role: TeamRoleOption) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-2 text-sm font-semibold">الدور</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((role) => (
          <TeamRoleCard
            key={role}
            onRoleChange={onRoleChange}
            role={role}
            selected={selectedRole === role}
          />
        ))}
      </div>
    </fieldset>
  );
}

const previewCapabilities: readonly { permission: PermissionId; label: string }[] = [
  { permission: PERMISSIONS.USER_INVITE, label: "دعوة أعضاء جدد إلى الفريق" },
  { permission: PERMISSIONS.CLIENT_CREATE, label: "إعداد العملاء" },
  { permission: PERMISSIONS.PACKAGE_CREATE, label: "إعداد باقات العمل" },
  { permission: PERMISSIONS.DELIVERABLE_VIEW, label: "عرض المخرجات المتاحة للعضو" },
  { permission: PERMISSIONS.DELIVERABLE_CREATE, label: "إنشاء المخرجات" },
  { permission: PERMISSIONS.DELIVERABLE_VERSION_SUBMIT, label: "تقديم نسخ العمل للمراجعة" },
  { permission: PERMISSIONS.DELIVERABLE_INTERNAL_APPROVE, label: "الاعتماد الداخلي للمخرجات" },
  { permission: PERMISSIONS.DELIVERABLE_SEND_TO_CLIENT, label: "إرسال النسخة المعتمدة للعميل" },
];

function describeCapabilities(role: TeamRoleOption) {
  if (role === "marketing_manager" || role === "performance_specialist") {
    return ["يحدد النظام الإجراءات المتاحة لهذا الدور حسب نطاق العمل والإسناد."];
  }
  return previewCapabilities
    .filter(({ permission }) => roleGrantsPermission(role, permission))
    .map(({ label }) => label);
}

function AccessDetails({
  role,
  scopeNames,
}: {
  role: TeamRoleOption;
  scopeNames: readonly string[];
}) {
  return (
    <>
      <p className="font-semibold text-foreground">{roleLabelAr(role)}</p>
      <p className="text-xs leading-5 text-muted">
        <span className="font-semibold text-foreground">النطاق </span>
        {scopeNames.length > 0
          ? scopeNames.map((name, index) => (
            <span key={`${name}-${index}`}>
              {index > 0 ? "، " : null}<bdi className="wrap-anywhere">{name}</bdi>
            </span>
          ))
          : "لم يُحدد بعد"}
      </p>
      <ul className="grid list-disc gap-1 ps-5 marker:text-accent">
        {describeCapabilities(role).map((label) => <li key={label}>{label}</li>)}
      </ul>
      <p className="text-xs leading-5 text-muted">
        تعرض المعاينة هذا الإسناد فقط. تعتمد إمكانية تنفيذ كل إجراء على نطاقه وإسناد العمل وحالته.
      </p>
    </>
  );
}

export function TeamAccessPreview({
  role,
  scopeNames,
}: {
  role: TeamRoleOption | "";
  scopeNames: readonly string[];
}) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="grid min-w-0 gap-3 rounded-2xl border border-accent/25 bg-accent-soft/50 p-4"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground" id={headingId}>
        <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-accent" />
        معاينة الصلاحيات
      </p>
      <div aria-live="polite" className="grid gap-2 text-sm text-foreground">
        {role ? (
          <AccessDetails role={role} scopeNames={scopeNames} />
        ) : (
          <p className="text-muted">اختر الدور والنطاق لمراجعة الصلاحيات قبل الحفظ.</p>
        )}
      </div>
    </section>
  );
}