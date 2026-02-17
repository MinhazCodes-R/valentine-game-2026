import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rooms } = await admin
    .from("rooms")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const { data: invites } = await admin
    .from("invites")
    .select(`
      *,
      rooms (
        id,
        name,
        status,
        creator_id
      )
    `)
    .eq("status", "pending")
    .eq("invitee_email", user.email?.toLowerCase());

  return NextResponse.json({
    rooms: rooms || [],
    invites: invites || [],
  });
}
