// ...existing code...
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log("/api/game/status (admin) hit", { url: request.url });

    const roomId = request.nextUrl.searchParams.get("roomId");

    if (!roomId) {
      console.warn("/api/game/status missing roomId");
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    console.log("Checking questions count for room", { roomId });

    const { count, error } = await supabaseAdmin
      .from("questions")
      .select("id", { head: true, count: "exact" })
      .eq("room_id", roomId);

    console.log("Supabase count response", { count, error });

    if (error) {
      console.error("Supabase error fetching question count:", error);
      return NextResponse.json({ error: "Failed to fetch game state" }, { status: 500 });
    }

    const readyCount = count ?? 0;
    const partnerReady = readyCount >= 2;

    console.log("Status result", { roomId, readyCount, partnerReady });

    return NextResponse.json({ partnerReady });
  } catch (err) {
    console.error("Status endpoint crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// ...existing code...