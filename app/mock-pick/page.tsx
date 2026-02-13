"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Trophy, Trash2, X, Loader2 } from "lucide-react";

const QUESTION_COUNT = 5;
const POLL_INTERVAL = 2000; // Poll every 2 seconds

type Question = {
  question: string;
  correct: string;
  wrong1: string;
  wrong2: string;
  wrong3: string;
};

type Answered = {
  question: Question;
  selected: string;
  correct: boolean;
};

export default function RoomDemoPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams?.get("roomId") || "demo-room";
  const playerId = searchParams?.get("playerId") || "demo-player";

  const [phase, setPhase] = useState<"setup" | "answering" | "finished">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerReady, setPartnerReady] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: "",
    correct: "",
    wrong1: "",
    wrong2: "",
    wrong3: "",
  });

  const [answered, setAnswered] = useState<Answered[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll when new question appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answered]);

  // Poll for game state when player is finished
  useEffect(() => {
    if (!isFinished) return;

    const pollGameState = async () => {
      try {
        const response = await fetch(
          `/api/game/status?roomId=${roomId}&playerId=${playerId}`
        );
        const data = await response.json();

        if (data.partnerReady) {
          setPartnerReady(true);
          // Both players ready, transition to answering phase
          setPhase("answering");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
        }
      } catch (error) {
        console.error("Error polling game state:", error);
      }
    };

    // Initial poll
    pollGameState();

    // Set up polling
    pollingRef.current = setInterval(pollGameState, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isFinished, roomId, playerId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleFinishSetup = async () => {
    if (questions.length !== QUESTION_COUNT) return;

    setIsLoading(true);

    try {
      const formattedQuestions = questions.map((q) => ({
        question: q.question,
        choice1: q.correct,
        choice2: q.wrong1,
        choice3: q.wrong2,
        choice4: q.wrong3,
        correct_choice: "choice1", // since correct is first
      }));

      const response = await fetch("/api/questions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          questions: formattedQuestions,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save questions");
        return;
      }

      setIsFinished(true);
    } catch (error) {
      console.error("Error saving questions:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // --------------------------
  // SETUP PHASE
  // --------------------------

  if (phase === "setup") {
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
        // Update existing question
        const updatedQuestions = [...questions];
        updatedQuestions[editingIndex] = currentQuestion;
        setQuestions(updatedQuestions);
        setEditingIndex(null);
      } else {
        // Add new question
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
        setCurrentQuestion({
          question: "",
          correct: "",
          wrong1: "",
          wrong2: "",
          wrong3: "",
        });
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

          {/* Added Questions Stack */}
          {questions.map((q, i) => (
            <div
              key={i}
              onClick={() => editQuestion(i)}
              className={`rounded-xl border bg-card p-4 space-y-2 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 cursor-pointer transition-all ${
                editingIndex === i
                  ? "border-primary border-2 bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Question {i + 1}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteQuestion(i);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-foreground">{q.question}</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>✓ {q.correct}</p>
                <p>✗ {q.wrong1}</p>
                <p>✗ {q.wrong2}</p>
                <p>✗ {q.wrong3}</p>
              </div>
            </div>
          ))}

          {/* Input Form */}
          <div className="rounded-xl border-2 border-primary bg-card p-6 space-y-4 shadow-md">
            <p className="text-sm font-semibold text-primary uppercase">
              {editingIndex !== null
                ? `Editing Question ${editingIndex + 1}`
                : `Question ${questions.length + 1}`}
            </p>
            <Input
              placeholder="Question"
              value={currentQuestion.question}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, question: e.target.value })
              }
              disabled={questions.length === QUESTION_COUNT}
            />
            <Input
              placeholder="Correct Answer"
              value={currentQuestion.correct}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, correct: e.target.value })
              }
              disabled={questions.length === QUESTION_COUNT}
            />
            <Input
              placeholder="Wrong Option 1"
              value={currentQuestion.wrong1}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, wrong1: e.target.value })
              }
              disabled={questions.length === QUESTION_COUNT}
            />
            <Input
              placeholder="Wrong Option 2"
              value={currentQuestion.wrong2}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, wrong2: e.target.value })
              }
              disabled={questions.length === QUESTION_COUNT}
            />
            <Input
              placeholder="Wrong Option 3"
              value={currentQuestion.wrong3}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, wrong3: e.target.value })
              }
              disabled={questions.length === QUESTION_COUNT}
            />

            {questions.length < QUESTION_COUNT && (
              <div className="flex gap-3">
                <Button onClick={addQuestion} className="flex-1">
                  {editingIndex !== null ? "Update Question" : "Add Question"}
                </Button>
                {editingIndex !== null && (
                  <Button onClick={cancelEdit} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>

          {questions.length === QUESTION_COUNT && !isFinished && (
            <div className="rounded-xl border border-primary/50 bg-primary/5 p-4 space-y-4">
              <p className="text-sm text-foreground">
                All questions created! Click "Finish" to submit and wait for your partner.
              </p>
              <Button
                onClick={handleFinishSetup}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Finish
              </Button>
            </div>
          )}

          {isFinished && !partnerReady && (
            <div className="rounded-xl border border-primary/50 bg-primary/5 p-4 space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Waiting for your partner to finish...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}

          <Button
            disabled={questions.length !== QUESTION_COUNT}
            onClick={() => setPhase("answering")}
            className="w-full"
          >
            Start Answering
          </Button>
        </div>
      </main>
    );
  }

  // --------------------------
  // ANSWERING PHASE (STACKED)
  // --------------------------

  if (phase === "answering") {
    const currentIndex = answered.length;
    const currentQ = questions[currentIndex];

    const handleAnswer = (option: string) => {
      const isCorrect = option === currentQ.correct;

      const newAnswered = [
        ...answered,
        { question: currentQ, selected: option, correct: isCorrect },
      ];

      setAnswered(newAnswered);

      if (newAnswered.length === QUESTION_COUNT) {
        setTimeout(() => setPhase("finished"), 800);
      }
    };

    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-xl space-y-6">

          {/* Previously Answered Questions */}
          {answered.map((item, i) => (
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
                Your Answer: {item.selected}
              </p>

              {!item.correct && (
                <p className="text-sm text-muted-foreground">
                  Correct Answer: {item.question.correct}
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
                      onClick={() => handleAnswer(opt)}
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

  const score = answered.filter((a) => a.correct).length;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-6 animate-in fade-in duration-700">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">
          Finished!
        </h1>
        <p className="text-muted-foreground">
          You scored {score}/{QUESTION_COUNT}
        </p>
        <Button onClick={() => window.location.reload()}>
          Play Again
        </Button>
      </div>
    </main>
  );
}
