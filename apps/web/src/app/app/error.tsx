"use client";
import { ErrorState } from "@/components/ui";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      error={
        new Error(
          "The workspace could not load. Check the API connection and retry.",
        )
      }
      retry={reset}
    />
  );
}
