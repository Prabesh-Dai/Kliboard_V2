import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: expired, error: fetchError } = await supabase
    .from("spaces")
    .select("id")
    .lt("expires_at", new Date().toISOString());

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expired?.length) {
    return NextResponse.json({ cleaned: 0 });
  }

  const ids = expired.map((s) => s.id);

  const { data: files } = await supabase
    .from("files")
    .select("storage_path")
    .in("space_id", ids);

  if (files?.length) {
    await supabase.storage
      .from("space-files")
      .remove(files.map((f) => f.storage_path));
  }

  const { error: deleteError } = await supabase
    .from("spaces")
    .delete()
    .in("id", ids);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ cleaned: ids.length });
}
