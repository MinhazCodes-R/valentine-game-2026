"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, Loader2 } from "lucide-react";

const QUESTION_COUNT = 5;

type Question = {
  id: string;
  question: string;
  choices: string[];
  correctChoiceKey: "choice1" | "choice2" | "choice3" | "choice4";
};

type Guessed = {
  question: Question;
  selected: string;
  correct: boolean;
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MockGuessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = searchParams?.get("roomId");
  const visitorId = searchParams?.get("visitorId");

  const [phase, setPhase] = useState<"loading" | "guessing" | "finished">(
    "loading"
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [guessed, setGuessed] = useState<Guessed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Redirect if missing params
  useEffect(() => {
    if (!roomId || !visitorId) {
      router.replace("/");
    }
  }, [roomId, visitorId, router]);

  // Fetch questions
  useEffect(() => {
    if (!roomId || !visitorId) return;

    const fetchQuestions = async () => {
      try {
        const res = await fetch(
          `/api/game/questions?roomId=${roomId}&visitorId=${visitorId}`
        );

        if (!res.ok) {
          console.error("Failed to fetch questions");
          return;
        }

        const data = await res.json();
        console.log("Raw API response:", data);

        if (!data?.questions?.length) {
          console.error("No questions found");
          return;
        }

        const row = data.questions[0];

        const blocks = [
          row.question1,
          row.question2,
          row.question3,
          row.question4,
          row.question5,
        ].filter(Boolean);

        const formatted: Question[] = blocks.map(
          (q: any, index: number) => ({
            id: `${row.id}-${index}`,
            question: q.question,
            choices: [
              q.choice1,
              q.choice2,
              q.choice3,
              q.choice4,
            ],
            correctChoiceKey: q.correct_choice,
          })
        );

        setQuestions(formatted);
        setPhase("guessing");
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [roomId, visitorId]);

  // Auto scroll when answer selected
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guessed]);

  const currentIndex = guessed.length;
  const currentQ = questions[currentIndex];

  const shuffledOptions = useMemo(() => {
    if (!currentQ) return [];
    return shuffleArray(currentQ.choices);
  }, [currentQ]);

  const handleGuess = (option: string) => {
    if (!currentQ) return;

    const correctIndex =
      currentQ.correctChoiceKey === "choice1"
        ? 0
        : currentQ.correctChoiceKey === "choice2"
        ? 1
        : currentQ.correctChoiceKey === "choice3"
        ? 2
        : 3;

    const correctAnswer = currentQ.choices[correctIndex];

    const isCorrect = option === correctAnswer;

    const newGuessed = [
      ...guessed,
      {
        question: currentQ,
        selected: option,
        correct: isCorrect,
      },
    ];

    setGuessed(newGuessed);

    if (newGuessed.length === QUESTION_COUNT) {
      setTimeout(() => setPhase("finished"), 600);
    }
  };

  // --------------------------
  // LOADING
  // --------------------------

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!questions.length) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          No questions available.
        </p>
      </main>
    );
  }

  // --------------------------
  // GUESSING
  // --------------------------

  if (phase === "guessing") {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-xl space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="text-primary" />
            Guess Your Partner's Answers
          </h1>

          {/* Previous answers */}
          {guessed.map((item, i) => (
            <div
              key={`${item.question.id}-${i}`}
              className="rounded-xl border bg-card p-6 space-y-3 shadow-sm"
            >
              <h2 className="font-semibold">
                {item.question.question}
              </h2>
              <p
                className={
                  item.correct
                    ? "text-primary"
                    : "text-destructive"
                }
              >
                Your Guess: {item.selected}
              </p>
            </div>
          ))}

          {/* Current question */}
          {currentIndex < QUESTION_COUNT && currentQ && (
            <div className="rounded-xl border-2 border-primary bg-card p-6 space-y-6 shadow-md">
              <h2 className="text-xl font-semibold">
                {currentQ.question}
              </h2>

              <div className="space-y-3">
                {shuffledOptions.map((opt, idx) => (
                  <Button
                    key={`${currentQ.id}-${idx}`}
                    variant="outline"
                    onClick={() => handleGuess(opt)}
                    className="w-full"
                  >
                    {opt}
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
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold">
          Finished!
        </h1>
        <p>
          You scored {score}/{QUESTION_COUNT}
        </p>
      </div>
    </main>
  );
}
