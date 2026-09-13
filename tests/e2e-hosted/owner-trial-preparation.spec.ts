import { expect, test, type Browser, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  createHostedActorClient,
  seedHostedLifecycle,
} from "./support/hosted-lifecycle-harness";
import {
  hostedPersona,
  signInHostedPersona,
  type HostedPersona,
} from "./support/uat-personas";

test.describe.configure({ mode: "serial", timeout: 300_000 });

const vercelStorageStatePath = path.resolve(
  process.cwd(),
  "test-results/s015-vercel-share-state.json",
);

const withPersona = async ({
  actor,
  baseURL,
  browser,
  run,
}: {
  actor: HostedPersona;
  baseURL: string;
  browser: Browser;
  run: (page: Page) => Promise<void>;
}) => {
  const context = await browser.newContext({
    baseURL,
    ...(fs.existsSync(vercelStorageStatePath)
      ? { storageState: vercelStorageStatePath }
      : {}),
  });
  try {
    const page = await context.newPage();
    await signInHostedPersona(page, actor);
    await run(page);
  } finally {
    await context.close();
  }
};

const expectRpcSuccess = (
  response: { error: { code?: string; message: string } | null },
  label: string,
) => {
  if (response.error) {
    throw new Error(
      `${label} failed (${response.error.code ?? "unknown"}): ${response.error.message}`,
    );
  }
};

