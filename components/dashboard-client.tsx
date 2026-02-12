"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
    profiles: Profile;
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
  myRooms,
  pendingInvites,
}: DashboardClientProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    // Create the room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name: newRoomName || "Our Game",
        creator_id: user.id,
        status: "waiting",
      })
      .select()
      .single();

    if (roomError) {
      setError(roomError.message);
      setIsSubmitting(false);
      return;
    }

    // Create the invite
    const { error: inviteError } = await supabase.from("invites").insert({
      room_id: room.id,
      inviter_id: user.id,
      invitee_email: partnerEmail,
      status: "pending",
    });

    if (inviteError) {
      setError(inviteError.message);
      setIsSubmitting(false);
      return;
    }

    setIsCreating(false);
    setNewRoomName("");
    setPartnerEmail("");
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleAcceptInvite(invite: Invite) {
    setAcceptingInvite(invite.id);
    const supabase = createClient();

    // Update invite status
    await supabase
      .from("invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    // Update room with partner
    await supabase
      .from("rooms")
      .update({ partner_id: user.id })
      .eq("id", invite.room_id);

    setAcceptingInvite(null);
    router.push(`/room/${invite.room_id}`);
  }

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
            <span className="font-semibold text-foreground">Know Your Partner</span>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.display_name || "there"}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create a new game or continue playing with your partner
          </p>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <Mail className="h-5 w-5 text-primary" />
              Pending Invites
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{invite.rooms.name}</CardTitle>
                    <CardDescription>
                      Invited by {invite.rooms.profiles?.display_name || "Someone"}
                    </CardDescription>
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
          </div>
        )}

        {/* Create Game Button */}
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
                <DialogDescription>
                  Set up a game room and invite your partner to play
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="roomName">Game Name (optional)</Label>
                  <Input
                    id="roomName"
                    placeholder="Our Love Quiz"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partnerEmail">{"Partner's Email"}</Label>
                  <Input
                    id="partnerEmail"
                    type="email"
                    placeholder="partner@example.com"
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

        {/* My Games */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">My Games</h2>
          {myRooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground">No games yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first game and invite your partner to play!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myRooms.map((room) => (
                <Card key={room.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      {getRoomStatusBadge(room.status)}
                    </div>
                    <CardDescription>
                      Created {new Date(room.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full bg-transparent">
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
          )}
        </div>
      </div>
    </main>
  );
}
