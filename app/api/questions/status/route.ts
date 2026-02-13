import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { count } = await admin
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId);

  const bothReady = count === 2;

  return NextResponse.json({
    bothReady,
  });
}
