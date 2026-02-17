import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, creator_id, partner_email } = body;

    if (!creator_id || !partner_email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1️⃣ Create the room
    const { data: room, error: roomError } = await admin
      .from("rooms")
      .insert({
        name: name || "Our Game",
        creator_id,
        status: "waiting",
      })
      .select()
      .single();

    if (roomError) {
      console.error("Room creation error:", roomError);
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    // 2️⃣ Create invite
    const { error: inviteError } = await admin.from("invites").insert({
      room_id: room.id,
      inviter_id: creator_id,
      invitee_email: partner_email.toLowerCase(),
      status: "pending",
    });

    if (inviteError) {
      console.error("Invite creation error:", inviteError);
      return NextResponse.json(
        { error: "Room created but invite failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room_id: room.id,
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
