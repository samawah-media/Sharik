import { expect, test, type Page } from "@playwright/test";
import { cleanWorkspaceTenantId } from "@/modules/uat/clean-workspace";
import { signInViaUi } from "./support/s015-persistent-local";
import {
  applyCleanWorkspace,
  assertCleanWorkspaceCounts,
  createPersistentActorClient,
  driftPersonaSource,
  readCleanWorkspaceSourceBinding,
  rollbackCleanWorkspace,
  seedLegacyWorkspaceForCleanTrial,
  type CleanWorkspaceSeed,
} from "./support/s015-clean-workspace-seed";

test.describe.configure({ mode: "serial", timeout: 240_000 });

let seeded: CleanWorkspaceSeed;

test.beforeAll(async () => {
  seeded = await seedLegacyWorkspaceForCleanTrial();
});

const signIntoCleanWorkspace = async (page: Page, persona: keyof CleanWorkspaceSeed["actors"]) => {
  await signInViaUi(page, seeded.actors[persona]);
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/u);
};

const countActiveMembershipsInTenant = async (
  tenantId: string,
  userIds?: string[],
): Promise<number> => {
  let query = seeded.client
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  if (userIds) {
    query = query.in("auth_user_id", userIds);
  }
  const { count, error } = await query;
  expect(error, "active membership count").toBeNull();
  return count ?? 0;
};

const internalPersonaUserIds = () =>
  (
    [
      "tenantAdmin",
      "accountManager",
      "contentWriter",
      "designer",
      "unassignedWriter",
    ] as const
  ).map((persona) => seeded.actors[persona].id);

test("X009-B apply creates an empty clean workspace and hides the legacy tenant", async ({
  page,
}) => {
  await applyCleanWorkspace(seeded);

  await signIntoCleanWorkspace(page, "tenantAdmin");
  // Management can reach its clients surface in the clean workspace. The exact
  // post-sign-in redirect is timing-dependent, so navigate explicitly.
  await page.goto("/clients", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/clients/u);

  // Management surface never leaks legacy Glass/Hadna names, audit secrets, or
  // raw identifiers from the quarantined tenant.
  await expect(page.getByText("Glass")).toHaveCount(0);
  await expect(page.getByText("X009B_LEGACY_INTERNAL_SECRET")).toHaveCount(0);
  await expect(page.getByText("سماوة - Hadna/Glass")).toHaveCount(0);
  await expect(page.getByText("Glass Legacy")).toHaveCount(0);

  // X010-B-7C-9: the apply persisted the deterministic append-only binding to
  // the exact source set before disabling it.
  const binding = await readCleanWorkspaceSourceBinding(seeded);
  expect(binding, "source binding recorded").not.toBeNull();
  expect(binding?.sourceTenantId).toBe(seeded.legacyTenantId);
  expect(binding?.sourceMembershipIds).toHaveLength(5);

  await assertCleanWorkspaceCounts(seeded, {
    cleanActiveMemberships: 5,
    cleanOperationalZero: true,
    legacyAuditRows: seeded.legacyBaseline.auditRows,
    legacyLedgerRows: seeded.legacyBaseline.ledgerRows,
  });
});

test("X009-B internal client-scoped roles enter the clean workspace with an honest empty state", async ({
  browser,
}) => {
  const personas = [
    "accountManager",
    "contentWriter",
    "designer",
    "unassignedWriter",
  ] as const;

  for (const persona of personas) {
    const context = await browser.newContext();
    const personaPage = await context.newPage();
    await signIntoCleanWorkspace(personaPage, persona);

    // Client-scoped internal personas land on the portfolio root and see the
    // documented "no assigned clients" empty state, never legacy data.
    await personaPage.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await expect(
      personaPage.getByRole("heading", { name: "لا يوجد عملاء مسندون" }),
    ).toBeVisible();
    await expect(personaPage.getByText("Glass")).toHaveCount(0);
    await expect(
      personaPage.getByText("X009B_LEGACY_INTERNAL_SECRET"),
    ).toHaveCount(0);

    await context.close();
  }

  // Direct DB assertion: a signed-in account manager in the clean workspace
  // reads zero legacy rows. RLS denies cross-tenant data by omission (0 rows,
  // no error), which is the documented isolation behavior.
  const scoped = await createPersistentActorClient(seeded, "accountManager");
  const legacyRead = await scoped
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", seeded.legacyTenantId);
  expect(legacyRead.error, "legacy cross-tenant read is silently empty").toBeNull();
  expect(legacyRead.count ?? 0).toBe(0);
});

