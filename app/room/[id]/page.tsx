import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const fakeUser = {
    id: "demo-user",
    email: "demo@example.com",
  } as any;

  const fakeProfile = {
    id: "demo-user",
    display_name: "Demo User",
  };

  const fakeRooms = [
    {
      id: "room-1",
      name: "Demo Love Game",
      creator_id: "demo-user",
      partner_id: null,
      status: "waiting",
      created_at: new Date().toISOString(),
    },
  ];

  const fakeInvites = [
    {
      id: "invite-1",
      room_id: "room-1",
      status: "pending",
      rooms: {
        id: "room-1",
        name: "Demo Love Game",
        status: "waiting",
        creator_id: "demo-user",
      },
    },
  ];

  return (
    <DashboardClient
      user={fakeUser}
      profile={fakeProfile}
      myRooms={fakeRooms}
      pendingInvites={fakeInvites}
    />
  );
}
