"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const QUESTION_COUNT = 5;

type Question = {
  question: string;
  correct: string;
  wrong1: string;
  wrong2: string;
  wrong3: string;
};

export default function MockPickClient({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question>({
    question: "",
    correct: "",
    wrong1: "",
    wrong2: "",
    wrong3: "",
  });
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    if (
      !current.question ||
      !current.correct ||
      !current.wrong1 ||
      !current.wrong2 ||
      !current.wrong3
    )
      return;

    setQuestions([...questions, current]);

    setCurrent({
      question: "",
      correct: "",
      wrong1: "",
      wrong2: "",
      wrong3: "",
    });
  };

  const handleSubmit = async () => {
    if (questions.length !== QUESTION_COUNT) return;

    setLoading(true);

    const res = await fetch("/api/questions/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, questions }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(`/mock-guess?roomId=${roomId}`);
    }
  };

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold">
          Create {QUESTION_COUNT} Questions
        </h1>

        {questions.map((q, i) => (
          <div key={i} className="border p-4 rounded">
            <p className="font-semibold">{q.question}</p>
            <p>✓ {q.correct}</p>
            <p>✗ {q.wrong1}</p>
            <p>✗ {q.wrong2}</p>
            <p>✗ {q.wrong3}</p>
          </div>
        ))}

        {questions.length < QUESTION_COUNT && (
          <div className="space-y-3 border p-6 rounded">
            <Input
              placeholder="Question"
              value={current.question}
              onChange={(e) =>
                setCurrent({ ...current, question: e.target.value })
              }
            />
            <Input
              placeholder="Correct Answer"
              value={current.correct}
              onChange={(e) =>
                setCurrent({ ...current, correct: e.target.value })
              }
            />
            <Input
              placeholder="Wrong 1"
              value={current.wrong1}
              onChange={(e) =>
                setCurrent({ ...current, wrong1: e.target.value })
              }
            />
            <Input
              placeholder="Wrong 2"
              value={current.wrong2}
              onChange={(e) =>
                setCurrent({ ...current, wrong2: e.target.value })
              }
            />
            <Input
              placeholder="Wrong 3"
              value={current.wrong3}
              onChange={(e) =>
                setCurrent({ ...current, wrong3: e.target.value })
              }
            />

            <Button onClick={addQuestion}>
              Add Question
            </Button>
          </div>
        )}

        {questions.length === QUESTION_COUNT && (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        )}
      </div>
    </main>
  );
}