const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Owner-trial preparation requires ${key}.`);
  return value;
};

const ensureUnassignedContributorScope = async () => {
  const supabaseUrl = requiredEnv("S015_UAT_SUPABASE_URL");
  const publishableKey = requiredEnv("S015_UAT_PUBLISHABLE_KEY");
  const sessionFor = () =>
    createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  const approver = sessionFor();
  const unassigned = sessionFor();
  const admin = sessionFor();
  const approverPersona = hostedPersona("CLIENT_APPROVER");
  const unassignedPersona = hostedPersona("UNASSIGNED");
  const adminPersona = hostedPersona("ADMIN");

  try {
    const [approverSignIn, unassignedSignIn, adminSignIn] = await Promise.all([
      approver.auth.signInWithPassword(approverPersona),
      unassigned.auth.signInWithPassword(unassignedPersona),
      admin.auth.signInWithPassword(adminPersona),
    ]);
    if (approverSignIn.error || !approverSignIn.data.user) {
      throw new Error("Owner-trial approver scope sign-in failed.");
    }
    if (unassignedSignIn.error || !unassignedSignIn.data.user) {
      throw new Error("Owner-trial unassigned scope sign-in failed.");
    }
    if (adminSignIn.error || !adminSignIn.data.user) {
      throw new Error("Owner-trial admin scope sign-in failed.");
    }

    const approverMemberships = await approver
      .from("tenant_memberships")
      .select("id")
      .eq("auth_user_id", approverSignIn.data.user.id)
      .eq("status", "active");
    expect(approverMemberships.error).toBeNull();
    const approverRole = await approver
      .from("role_assignments")
      .select("tenant_id, scope_id")
      .in(
        "membership_id",
        (approverMemberships.data ?? []).map((row) => row.id),
      )
      .eq("role_key", "client_approver")
      .eq("scope_type", "client")
      .eq("status", "active")
      .limit(1)
      .single();
    expect(approverRole.error).toBeNull();
    const clientId = approverRole.data!.scope_id;

    const unassignedMemberships = await unassigned
      .from("tenant_memberships")
      .select("id")
      .eq("auth_user_id", unassignedSignIn.data.user.id)
      .eq("tenant_id", approverRole.data!.tenant_id)
      .eq("status", "active");
    expect(unassignedMemberships.error).toBeNull();
    const existingRole = await unassigned
      .from("role_assignments")
      .select("id")
      .in(
        "membership_id",
        (unassignedMemberships.data ?? []).map((row) => row.id),
      )
      .eq("scope_type", "client")
      .eq("scope_id", clientId)
      .eq("status", "active")
      .limit(1);
    expect(existingRole.error).toBeNull();
    if ((existingRole.data ?? []).length > 0) return;

    const invitationToken = randomBytes(48).toString("base64url");
    const invitationKey = `s015-b7-invite-${crypto.randomUUID()}`;
    expectRpcSuccess(
      await admin.rpc("s015_invite_internal_team_member_v2", {
        invited_display_name_input: unassignedPersona.label,
        invited_email_input: unassignedPersona.email,
        role_key_input: "content_writer",
        target_client_id: clientId,
        invitation_token_input: invitationToken,
        request_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        request_idempotency_key: invitationKey,
      }),
      "invite unassigned boundary persona",
    );
    expectRpcSuccess(
      await unassigned.rpc("s015_accept_internal_team_invitation", {
        invitation_token_input: invitationToken,
        request_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        request_idempotency_key: `${invitationKey}-accept`,
      }),
      "accept unassigned boundary persona invitation",
    );
  } finally {
    await Promise.all([
      approver.auth.signOut(),
      unassigned.auth.signOut(),
      admin.auth.signOut(),
    ]);
  }
};

test("prepares one scoped owner-trial item and verifies both client roles", async ({
  baseURL,
  browser,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "hosted-desktop-chromium",
    "Owner-trial preparation mutates the approved UAT exactly once.",
  );
  if (process.env.S015_B7_PREPARE_CONFIRM !== "1") {
    throw new Error(
      "Owner-trial preparation requires S015_B7_PREPARE_CONFIRM=1.",
    );
  }
  if (!baseURL) throw new Error("Owner-trial preparation requires a base URL.");

  await ensureUnassignedContributorScope();
  const { client, seed } = await seedHostedLifecycle({ ownerTrial: true });
  const versionId = crypto.randomUUID();
  const reviewUploadAttemptId = crypto.randomUUID();
  const reviewFileId = crypto.randomUUID();
  const reviewFileName = `owner-review-${seed.runId.slice(-10)}.png`;
  const reviewStoragePath = `${seed.tenantId}/${seed.clientId}/${seed.deliverableId}/${versionId}/${reviewFileName}`;
  const reviewUploadIdempotencyKey = `${seed.runId}-owner-review-image`;
  const reviewPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const writer = await createHostedActorClient({
    actor: seed.actors.CONTENT_WRITER,
    seed,
  });
  const admin = await createHostedActorClient({
    actor: seed.actors.ADMIN,
    seed,
  });

  try {
    expectRpcSuccess(
      await writer.rpc("s015_save_or_submit_version", {
        target_client_id: seed.clientId,
        target_deliverable_id: seed.deliverableId,
        target_version_id: versionId,
        target_version_number: 1,
        target_submit: true,
        target_brief: "مادة صناعية مخصصة لتجربة المالك على Preview فقط.",
        target_content_body:
          "هذا محتوى تجريبي آمن لمراجعة رحلة العميل، ولا يمثل بيانات عميل حقيقية.",
        target_caption: "نسخة تجريبية لمراجعة الاعتماد داخل منصة سماوة.",
        target_channel: "Instagram",
        target_format: "Post",
        target_objective: "التحقق من وضوح تجربة الاعتماد",
        target_kpi: "Owner UAT",
        target_source_reference: seed.runId,
        request_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        request_idempotency_key: `${seed.runId}-submit-v1`,
      }),
      "submit owner-trial version",
    );

    expectRpcSuccess(
      await writer.rpc("s015_begin_file_upload_attempt", {
        target_attempt_id: reviewUploadAttemptId,
        target_file_id: reviewFileId,
        target_client_id: seed.clientId,
        target_deliverable_id: seed.deliverableId,
        target_version_id: versionId,
        target_bucket_id: "deliverable-assets",
        target_storage_path: reviewStoragePath,
        target_file_name: reviewFileName,
        target_file_type: "image/png",
        target_file_size: reviewPng.byteLength,
        target_visibility: "internal_only",
        target_is_final: false,
        target_replaces_file_id: null,
        target_run_id: seed.runId,
        request_idempotency_key: reviewUploadIdempotencyKey,
        audit_event_id: crypto.randomUUID(),
      }),
      "begin owner-trial review image upload",
    );
    expectRpcSuccess(
      await writer.storage
        .from("deliverable-assets")
        .upload(reviewStoragePath, reviewPng, {
          contentType: "image/png",
          upsert: false,
        }),
      "upload owner-trial review image",
    );
    expectRpcSuccess(
      await writer.rpc("s015_register_file_asset", {
        target_file_id: reviewFileId,
        target_client_id: seed.clientId,
        target_deliverable_id: seed.deliverableId,
        target_version_id: versionId,
        target_bucket_id: "deliverable-assets",
        target_storage_path: reviewStoragePath,
        target_file_name: reviewFileName,
        target_file_type: "image/png",
        target_file_size: reviewPng.byteLength,
        target_visibility: "internal_only",
        target_is_final: false,
        request_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        request_idempotency_key: reviewUploadIdempotencyKey,
      }),
      "register owner-trial review image",
    );

    expectRpcSuccess(
      await admin.rpc("s015_execute_internal_workflow", {
        target_client_id: seed.clientId,
        target_deliverable_id: seed.deliverableId,
        target_version_id: versionId,
        target_command: "approve_internal",
        target_version_number: null,
        command_comment: "تجهيز مادة صناعية لتجربة المالك المنظمة.",
        request_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        request_idempotency_key: `${seed.runId}-approve_internal`,
      }),
      "approve_internal",
    );
    expectRpcSuccess(
      await admin.rpc("s015_stage_file_for_client_review", {
        target_client_id: seed.clientId,
        target_deliverable_id: seed.deliverableId,
        target_version_id: versionId,
        target_file_id: reviewFileId,
        request_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        request_idempotency_key: `${seed.runId}-stage-review-image`,
      }),
      "stage owner-trial review image",
    );
    expectRpcSuccess(
      await admin.rpc("s015_execute_internal_workflow", {
        target_client_id: seed.clientId,
        target_deliverable_id: seed.deliverableId,
        target_version_id: versionId,
        target_command: "send_to_client",
        target_version_number: null,
        command_comment: "تجهيز مادة صناعية لتجربة المالك المنظمة.",
        request_id: crypto.randomUUID(),
        audit_event_id: crypto.randomUUID(),
        request_idempotency_key: `${seed.runId}-send_to_client`,
      }),
      "send_to_client",
    );

    const persisted = await client
      .from("deliverables")
      .select("status, current_version_id, import_run_id")
      .eq("id", seed.deliverableId)
      .single();
    expect(persisted.error).toBeNull();
    expect(persisted.data).toMatchObject({
      status: "waiting_client_approval",
      current_version_id: versionId,
      import_run_id: seed.runId,
    });
    const stagedFile = await client
      .from("file_assets")
      .select("id, visibility, version_id, upload_state")
      .eq("id", reviewFileId)
      .single();
    expect(stagedFile.error).toBeNull();
    expect(stagedFile.data).toMatchObject({
      id: reviewFileId,
      visibility: "client_visible",
      version_id: versionId,
      upload_state: "ready",
    });
    const uploadAudit = await client
      .from("audit_events")
      .select("action, target_id")
      .eq("tenant_id", seed.tenantId)
      .eq("client_id", seed.clientId)
      .eq("target_id", reviewUploadAttemptId);
    expect(uploadAudit.error).toBeNull();
    expect((uploadAudit.data ?? []).map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "FileUploadAttemptStarted",
        "FileUploadAttemptReady",
      ]),
    );

    await withPersona({
      actor: seed.actors.CLIENT_VIEWER,
      baseURL,
      browser,
      run: async (page) => {
        await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
        const detail = page.getByTestId("client-approval-detail");
        await expect(detail).toContainText(seed.deliverableName);
        await expect(
          detail.getByRole("img", { name: reviewFileName }),
        ).toBeVisible({ timeout: 60_000 });
        await expect(
          detail.getByRole("button", { name: "تنزيل" }),
        ).toBeVisible();
        await expect(
          detail.getByRole("button", { name: "اعتماد" }),
        ).toHaveCount(0);
        await expect(
          detail.getByRole("button", { name: "طلب تعديل" }),
        ).toHaveCount(0);
      },
    });

    await withPersona({
      actor: seed.actors.CLIENT_APPROVER,
      baseURL,
      browser,
      run: async (page) => {
        await page.goto("/client/pending", { waitUntil: "domcontentloaded" });
        const detail = page.getByTestId("client-approval-detail");
        await expect(detail).toContainText(seed.deliverableName);
        await expect(
          detail.getByRole("img", { name: reviewFileName }),
        ).toBeVisible({ timeout: 60_000 });
        await expect(
          detail.getByRole("button", { name: "اعتماد" }),
        ).toBeVisible();
        await expect(
          detail.getByRole("button", { name: "طلب تعديل" }),
        ).toBeVisible();
      },
    });

    process.stdout.write(
      `${JSON.stringify({
        status: "prepared",
        category: "b7_owner_trial",
        runId: seed.runId,
        counts: { pendingClientApproval: 1 },
      })}\n`,
    );
  } finally {
    await writer.auth.signOut();
    await admin.auth.signOut();
  }
});
