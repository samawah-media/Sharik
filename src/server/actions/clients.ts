"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientFormState } from "@/modules/clients/client-form-state";
import { clientFormError } from "@/modules/clients/client-form-state";
import { normalizeClientInput } from "@/server/commands/clients/client-schemas";
import {
  createClientSchema,
  updateClientSchema,
} from "@/server/commands/clients/client-schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { guardManagementRoute } from "@/server/navigation/route-guards";
import {
  clientValuesFromFormData,
  expectedRevisionFromFormData,
  optionalFormValue,
} from "./client-write-mappers";
import { createClientViaRpc, updateClientViaRpc } from "./client-write-rpc";

const saveFailureMessage = "تعذر حفظ التغييرات بأمان.";
const validationFailureMessage = "راجع بيانات العميل ثم حاول مرة أخرى.";
const permissionFailureMessage = "لا يمكنك حفظ هذا العميل.";
const conflictFailureMessage = "تم تعديل البيانات. حدّث الصفحة ثم حاول مرة أخرى.";

const mapWriteError = (code: string | undefined) => {
  if (code === "23505") {
    return "يوجد عميل بنفس الاسم داخل هذا النطاق.";
  }

  if (code === "P0002" || code === "PGRST116") {
    return conflictFailureMessage;
  }

  if (code === "42501") {
    return permissionFailureMessage;
  }

  return saveFailureMessage;
};

const resolveWritableRuntime = async () => {
  const supabase = await createSupabaseServerClient();
  const runtime = await resolveRuntimeContext(supabase);

  if (!runtime.ok) {
    return { ok: false as const, supabase, message: permissionFailureMessage };
  }

  const access = guardManagementRoute({
    actor: runtime.actor,
    route: "clientWrite",
  });

  if (!access.allowed) {
    return { ok: false as const, supabase, message: permissionFailureMessage };
  }

  return { ok: true as const, supabase, runtime };
};

export async function createClientAction(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const values = clientValuesFromFormData(formData);
  const parsed = createClientSchema.safeParse(values);

  if (!parsed.success) {
    return clientFormError({
      message: validationFailureMessage,
      values,
    });
  }

  const writableRuntime = await resolveWritableRuntime();

  if (!writableRuntime.ok) {
    return clientFormError({
      message: writableRuntime.message,
      values,
    });
  }

  const { slug } = normalizeClientInput(parsed.data.name);
  const result = await createClientViaRpc({
    supabase: writableRuntime.supabase,
    input: {
      clientId: crypto.randomUUID(),
      auditEventId: crypto.randomUUID(),
      name: parsed.data.name,
      slug,
      primaryContactName: optionalFormValue(parsed.data.primaryContactName),
      primaryContactEmail: optionalFormValue(parsed.data.primaryContactEmail),
      primaryContactPhone: optionalFormValue(parsed.data.primaryContactPhone),
    },
  });

  if (!result.ok) {
    return clientFormError({
      message: mapWriteError(result.error.code),
      values,
    });
  }

  revalidatePath("/clients");
  redirect("/clients?saved=created");
}

export async function updateClientAction(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const values = clientValuesFromFormData(formData);
  const clientId = String(formData.get("clientId") ?? "");
  const expectedRevision = expectedRevisionFromFormData(formData);
  const parsed = updateClientSchema.safeParse({
    ...values,
    clientId,
    expectedRevision,
  });

  if (!parsed.success) {
    return clientFormError({
      message: validationFailureMessage,
      values,
    });
  }

  const writableRuntime = await resolveWritableRuntime();

  if (!writableRuntime.ok) {
    return clientFormError({
      message: writableRuntime.message,
      values,
    });
  }

  const existingClient = writableRuntime.runtime.clients.find(
    (client) => client.id === parsed.data.clientId,
  );

  if (!existingClient) {
    return clientFormError({
      message: permissionFailureMessage,
      values,
    });
  }

  const { slug } = normalizeClientInput(parsed.data.name);
  const result = await updateClientViaRpc({
    supabase: writableRuntime.supabase,
    input: {
      clientId: existingClient.id,
      auditEventId: crypto.randomUUID(),
      name: parsed.data.name,
      slug,
      primaryContactName: optionalFormValue(parsed.data.primaryContactName),
      primaryContactEmail: optionalFormValue(parsed.data.primaryContactEmail),
      primaryContactPhone: optionalFormValue(parsed.data.primaryContactPhone),
      expectedRevision: parsed.data.expectedRevision,
    },
  });

  if (!result.ok) {
    return clientFormError({
      message: mapWriteError(result.error.code),
      values,
    });
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${existingClient.id}/edit`);
  redirect("/clients?saved=updated");
}