test("X009-B client personas do not receive automatic clean-workspace access", async () => {
  const cleanTenantId = cleanWorkspaceTenantId(seeded.runId);
  const scoped = await createPersistentActorClient(seeded, "clientViewer");
  const cleanMembership = await scoped
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", cleanTenantId)
    .eq("auth_user_id", seeded.actors.clientViewer.id);
  expect(cleanMembership.count ?? 0).toBe(0);
});

test("X009-B replay is idempotent: no duplicate tenant, memberships, or roles", async () => {
  const beforeTenantId = cleanWorkspaceTenantId(seeded.runId);
  // The first replay resolves the recorded binding with the source already
  // disabled (verified no-op); a second replay behaves identically.
  await applyCleanWorkspace(seeded);
  await applyCleanWorkspace(seeded);

  const tenants = await seeded.client
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("id", beforeTenantId);
  expect(tenants.error, "idempotent tenant count").toBeNull();
  expect(tenants.count ?? 0).toBe(1);

  await assertCleanWorkspaceCounts(seeded, {
    cleanActiveMemberships: 5,
    cleanOperationalZero: true,
    legacyAuditRows: seeded.legacyBaseline.auditRows,
    legacyLedgerRows: seeded.legacyBaseline.ledgerRows,
  });
});

test("X009-B rollback restores the legacy entry without touching audit or ledger history", async ({
  page,
}) => {
  await rollbackCleanWorkspace(seeded);

  // Internal personas sign back into the legacy tenant, which still holds its
  // historical data and never lost append-only evidence.
  await signIntoCleanWorkspace(page, "tenantAdmin");
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/u);

  const adminScoped = await createPersistentActorClient(seeded, "tenantAdmin");
  const legacyDeliverables = await adminScoped
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", seeded.legacyTenantId);
  expect(legacyDeliverables.error, "legacy deliverable read after rollback").toBeNull();
  expect(legacyDeliverables.count ?? 0).toBe(1);

  await assertCleanWorkspaceCounts(seeded, {
    cleanActiveMemberships: 0,
    cleanOperationalZero: true,
    legacyAuditRows: seeded.legacyBaseline.auditRows,
    legacyLedgerRows: seeded.legacyBaseline.ledgerRows,
  });
});

test("X010-B-7C-9 re-apply after rollback resolves the binding and re-provisions safely", async () => {
  // The recorded source is active again after the rollback above; a replay of
  // the same run must re-select exactly the bound set and succeed.
  await applyCleanWorkspace(seeded);

  await assertCleanWorkspaceCounts(seeded, {
    cleanActiveMemberships: 5,
    cleanOperationalZero: true,
    legacyAuditRows: seeded.legacyBaseline.auditRows,
    legacyLedgerRows: seeded.legacyBaseline.ledgerRows,
  });
  const legacyActive = await countActiveMembershipsInTenant(
    seeded.legacyTenantId,
    internalPersonaUserIds(),
  );
  expect(legacyActive).toBe(0);
  // Client personas are never part of the internal rollover: their legacy
  // entry stays exactly as it was.
  expect(
    await countActiveMembershipsInTenant(seeded.legacyTenantId, [
      seeded.actors.clientViewer.id,
    ]),
  ).toBe(1);
});

