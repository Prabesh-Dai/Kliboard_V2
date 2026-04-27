import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let query = admin
    .from("spaces")
    .select("id, name, content, duration, expires_at, owner_id, is_locked, created_at, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    spaces: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { spaceIds } = await request.json();
  if (!Array.isArray(spaceIds) || !spaceIds.length) {
    return NextResponse.json({ error: "No space IDs provided" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: files } = await admin
    .from("files")
    .select("storage_path")
    .in("space_id", spaceIds);

  if (files?.length) {
    const paths = files.map((f) => f.storage_path);
    const { error: removeError } = await admin.storage
      .from("space-files")
      .remove(paths);
    if (removeError) {
      console.error("storage.remove failed (admin bulk delete)", {
        paths,
        removeError,
      });
    }
  }

  const { error } = await admin.from("spaces").delete().in("id", spaceIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: spaceIds.length });
}
