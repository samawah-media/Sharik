import { expect, test } from "@playwright/test";
import {
  resetLocalDatabaseIfLifecycleSeeded,
  seedPersistentLifecycle,
  signInViaUi,
} from "./support/s015-persistent-local";

test.describe.configure({ mode: "serial", timeout: 600_000 });

test("a scoped team invitation is created, denied to the wrong email, and accepted once", async ({
  page,
}) => {
  await resetLocalDatabaseIfLifecycleSeeded();
  const { client: serviceClient, seed } = await seedPersistentLifecycle();
  const invitedActor = seed.actors.unassignedDesigner;

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto("/invitations/internal", { waitUntil: "domcontentloaded" });

  const form = page.getByRole("form", { name: "دعوة عضو داخلي" });
  await form.getByLabel("اسم العضو").fill("مصمم العميل الثاني");
  await form.getByLabel("بريد العضو").fill(invitedActor.email);
  await form.getByLabel("الدور").selectOption("designer");
  const invitedClient = form.getByRole("checkbox", { name: "Glass", exact: true });
  await expect(invitedClient).toHaveValue(seed.clientB);
  await invitedClient.check();
  await form.getByRole("button", { name: "إنشاء رابط الدعوة" }).click();

  await expect(
    form.getByText("تم إنشاء الدعوة. انسخ الرابط وشاركه مع العضو عبر قناة موثوقة."),
  ).toBeVisible();
  const invitationPath = await form
    .getByRole("link", { name: "فتح رابط الدعوة" })
    .getAttribute("href");
  expect(invitationPath).toMatch(/^\/invite\/[A-Za-z0-9_-]{40,200}$/u);

  await signInViaUi(page, seed.actors.sameTenantOtherClient);
  await page.goto(invitationPath!, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "الدعوة غير متاحة" })).toBeVisible();

  await signInViaUi(page, invitedActor);
  await page.goto(invitationPath!, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "مرحبًا مصمم العميل الثاني" }),
  ).toBeVisible();
  await expect(page.getByText(/للعمل على .* فقط/u)).toBeVisible();
  await page
    .getByRole("button", { name: "قبول الدعوة وفتح مساحة العمل" })
    .click();
  await expect(page).toHaveURL(/\/work\?invitation=accepted$/u);

  const invitation = await serviceClient
    .from("invitations")
    .select("id, status, accepted_by")
    .eq("invited_email", invitedActor.email)
    .eq("status", "accepted")
    .single();
  expect(invitation.error).toBeNull();
  expect(invitation.data?.accepted_by).toBe(invitedActor.id);

  const membership = await serviceClient
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", seed.tenantA)
    .eq("auth_user_id", invitedActor.id)
    .eq("status", "active")
    .single();
  expect(membership.error).toBeNull();

  const grantedRole = await serviceClient
    .from("role_assignments")
    .select("role_key, scope_type, scope_id, status")
    .eq("membership_id", membership.data!.id)
    .eq("role_key", "designer")
    .eq("scope_type", "client")
    .eq("scope_id", seed.clientB)
    .eq("status", "active");
  expect(grantedRole.error).toBeNull();
  expect(grantedRole.data).toHaveLength(1);

  const acceptanceAudit = await serviceClient
    .from("audit_events")
    .select("id")
    .eq("action", "InvitationAccepted")
    .eq("target_id", invitation.data!.id);
  expect(acceptanceAudit.error).toBeNull();
  expect(acceptanceAudit.data).toHaveLength(1);

  await signInViaUi(page, seed.actors.tenantAdmin);
  await page.goto("/members", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "فريق العمل" })).toBeVisible();
  const teamDirectory = page.getByLabel("أعضاء الفريق");
  const invitedMemberCard = teamDirectory
    .locator("article")
    .filter({ hasText: "مصمم العميل الثاني" });
  await expect(
    invitedMemberCard.getByRole("heading", { name: "مصمم العميل الثاني" }),
  ).toBeVisible();
  await expect(invitedMemberCard.getByText("المصمم", { exact: true })).toBeVisible();
  await expect(
    invitedMemberCard.getByLabel("عملاء العضو").getByText("Glass", { exact: true }),
  ).toBeVisible();
  await expect(invitedMemberCard.getByText(invitedActor.email)).toHaveCount(0);
});
