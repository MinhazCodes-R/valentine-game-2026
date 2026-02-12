"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  Loader2,
  Clock,
  CheckCircle2,
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
  creator: Profile;
  partner: Profile | null;
}

interface Question {
  id: string;
  room_id: string;
  author_id: string;
  question_text: string;
  correct_answer: string;
  created_at: string;
}

interface Answer {
  id: string;
  room_id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  is_correct: boolean | null;
}

interface RoomClientProps {
  room: Room;
  user: User;
  isCreator: boolean;
  questions: Question[];
  answers: Answer[];
}

export function RoomClient({
  room: initialRoom,
  user,
  isCreator,
  questions: initialQuestions,
  answers: initialAnswers,
}: RoomClientProps) {
  const [room, setRoom] = useState(initialRoom);
  const [questions, setQuestions] = useState(initialQuestions);
  const [answers, setAnswers] = useState(initialAnswers);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const router = useRouter();

  const myQuestions = questions.filter((q) => q.author_id === user.id);
  const partnerQuestions = questions.filter((q) => q.author_id !== user.id);
  const myAnswers = answers.filter((a) => a.user_id === user.id);

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient();

    const roomChannel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.new) {
            setRoom((prev) => ({ ...prev, ...(payload.new as Room) }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions", filter: `room_id=eq.${room.id}` },
        () => {
          // Refetch questions
          supabase
            .from("questions")
            .select("*")
            .eq("room_id", room.id)
            .order("created_at", { ascending: true })
            .then(({ data }) => {
              if (data) setQuestions(data);
            });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "answers", filter: `room_id=eq.${room.id}` },
        () => {
          // Refetch answers
          supabase
            .from("answers")
            .select("*")
            .eq("room_id", room.id)
            .then(({ data }) => {
              if (data) setAnswers(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [room.id]);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setIsAddingQuestion(true);

    const supabase = createClient();
    await supabase.from("questions").insert({
      room_id: room.id,
      author_id: user.id,
      question_text: newQuestion,
      correct_answer: newAnswer,
    });

    setNewQuestion("");
    setNewAnswer("");
    setIsAddingQuestion(false);
  }

  async function handleDeleteQuestion(questionId: string) {
    const supabase = createClient();
    await supabase.from("questions").delete().eq("id", questionId);
  }

  async function handleStartGame() {
    setIsStartingGame(true);
    const supabase = createClient();
    await supabase.from("rooms").update({ status: "playing" }).eq("id", room.id);
    setIsStartingGame(false);
  }

  async function handleSubmitAnswer(question: Question) {
    setIsSubmittingAnswer(true);
    const supabase = createClient();

    const isCorrect =
      newAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();

    await supabase.from("answers").insert({
      room_id: room.id,
      question_id: question.id,
      user_id: user.id,
      answer_text: newAnswer,
      is_correct: isCorrect,
    });

    setNewAnswer("");
    setIsSubmittingAnswer(false);

    // Move to next question or finish
    if (currentQuestionIndex < partnerQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Check if both players have answered all questions
      const totalAnswersNeeded = questions.length;
      const currentAnswers = answers.length + 1;

      if (currentAnswers >= totalAnswersNeeded) {
        await supabase.from("rooms").update({ status: "finished" }).eq("id", room.id);
      }
    }
  }

  // Waiting state - no partner yet
  if (room.status === "waiting" && !room.partner_id) {
    return (
      <main className="min-h-screen bg-background">
        <Header roomName={room.name} />
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Waiting for Your Partner</CardTitle>
              <CardDescription>
                An invitation has been sent. Once they accept, you can start adding questions!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <Users className="mx-auto mb-2 h-5 w-5" />
                Your partner will receive an email invitation. They need to create an account or
                sign in to join.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Waiting state - both players adding questions
  if (room.status === "waiting") {
    const canStartGame =
      isCreator && myQuestions.length >= 3 && partnerQuestions.length >= 3;

    return (
      <main className="min-h-screen bg-background">
        <Header roomName={room.name} />
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* Status */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Your Questions</h1>
              <p className="mt-1 text-muted-foreground">
                Write questions about yourself for your partner to answer
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Setup Phase
            </Badge>
          </div>

          {/* Players */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <Card className={isCreator ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {room.creator?.display_name || "Player 1"}{" "}
                  {isCreator && <span className="text-primary">(You)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Progress value={(myQuestions.length / 3) * 100} className="h-2" />
                  <span className="text-sm text-muted-foreground">
                    {isCreator ? myQuestions.length : partnerQuestions.length}/3 questions
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className={!isCreator ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {room.partner?.display_name || "Player 2"}{" "}
                  {!isCreator && <span className="text-primary">(You)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Progress
                    value={
                      ((isCreator ? partnerQuestions.length : myQuestions.length) / 3) * 100
                    }
                    className="h-2"
                  />
                  <span className="text-sm text-muted-foreground">
                    {isCreator ? partnerQuestions.length : myQuestions.length}/3 questions
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Question Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add a Question</CardTitle>
              <CardDescription>
                Write a question about yourself that your partner will try to answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    placeholder="What's my favorite movie?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Correct Answer</Label>
                  <Input
                    id="answer"
                    placeholder="The answer only you know"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isAddingQuestion}>
                  {isAddingQuestion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Questions */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Your Questions</h2>
            {myQuestions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  You have not added any questions yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myQuestions.map((q, i) => (
                  <Card key={q.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {i + 1}. {q.question_text}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Answer: {q.correct_answer}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Start Game Button */}
          {isCreator && (
            <Button
              size="lg"
              className="w-full"
              disabled={!canStartGame || isStartingGame}
              onClick={handleStartGame}
            >
              {isStartingGame ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Game
                </>
              )}
            </Button>
          )}
          {isCreator && !canStartGame && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Both players need at least 3 questions to start
            </p>
          )}
          {!isCreator && (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-muted-foreground">
                <Clock className="mx-auto mb-2 h-5 w-5" />
                Waiting for {room.creator?.display_name || "your partner"} to start the game
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    );
  }

  // Playing state
  if (room.status === "playing") {
    const answeredQuestionIds = myAnswers.map((a) => a.question_id);
    const unansweredQuestions = partnerQuestions.filter(
      (q) => !answeredQuestionIds.includes(q.id)
    );
    const currentQuestion = unansweredQuestions[0];

    if (!currentQuestion) {
      return (
        <main className="min-h-screen bg-background">
          <Header roomName={room.name} />
          <div className="mx-auto max-w-3xl px-6 py-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">All Done!</CardTitle>
                <CardDescription>
                  {"You've answered all questions. Waiting for your partner to finish..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  value={(myAnswers.length / partnerQuestions.length) * 100}
                  className="h-3"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {myAnswers.length}/{partnerQuestions.length} questions answered
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      );
    }

    const progress = (myAnswers.length / partnerQuestions.length) * 100;

    return (
      <main className="min-h-screen bg-background">
        <Header roomName={room.name} />
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {myAnswers.length + 1} of {partnerQuestions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="mt-2 h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardDescription>
                {isCreator
                  ? room.partner?.display_name || "Your partner"
                  : room.creator?.display_name || "Your partner"}{" "}
                asks:
              </CardDescription>
              <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitAnswer(currentQuestion);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="answer">Your Answer</Label>
                  <Input
                    id="answer"
                    placeholder="Type your answer..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmittingAnswer}>
                  {isSubmittingAnswer ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Finished state - show results
  const myCorrectAnswers = myAnswers.filter((a) => a.is_correct).length;
  const myTotalAnswers = myAnswers.length;
  const myScore = myTotalAnswers > 0 ? Math.round((myCorrectAnswers / myTotalAnswers) * 100) : 0;

  const partnerAnswers = answers.filter((a) => a.user_id !== user.id);
  const partnerCorrectAnswers = partnerAnswers.filter((a) => a.is_correct).length;
  const partnerTotalAnswers = partnerAnswers.length;
  const partnerScore =
    partnerTotalAnswers > 0
      ? Math.round((partnerCorrectAnswers / partnerTotalAnswers) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-background">
      <Header roomName={room.name} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Results Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Game Complete!</h1>
          <p className="mt-2 text-muted-foreground">
            {"Here's how well you know each other"}
          </p>
        </div>

        {/* Score Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card className={myScore >= partnerScore ? "border-primary" : ""}>
            <CardHeader className="text-center">
              <CardTitle>{isCreator ? "You" : room.partner?.display_name || "You"}</CardTitle>
              <div className="text-5xl font-bold text-primary">{myScore}%</div>
              <CardDescription>
                {myCorrectAnswers} of {myTotalAnswers} correct
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className={partnerScore > myScore ? "border-primary" : ""}>
            <CardHeader className="text-center">
              <CardTitle>
                {isCreator ? room.partner?.display_name || "Partner" : room.creator?.display_name || "Partner"}
              </CardTitle>
              <div className="text-5xl font-bold text-primary">{partnerScore}%</div>
              <CardDescription>
                {partnerCorrectAnswers} of {partnerTotalAnswers} correct
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {partnerQuestions.map((q, i) => {
              const myAnswer = myAnswers.find((a) => a.question_id === q.id);
              return (
                <div key={q.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">
                    {i + 1}. {q.question_text}
                  </p>
                  <div className="mt-2 grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Correct answer:</span>
                      <span className="font-medium">{q.correct_answer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Your answer:</span>
                      <span
                        className={
                          myAnswer?.is_correct
                            ? "font-medium text-green-600"
                            : "font-medium text-destructive"
                        }
                      >
                        {myAnswer?.answer_text || "Not answered"}
                        {myAnswer?.is_correct ? (
                          <CheckCircle2 className="ml-1 inline h-4 w-4" />
                        ) : null}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Play Again */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function Header({ roomName }: { roomName: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">{roomName}</span>
        </div>
      </div>
    </header>
  );
}
