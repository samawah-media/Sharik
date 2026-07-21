import { expect, test, type Page } from "@playwright/test";
import { cleanWorkspaceTenantId } from "@/modules/uat/clean-workspace";
import { signInViaUi } from "./support/s015-persistent-local";
import {
  applyCleanWorkspace,
  assertCleanWorkspaceCounts,
  createPersistentActorClient,
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
