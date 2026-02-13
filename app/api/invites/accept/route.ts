import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { room_id } = await req.json();

  if (!room_id) {
    return NextResponse.json({ error: "Missing room_id" }, { status: 400 });
  }

  // Get logged-in user (normal client)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 🔎 Verify invite exists & belongs to this user
  const { data: invite, error: inviteError } = await admin
    .from("invites")
    .select("*")
    .eq("room_id", room_id)
    .eq("invitee_email", user.email)
    .eq("status", "pending")
    .single();

  if (!invite || inviteError) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  // 🛑 Check room isn't already taken
  const { data: room } = await admin
    .from("rooms")
    .select("*")
    .eq("id", room_id)
    .single();

  if (room.partner_id) {
    return NextResponse.json(
      { error: "Room already has a partner" },
      { status: 400 }
    );
  }

  // ✅ Update invite
  await admin
    .from("invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  // ✅ Update room
  await admin
    .from("rooms")
    .update({
      partner_id: user.id,
      status: "playing",
    })
    .eq("id", room_id);

  return NextResponse.json({ success: true, room_id });
}
