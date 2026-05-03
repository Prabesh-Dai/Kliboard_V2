import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: expired } = await admin
    .from("spaces")
    .select("id")
    .neq("duration", 0)
    .lt("expires_at", new Date().toISOString());

  if (!expired?.length) {
    return NextResponse.json({ deleted: 0 });
  }

  const expiredIds = expired.map((s) => s.id);

  const { data: files } = await admin
    .from("files")
    .select("storage_path")
    .in("space_id", expiredIds);

  if (files?.length) {
    const paths = files.map((f) => f.storage_path);
    const { error: removeError } = await admin.storage
      .from("space-files")
      .remove(paths);
    if (removeError) {
      console.error("storage.remove failed (purge expired)", { paths, removeError });
    }
  }

  const { error } = await admin.from("spaces").delete().in("id", expiredIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: expiredIds.length });
}
