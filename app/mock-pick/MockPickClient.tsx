"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Trash2, X, Loader2 } from "lucide-react";

const QUESTION_COUNT = 5;
const POLL_INTERVAL = 2000;

type Question = {
  question: string;
  correct: string;
  wrong1: string;
  wrong2: string;
  wrong3: string;
};

export default function MockPickClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = searchParams?.get("roomId");
  const playerId = searchParams?.get("playerId");

  // 🔒 Redirect if params missing
  useEffect(() => {
    if (!roomId || !playerId) {
      router.replace("/");
    }
  }, [roomId, playerId, router]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: "",
    correct: "",
    wrong1: "",
    wrong2: "",
    wrong3: "",
  });

  // 🔁 Poll when finished
  useEffect(() => {
    if (!isFinished || !roomId || !playerId) return;

    const pollGameState = async () => {
      try {
        const res = await fetch(
          `/api/game/status?roomId=${roomId}&playerId=${playerId}`
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.partnerReady) {
          clearInterval(pollingRef.current!);
          router.push(`/mock-guess?roomId=${roomId}&visitorId=${playerId}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    pollGameState();
    pollingRef.current = setInterval(pollGameState, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isFinished, roomId, playerId, router]);

  const handleFinishSetup = async () => {
    if (questions.length !== QUESTION_COUNT || !roomId) return;

    setIsLoading(true);

    try {
      const formattedQuestions = questions.map((q) => ({
        question: q.question,
        choice1: q.correct,
        choice2: q.wrong1,
        choice3: q.wrong2,
        choice4: q.wrong3,
        correct_choice: "choice1",
      }));

      const res = await fetch("/api/questions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, questions: formattedQuestions }),
      });

      if (!res.ok) {
        console.error("Failed to save questions");
        return;
      }

      setIsFinished(true);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    if (
      !currentQuestion.question ||
      !currentQuestion.correct ||
      !currentQuestion.wrong1 ||
      !currentQuestion.wrong2 ||
      !currentQuestion.wrong3
    )
      return;

    if (editingIndex !== null) {
      const updated = [...questions];
      updated[editingIndex] = currentQuestion;
      setQuestions(updated);
      setEditingIndex(null);
    } else {
      setQuestions([currentQuestion, ...questions]);
    }

    setCurrentQuestion({
      question: "",
      correct: "",
      wrong1: "",
      wrong2: "",
      wrong3: "",
    });
  };

  const editQuestion = (index: number) => {
    setEditingIndex(index);
    setCurrentQuestion(questions[index]);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setCurrentQuestion({
      question: "",
      correct: "",
      wrong1: "",
      wrong2: "",
      wrong3: "",
    });
  };

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Heart className="text-primary" />
          Create {QUESTION_COUNT} Questions
        </h1>

        <p className="text-muted-foreground">
          {questions.length}/{QUESTION_COUNT} created
        </p>

        {questions.map((q, i) => (
          <div
            key={i}
            onClick={() => editQuestion(i)}
            className="rounded-xl border bg-card p-4 space-y-2 shadow-sm cursor-pointer"
          >
            <div className="flex justify-between">
              <p className="text-xs uppercase text-muted-foreground">
                Question {i + 1}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuestion(i);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p>{q.question}</p>
          </div>
        ))}

        {!isFinished && (
          <div className="rounded-xl border-2 border-primary bg-card p-6 space-y-4">
            <Input
              placeholder="Question"
              value={currentQuestion.question}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, question: e.target.value })
              }
            />
            <Input
              placeholder="Correct Answer"
              value={currentQuestion.correct}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, correct: e.target.value })
              }
            />
            <Input
              placeholder="Wrong Option 1"
              value={currentQuestion.wrong1}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, wrong1: e.target.value })
              }
            />
            <Input
              placeholder="Wrong Option 2"
              value={currentQuestion.wrong2}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, wrong2: e.target.value })
              }
            />
            <Input
              placeholder="Wrong Option 3"
              value={currentQuestion.wrong3}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, wrong3: e.target.value })
              }
            />

            <div className="flex gap-3">
              <Button onClick={addQuestion} className="flex-1">
                {editingIndex !== null ? "Update" : "Add"}
              </Button>
              {editingIndex !== null && (
                <Button onClick={cancelEdit} variant="outline" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {questions.length === QUESTION_COUNT && !isFinished && (
          <Button
            onClick={handleFinishSetup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Finish & Wait
          </Button>
        )}

        {isFinished && (
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Waiting for your partner...
            </p>
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
    </main>
  );
}
