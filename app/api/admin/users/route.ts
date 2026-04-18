import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: authData } = await admin.auth.admin.listUsers();
  const users = authData?.users ?? [];

  const { data: spaceCounts } = await admin
    .from("spaces")
    .select("owner_id");

  const countMap = new Map<string, number>();
  for (const s of spaceCounts ?? []) {
    if (s.owner_id) {
      countMap.set(s.owner_id, (countMap.get(s.owner_id) ?? 0) + 1);
    }
  }

  const { data: admins } = await admin.from("superadmins").select("user_id");
  const adminIds = new Set((admins ?? []).map((a) => a.user_id));

  const result = users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    space_count: countMap.get(u.id) ?? 0,
    is_admin: adminIds.has(u.id),
  }));

  return NextResponse.json(result);
}
