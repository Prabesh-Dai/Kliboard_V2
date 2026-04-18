import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("superadmins")
    .select("id")
    .eq("user_id", userId)
    .single();

  return Boolean(data);
}
