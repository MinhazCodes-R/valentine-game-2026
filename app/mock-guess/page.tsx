"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, Loader2 } from "lucide-react";

const QUESTION_COUNT = 5;

type Question = {
  id: string;
  question: string;
  correct: string;
  wrong1: string;
  wrong2: string;
  wrong3: string;
};

type Guessed = {
  question: Question;
  selected: string;
  correct: boolean;
  partnerAnswer: string;
};

export default function MockGuessPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams?.get("roomId") || "";
  const visitorId = searchParams?.get("visitorId") || "";

  const [phase, setPhase] = useState<"loading" | "guessing" | "finished">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [guessed, setGuessed] = useState<Guessed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch partner's questions on mount
  useEffect(() => {
    const fetchPartnerQuestions = async () => {
      try {
        const response = await fetch(
          `/api/game/questions?roomId=${roomId}&visitorId=${visitorId}`
        );

        if (!response.ok) {
          console.error("Failed to fetch questions");
          return;
        }

        const data = await response.json();
        setQuestions(data.questions);
        setPhase("guessing");
      } catch (error) {
        console.error("Error fetching partner questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId && visitorId) {
      fetchPartnerQuestions();
    }
  }, [roomId, visitorId]);

  // Auto scroll when new question appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guessed]);

  // --------------------------
  // LOADING PHASE
  // --------------------------

  if (phase === "loading" || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-6 animate-in fade-in duration-700">
          <Heart className="mx-auto h-12 w-12 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold text-foreground">
            Loading Partner's Questions...
          </h1>
          <p className="text-muted-foreground">
            Get ready to guess!
          </p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  // --------------------------
  // GUESSING PHASE
  // --------------------------

  if (phase === "guessing") {
    const currentIndex = guessed.length;
    const currentQ = questions[currentIndex];

    const handleGuess = (option: string) => {
      const isCorrect = option === currentQ.correct;

      const newGuessed = [
        ...guessed,
        {
          question: currentQ,
          selected: option,
          correct: isCorrect,
          partnerAnswer: currentQ.correct,
        },
      ];

      setGuessed(newGuessed);

      if (newGuessed.length === QUESTION_COUNT) {
        setTimeout(() => setPhase("finished"), 800);
      }
    };

    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-xl space-y-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart className="text-primary" />
            Guess Your Partner's Answers
          </h1>

          {/* Previously Guessed Questions */}
          {guessed.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-6 space-y-3 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <p className="text-muted-foreground text-sm">
                Question {i + 1}
              </p>

              <h2 className="text-lg font-semibold text-foreground">
                {item.question.question}
              </h2>

              <p
                className={`font-medium ${
                  item.correct ? "text-primary" : "text-destructive"
                }`}
              >
                Your Guess: {item.selected}
              </p>

              {!item.correct && (
                <p className="text-sm text-muted-foreground">
                  Their Answer: {item.partnerAnswer}
                </p>
              )}
            </div>
          ))}

          {/* Current Question */}
          {currentIndex < QUESTION_COUNT && currentQ && (
            <div className="rounded-xl border-2 border-primary bg-card p-6 space-y-6 shadow-md animate-in fade-in slide-in-from-bottom-6 duration-500">
              <p className="text-muted-foreground text-sm">
                Question {currentIndex + 1}
              </p>

              <h2 className="text-xl font-semibold text-foreground">
                {currentQ.question}
              </h2>

              <div className="space-y-3">
                {[
                  currentQ.correct,
                  currentQ.wrong1,
                  currentQ.wrong2,
                  currentQ.wrong3,
                ]
                  .sort(() => Math.random() - 0.5)
                  .map((opt, idx) => (
                    <Button
                      key={opt}
                      variant="outline"
                      onClick={() => handleGuess(opt)}
                      className="w-full justify-start h-auto py-4 px-5 text-base hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full bg-muted text-muted-foreground font-semibold text-sm">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-left">{opt}</span>
                    </Button>
                  ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>
    );
  }

  // --------------------------
  // FINISHED
  // --------------------------

  const score = guessed.filter((g) => g.correct).length;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-6 animate-in fade-in duration-700">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">
          Amazing!
        </h1>
        <p className="text-muted-foreground max-w-sm">
          You correctly guessed {score}/{QUESTION_COUNT} of your partner's answers
        </p>
        <div className="text-4xl font-bold text-primary">
          {Math.round((score / QUESTION_COUNT) * 100)}%
        </div>
        <Button onClick={() => window.location.reload()}>
          Play Again
        </Button>
      </div>
    </main>
  );
}