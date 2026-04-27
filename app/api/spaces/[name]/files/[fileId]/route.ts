import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string; fileId: string }> }
) {
  const { fileId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: file } = await supabase
    .from("files")
    .select("id, storage_path, space_id")
    .eq("id", fileId)
    .single();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: space } = await supabase
    .from("spaces")
    .select("owner_id, is_locked")
    .eq("id", file.space_id)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const userIsAdmin = await isAdmin(user.id);
  const isOwner = space.owner_id === user.id;
  if (space.is_locked && !isOwner && !userIsAdmin) {
    return NextResponse.json({ error: "Space is locked" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: deleted, error } = await admin
    .from("files")
    .delete()
    .eq("id", file.id)
    .select()
    .single();

  if (error || !deleted) {
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }

  const { error: removeError } = await admin.storage
    .from("space-files")
    .remove([file.storage_path]);
  if (removeError) {
    console.error("storage.remove failed (file DELETE)", {
      path: file.storage_path,
      removeError,
    });
  }

  return NextResponse.json({ deleted: true });
}
