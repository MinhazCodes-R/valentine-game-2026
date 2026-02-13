import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1️⃣ Fetch room
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();

  if (!room) {
    redirect("/dashboard");
  }

  // 2️⃣ Ensure user belongs to room
  const isMember =
    room.creator_id === user.id ||
    room.partner_id === user.id;

  if (!isMember) {
    redirect("/dashboard");
  }

  // 3️⃣ Check if user has created questions
  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("room_id", room.id)
    .eq("author_id", user.id)
    .limit(1);

  const hasCreatedQuestions = questions && questions.length > 0;

  // 4️⃣ Redirect based on that
  if (!hasCreatedQuestions) {
    // User hasn't created their questions yet
    redirect(`/mock-pick?roomId=${room.id}&playerId=${user.id}`);
  } else {
    // User already created questions
    redirect(`/mock-guess?roomId=${room.id}&playerId=${user.id}`);
  }
}
