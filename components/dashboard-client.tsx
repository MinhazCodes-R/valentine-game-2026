"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  LogOut,
  Loader2,
  Mail,
  Users,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const POLL_INTERVAL = 3000;

interface Profile {
  id: string;
  display_name: string | null;
}

interface Room {
  id: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  creator_id: string;
  partner_id: string | null;
  created_at: string;
}

interface Invite {
  id: string;
  room_id: string;
  status: string;
  rooms: {
    id: string;
    name: string;
    status: string;
    creator_id: string;
  };
}

interface DashboardClientProps {
  user: User;
  profile: Profile | null;
  myRooms: Room[];
  pendingInvites: Invite[];
}

export function DashboardClient({
  user,
  profile,
  myRooms: initialRooms,
  pendingInvites: initialInvites,
}: DashboardClientProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [myRooms, setMyRooms] = useState(initialRooms || []);
  const [pendingInvites, setPendingInvites] = useState(initialInvites || []);

  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);

  // -------------------------
  // POLLING
  // -------------------------

  useEffect(() => {
    async function pollDashboard() {
      try {
        const res = await fetch("/api/dashboard/poll");


        if (!res.ok) return;

        const data = await res.json();

        setMyRooms(data.rooms || []);
        setPendingInvites(data.invites || []);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    pollDashboard();
    intervalRef.current = setInterval(pollDashboard, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user.id, user.email]);

  // -------------------------
  // CREATE ROOM + INVITE
  // -------------------------

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();

    if (!partnerEmail) {
      setError("Partner email is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName || "Our Game",
          creator_id: user.id,
          partner_email: partnerEmail.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create room");
        setIsSubmitting(false);
        return;
      }

      // reset UI
      setIsCreating(false);
      setNewRoomName("");
      setPartnerEmail("");
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred");
      setIsSubmitting(false);
    }
  }

  // -------------------------
  // ACCEPT INVITE
  // -------------------------

  async function handleAcceptInvite(invite: Invite) {
    setAcceptingInvite(invite.id);

    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: invite.room_id }),
      });

      const data = await res.json();
      setAcceptingInvite(null);

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      router.push(`/room/${data.room_id}`);
    } catch (err) {
      console.error(err);
      setAcceptingInvite(null);
    }
  }

  // -------------------------
  // SIGN OUT
  // -------------------------

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function getRoomStatusBadge(status: string) {
    switch (status) {
      case "waiting":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Waiting
          </Badge>
        );
      case "playing":
        return (
          <Badge className="gap-1 bg-primary text-primary-foreground">
            <Play className="h-3 w-3" />
            Playing
          </Badge>
        );
      case "finished":
        return (
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Finished
          </Badge>
        );
      default:
        return null;
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold">Know Your Partner</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.display_name || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Create Game */}
        <div className="mb-8">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create New Game
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Game</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Game Name (optional)</Label>
                  <Input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Our Love Quiz"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Partner's Email</Label>
                  <Input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create & Send Invite"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Mail className="h-5 w-5 text-primary" />
              Pending Invites
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              {pendingInvites.map((invite) => (
                <Card key={invite.id}>
                  <CardHeader>
                    <CardTitle>{invite.rooms.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleAcceptInvite(invite)}
                      disabled={acceptingInvite === invite.id}
                      className="w-full"
                    >
                      {acceptingInvite === invite.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2 h-4 w-4" />
                          Accept & Join
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* My Games */}
        <h2 className="mb-4 text-xl font-semibold">My Games</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myRooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{room.name}</CardTitle>
                  {getRoomStatusBadge(room.status)}
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/room/${room.id}`}>
                    {room.status === "waiting"
                      ? "Continue Setup"
                      : room.status === "playing"
                      ? "Continue Playing"
                      : "View Results"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
