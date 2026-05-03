import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { readRateLimiter } from "@/lib/rate-limit";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "anonymous";
  const { success } = await readRateLimiter.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(Math.max(1, parseInt(limitParam, 10) || DEFAULT_LIMIT), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("spaces")
    .select("id, name, content, duration, expires_at, created_at, updated_at, owner_id, is_locked, files(count)")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data.map(({ files, ...space }) => ({
    ...space,
    file_count: files[0]?.count ?? 0,
  }));

  return NextResponse.json(result);
}
