import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    console.log("\n=========== STATUS ENDPOINT ==========");

    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get("roomId");
    const playerId = searchParams.get("playerId");

    console.log("Incoming roomId:", roomId);
    console.log("Incoming playerId:", playerId);

    if (!roomId || !playerId) {
      console.log("❌ Missing parameters");
      return NextResponse.json(
        { error: "Missing roomId or playerId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch all question rows for this room
    const { data: questionRows, error } = await supabase
      .from("questions")
      .select("*")
      .eq("room_id", roomId);

    console.log("Raw DB response:");
    console.log("Error:", error);
    console.log("Data:", questionRows);

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch game state" },
        { status: 500 }
      );
    }

    const readyCount = questionRows?.length || 0;

    // Since 1 row per player per room
    const partnerReady = readyCount === 2;

    console.log("Ready Count:", readyCount);
    console.log("Partner Ready:", partnerReady);
    console.log("=========== END STATUS ==========\n");

    return NextResponse.json({
      partnerReady,
      readyCount,
      questionRows,
    });

  } catch (error) {
    console.error("❌ Status endpoint crash:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
