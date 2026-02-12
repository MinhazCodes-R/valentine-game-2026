import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get("roomId");
    const playerId = searchParams.get("playerId");

    if (!roomId || !playerId) {
      return NextResponse.json(
        { error: "Missing roomId or playerId" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get all game states for this room
    const { data: gameStates, error } = await supabase
      .from("game_states")
      .select("*")
      .eq("room_id", roomId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch game state" },
        { status: 500 }
      );
    }

    // Check if both players are ready
    const playersReady = gameStates?.filter((state) => state.ready) || [];
    const totalPlayers = new Set(gameStates?.map((state) => state.player_id) || []).size;

    // If there are at least 2 players and both are ready
    const partnerReady = playersReady.length === 2 && totalPlayers === 2;

    return NextResponse.json({
      partnerReady,
      readyCount: playersReady.length,
      totalPlayers,
      gameStates,
    });
  } catch (error) {
    console.error("Error in status endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
