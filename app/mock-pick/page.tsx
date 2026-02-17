import { Suspense } from "react";
import MockPickClient from "./MockPickClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <MockPickClient />
    </Suspense>
  );
}
