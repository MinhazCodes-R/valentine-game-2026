import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient(); // normal user client
  const admin = createAdminClient();     // 🔥 bypass RLS

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Admin queries (ignore RLS)
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: myRooms } = await admin
    .from("rooms")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const { data: pendingInvites } = await admin
  .from("invites")
  .select(`
    *,
    rooms (
      id,
      name,
      status,
      creator_id
    )
  `)
  .eq("status", "pending")
  .eq("invitee_email", user.email);


  return (
    <DashboardClient
      user={user}
      profile={profile}
      myRooms={myRooms || []}
      pendingInvites={pendingInvites || []}
    />
  );
}
