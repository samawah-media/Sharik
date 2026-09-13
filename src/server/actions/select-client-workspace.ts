"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { resolveRuntimeContext } from "@/server/auth/runtime-context";
import { getClientWorkspaces } from "@/server/auth/client-workspace";
import { CLIENT_WORKSPACE_COOKIE } from "@/server/navigation/client-workspace";

export async function selectClientWorkspaceAction(
  clientId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!z.string().uuid().safeParse(clientId).success)
    return { ok: false, message: "اختر مساحة متاحة لحسابك." };
  // Lookup failures are recoverable here: leave the current preference untouched and let the user retry.
  try {
    const runtime = await resolveRuntimeContext();
    if (
      !runtime.ok ||
      !getClientWorkspaces(runtime).some((client) => client.id === clientId)
    ) {
      return {
        ok: false,
        message: "هذه المساحة غير متاحة لحسابك. حدّث الصفحة وحاول مجددًا.",
      };
    }
    (await cookies()).set(
      CLIENT_WORKSPACE_COOKIE,
      `${runtime.actor.userId}.${runtime.actor.tenantId}.${clientId}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/client",
      },
    );
    return { ok: true };
  } catch {
    return { ok: false, message: "تعذر تغيير المساحة الآن. حاول مرة أخرى." };
  }
}
