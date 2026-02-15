import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get("roomId");
    const visitorId = searchParams.get("visitorId");

    if (!roomId || !visitorId) {
      return NextResponse.json(
        { error: "Missing roomId or visitorId" },
        { status: 400 }
      );
    }

    // Query rooms table to get creator_id and partner_id
    const { data: roomData, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("creator_id, partner_id")
      .eq("id", roomId)
      .single();

    if (roomError || !roomData) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Determine partner_id by comparing visitorId
    let partnerId: string;
    if (visitorId === roomData.creator_id) {
      partnerId = roomData.partner_id;
    } else if (visitorId === roomData.partner_id) {
      partnerId = roomData.creator_id;
    } else {
      return NextResponse.json(
        { error: "Visitor not part of this room" },
        { status: 403 }
      );
    }

    // Query questions table with partner_id and roomId
    const { data: questionsData, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", partnerId);

    if (questionsError) {
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: questionsData });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}