import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { roomId, questions } = body;

  if (!roomId || !questions || questions.length !== 5) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  // Verify user belongs to room
  const { data: room } = await admin
    .from("rooms")
    .select("creator_id, partner_id")
    .eq("id", roomId)
    .single();

  if (!room) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 }
    );
  }

  const isMember =
    room.creator_id === user.id ||
    room.partner_id === user.id;

  if (!isMember) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // Upsert questions row
  const { error } = await admin
    .from("questions")
    .upsert(
      {
        room_id: roomId,
        author_id: user.id,
        question1: questions[0],
        question2: questions[1],
        question3: questions[2],
        question4: questions[3],
        question5: questions[4],
      },
      {
        onConflict: "room_id,author_id",
      }
    );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