test("X010-B-7C-9 a second rollover tolerates historical inactive memberships", async ({
  page,
}) => {
  const secondRunId = `${seeded.runId}-r2`;

  // Personas are now active in the first clean workspace; every persona also
  // still carries the original legacy membership plus two historical inactive
  // memberships. The old selector failed here as ambiguous.
  await applyCleanWorkspace(seeded, secondRunId);

  const firstRunTenant = cleanWorkspaceTenantId(seeded.runId);
  const secondRunTenant = cleanWorkspaceTenantId(secondRunId);

  expect(await countActiveMembershipsInTenant(secondRunTenant)).toBe(5);
  expect(await countActiveMembershipsInTenant(firstRunTenant)).toBe(0);
  expect(
    await countActiveMembershipsInTenant(
      seeded.legacyTenantId,
      internalPersonaUserIds(),
    ),
  ).toBe(0);

  const binding2 = await readCleanWorkspaceSourceBinding(seeded, secondRunId);
  expect(binding2, "second rollover binding recorded").not.toBeNull();
  expect(binding2?.sourceTenantId).toBe(firstRunTenant);
  expect(binding2?.sourceMembershipIds).toHaveLength(5);

  // The natural entry is the new empty workspace; the quarantined source data
  // and append-only history remain untouched.
  await signIntoCleanWorkspace(page, "tenantAdmin");
  await page.goto("/clients", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Glass")).toHaveCount(0);
  await expect(page.getByText("X009B_LEGACY_INTERNAL_SECRET")).toHaveCount(0);

  await assertCleanWorkspaceCounts(
    seeded,
    {
      cleanActiveMemberships: 5,
      cleanOperationalZero: true,
      legacyAuditRows: seeded.legacyBaseline.auditRows,
      legacyLedgerRows: seeded.legacyBaseline.ledgerRows,
    },
    secondRunId,
  );
});

test("X010-B-7C-9 rollback of the second rollover restores exactly the first workspace", async () => {
  const secondRunId = `${seeded.runId}-r2`;
  await rollbackCleanWorkspace(seeded, secondRunId);

  const firstRunTenant = cleanWorkspaceTenantId(seeded.runId);
  const secondRunTenant = cleanWorkspaceTenantId(secondRunId);

  // Only the first workspace's memberships — the exact set recorded in the
  // second run's binding — become active again.
  expect(await countActiveMembershipsInTenant(firstRunTenant)).toBe(5);
  expect(await countActiveMembershipsInTenant(secondRunTenant)).toBe(0);
  // The original legacy workspace must stay quarantined: it is not part of the
  // second run's binding.
  expect(
    await countActiveMembershipsInTenant(
      seeded.legacyTenantId,
      internalPersonaUserIds(),
    ),
  ).toBe(0);

  await assertCleanWorkspaceCounts(
    seeded,
    {
      cleanActiveMemberships: 0,
      cleanOperationalZero: true,
      legacyAuditRows: seeded.legacyBaseline.auditRows,
      legacyLedgerRows: seeded.legacyBaseline.ledgerRows,
    },
    secondRunId,
  );
});

test("X010-B-7C-9 an extra active membership fails closed as ambiguous without mutation", async () => {
  const thirdRunId = `${seeded.runId}-r3`;
  const thirdRunTenant = cleanWorkspaceTenantId(thirdRunId);

  const driftId = await driftPersonaSource(seeded, "designer", "activate-extra");

  await expect(applyCleanWorkspace(seeded, thirdRunId)).rejects.toThrow(
    /CLEAN_WORKSPACE_ACTIVE_SOURCE_AMBIGUOUS/u,
  );

  // Fail-closed before mutation: the new target workspace stays empty and the
  // current active workspace is untouched.
  expect(await countActiveMembershipsInTenant(thirdRunTenant)).toBe(0);
  expect(
    await countActiveMembershipsInTenant(cleanWorkspaceTenantId(seeded.runId)),
  ).toBe(5);

  const { error } = await seeded.client
    .from("tenant_memberships")
    .delete()
    .eq("id", driftId!);
  expect(error, "drift cleanup").toBeNull();
});

test("X010-B-7C-9 a swapped persona source fails closed as a tenant mismatch without mutation", async () => {
  const fourthRunId = `${seeded.runId}-r4`;
  const fourthRunTenant = cleanWorkspaceTenantId(fourthRunId);

  await driftPersonaSource(seeded, "designer", "swap-current");

  await expect(applyCleanWorkspace(seeded, fourthRunId)).rejects.toThrow(
    /CLEAN_WORKSPACE_SOURCE_TENANT_MISMATCH/u,
  );

  expect(await countActiveMembershipsInTenant(fourthRunTenant)).toBe(0);
  expect(
    await countActiveMembershipsInTenant(cleanWorkspaceTenantId(seeded.runId)),
  ).toBe(4);

  // No audit binding exists for the rejected runs.
  expect(await readCleanWorkspaceSourceBinding(seeded, fourthRunId)).toBeNull();
});
