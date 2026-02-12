"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, Loader2 } from "lucide-react";

const QUESTION_COUNT = 5;

type Question = {
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

// Fake partner questions for demo
const FAKE_PARTNER_QUESTIONS: Question[] = [
  {
    question: "What's my favorite color?",
    correct: "Blue",
    wrong1: "Red",
    wrong2: "Green",
    wrong3: "Yellow",
  },
  {
    question: "What's my dream vacation destination?",
    correct: "Paris",
    wrong1: "Tokyo",
    wrong2: "New York",
    wrong3: "Sydney",
  },
  {
    question: "What's my favorite food?",
    correct: "Pizza",
    wrong1: "Sushi",
    wrong2: "Tacos",
    wrong3: "Pasta",
  },
  {
    question: "What's the name of my favorite pet?",
    correct: "Luna",
    wrong1: "Max",
    wrong2: "Charlie",
    wrong3: "Bella",
  },
  {
    question: "What's my favorite hobby?",
    correct: "Reading",
    wrong1: "Gaming",
    wrong2: "Painting",
    wrong3: "Hiking",
  },
];

export default function MockGuessPage() {
  const [phase, setPhase] = useState<"loading" | "guessing" | "finished">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [guessed, setGuessed] = useState<Guessed[]>([]);
  const [isStarting, setIsStarting] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Simulate loading partner's questions
    const timer = setTimeout(() => {
      setQuestions(FAKE_PARTNER_QUESTIONS);
      setPhase("guessing");
      setIsStarting(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Auto scroll when new question appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guessed]);

  // --------------------------
  // LOADING PHASE
  // --------------------------

  if (phase === "loading") {
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
      // For demo, assume the correct answer is what the player selected
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

              {item.correct && (
                <p className="text-sm text-primary font-medium">
                  ✓ You got it right!
                </p>
              )}
            </div>
          ))}

          {/* Current Question */}
          {currentIndex < QUESTION_COUNT && (
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
