import { Suspense } from "react";
import MockGuessClient from "./MockGuessClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MockGuessClient />
    </Suspense>
  );
}
