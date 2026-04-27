import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORPHAN_GRACE_MS } from "@/lib/constants";

const STORAGE_PAGE_SIZE = 1000;

async function sweepOrphans(supabase: ReturnType<typeof createAdminClient>) {
  const { data: known } = await supabase.from("files").select("storage_path");
  const referenced = new Set(known?.map((f) => f.storage_path) ?? []);

  const orphans: string[] = [];
  const cutoff = Date.now() - ORPHAN_GRACE_MS;

  const { data: spaceDirs } = await supabase.storage
    .from("space-files")
    .list("", { limit: STORAGE_PAGE_SIZE });

  for (const dir of spaceDirs ?? []) {
    if (!dir.name) continue;

    let offset = 0;
    while (true) {
      const { data: entries, error } = await supabase.storage
        .from("space-files")
        .list(dir.name, { limit: STORAGE_PAGE_SIZE, offset });

      if (error || !entries?.length) break;

      for (const entry of entries) {
        if (!entry.name) continue;
        const path = `${dir.name}/${entry.name}`;
        if (referenced.has(path)) continue;
        const createdAt = entry.created_at
          ? new Date(entry.created_at).getTime()
          : Date.now();
        if (createdAt < cutoff) {
          orphans.push(path);
        }
      }

      if (entries.length < STORAGE_PAGE_SIZE) break;
      offset += STORAGE_PAGE_SIZE;
    }
  }

  if (orphans.length) {
    const { error: removeError } = await supabase.storage
      .from("space-files")
      .remove(orphans);
    if (removeError) {
      console.error("storage.remove failed (orphan sweep)", {
        count: orphans.length,
        removeError,
      });
    }
  }

  return orphans.length;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: expired, error: fetchError } = await supabase
    .from("spaces")
    .select("id")
    .neq("duration", 0)
    .lt("expires_at", new Date().toISOString());

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let cleaned = 0;
  if (expired?.length) {
    const ids = expired.map((s) => s.id);

    const { data: files } = await supabase
      .from("files")
      .select("storage_path")
      .in("space_id", ids);

    if (files?.length) {
      const paths = files.map((f) => f.storage_path);
      const { error: removeError } = await supabase.storage
        .from("space-files")
        .remove(paths);
      if (removeError) {
        console.error("storage.remove failed (cron expired)", {
          paths,
          removeError,
        });
      }
    }

    const { error: deleteError } = await supabase
      .from("spaces")
      .delete()
      .in("id", ids);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    cleaned = ids.length;
  }

  const orphans = await sweepOrphans(supabase);

  return NextResponse.json({ cleaned, orphans });
}
