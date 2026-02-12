import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch profile (RLS protects this)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch rooms created by user
  const { data: myRooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  // 🔥 Fetch invites (RLS automatically filters)
  const { data: pendingInvites, error: invitesError } = await supabase
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
    .eq("status", "pending");

  // Debug (safe to remove later)
  console.log("========== DASHBOARD DEBUG ==========");
  console.log("User:", user.email);
  console.log("Profile Error:", profileError);
  console.log("Rooms Error:", roomsError);
  console.log("Invites Error:", invitesError);
  console.log("Pending Invites:", pendingInvites);
  console.log("=====================================");

  return (
    <DashboardClient
      user={user}
      profile={profile}
      myRooms={myRooms || []}
      pendingInvites={pendingInvites || []}
    />
  );
}
