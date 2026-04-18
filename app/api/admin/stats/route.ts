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

  const [spacesResult, filesResult, usersResult] = await Promise.all([
    admin.from("spaces").select("id, expires_at, duration", { count: "exact" }),
    admin.from("files").select("size_bytes"),
    admin.auth.admin.listUsers(),
  ]);

  const totalSpaces = spacesResult.count ?? 0;
  const spaces = spacesResult.data ?? [];
  const now = new Date();
  const activeSpaces = spaces.filter(
    (s) => new Date(s.expires_at) > now || s.duration === 0
  ).length;
  const expiredSpaces = totalSpaces - activeSpaces;
  const unlimitedSpaces = spaces.filter((s) => s.duration === 0).length;

  const files = filesResult.data ?? [];
  const totalFiles = files.length;
  const totalStorageBytes = files.reduce((sum, f) => sum + f.size_bytes, 0);

  const totalUsers = usersResult.data?.users?.length ?? 0;

  return NextResponse.json({
    totalSpaces,
    activeSpaces,
    expiredSpaces,
    unlimitedSpaces,
    totalFiles,
    totalStorageBytes,
    totalUsers,
  });
}
