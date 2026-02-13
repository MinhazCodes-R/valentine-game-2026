import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  console.log("==== SUBMIT QUESTIONS API CALLED ====");

  const supabase = await createClient();
  const admin = createAdminClient();

  // 🔐 Get user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("Auth user:", user?.email);
  console.log("Auth error:", userError);

  if (!user) {
    console.log("❌ Unauthorized request");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 📦 Parse body
  const body = await req.json();
  console.log("Request body:", body);

  const { roomId, questions } = body;

  if (!roomId || !questions || questions.length !== 5) {
    console.log("❌ Invalid payload", {
      roomId,
      questionsLength: questions?.length,
    });

    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  // 🏠 Fetch room
  const { data: room, error: roomError } = await admin
    .from("rooms")
    .select("creator_id, partner_id")
    .eq("id", roomId)
    .single();

  console.log("Room fetch result:", room);
  console.log("Room fetch error:", roomError);

  if (!room) {
    console.log("❌ Room not found");
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 }
    );
  }

  // 👥 Verify membership
  const isMember =
    room.creator_id === user.id ||
    room.partner_id === user.id;

  console.log("Is member:", isMember);
  console.log("Creator ID:", room.creator_id);
  console.log("Partner ID:", room.partner_id);
  console.log("User ID:", user.id);

  if (!isMember) {
    console.log("❌ Forbidden - user not in room");
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // 💾 Upsert questions
  console.log("Upserting questions...");

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
    console.log("❌ Upsert error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  console.log("✅ Questions saved successfully");
  console.log("===================================");

  return NextResponse.json({ success: true });
}
