import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  console.log("\n================ DASHBOARD LOAD ================\n");

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("USER ERROR:", userError);
  console.log("USER OBJECT:", user);

  if (!user) {
    console.log("❌ No user found. Redirecting.");
    redirect("/auth/login");
  }

  console.log("User ID:", user.id);
  console.log("User Email:", user.email);
  console.log("User Email (lowercase):", user.email?.toLowerCase());

  // -------------------------------
  // PROFILE QUERY
  // -------------------------------

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("\n--- PROFILE QUERY ---");
  console.log("Profile Error:", profileError);
  console.log("Profile Data:", profile);

  // -------------------------------
  // ROOMS QUERY
  // -------------------------------

  const { data: myRooms, error: roomsError } = await admin
    .from("rooms")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  console.log("\n--- ROOMS QUERY ---");
  console.log("Rooms Error:", roomsError);
  console.log("Rooms Data:", myRooms);

  // -------------------------------
  // ALL INVITES (NO FILTER)
  // -------------------------------

  const { data: allInvites, error: allInvitesError } = await admin
    .from("invites")
    .select("*");

  console.log("\n--- ALL INVITES IN DB ---");
  console.log("All Invites Error:", allInvitesError);
  console.log("All Invites Data:", allInvites);

  // -------------------------------
  // FILTERED INVITES
  // -------------------------------

  const { data: pendingInvites, error: invitesError } = await admin
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
  .eq("invitee_email", user.email?.toLowerCase());


  console.log("\n--- FILTERED PENDING INVITES ---");
  console.log("Invites Error:", invitesError);
  console.log("Filtered Invites:", pendingInvites);
  console.log("Filtered Invites Length:", pendingInvites?.length);

  console.log("\n================ END DASHBOARD ================\n");

  return (
    <DashboardClient
      user={user}
      profile={profile}
      myRooms={myRooms || []}
      pendingInvites={pendingInvites || []}
    />
  );
}
