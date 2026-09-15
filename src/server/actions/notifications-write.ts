"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const markOneSchema = z.object({
  notificationId: z.string().uuid(),
});

export async function markNotificationReadAction(
  input: z.input<typeof markOneSchema>,
) {
  const parsed = markOneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, reason: "invalid_input" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_mark_notification_read", {
    p_notification_id: parsed.data.notificationId,
  });

  revalidatePath("/notifications", "page");
  revalidatePath("/", "layout");

  return error
    ? { ok: false as const, reason: "denied" as const }
    : { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("s015_mark_all_notifications_read");

  revalidatePath("/notifications", "page");
  revalidatePath("/", "layout");

  return error
    ? { ok: false as const, reason: "denied" as const }
    : { ok: true as const };
}
