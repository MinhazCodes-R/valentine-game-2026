import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId, questions } = await request.json();

    if (!roomId || !playerId || !questions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Insert game state for this player
    const { error } = await supabase
      .from("game_states")
      .insert({
        room_id: roomId,
        player_id: playerId,
        questions: questions,
        ready: true,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update game state" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in ready endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
