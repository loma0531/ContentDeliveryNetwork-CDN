"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ServerCrash, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <div className="mb-4 text-destructive">
        <ServerCrash className="h-16 w-16" />
      </div>
      <h1 className="text-6xl font-bold text-destructive">500</h1>
      <h2 className="text-2xl font-semibold mt-4">Internal Server Error</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        Sorry, something went wrong on our end. We are working to fix it. You can try to refresh the page or go back home.
      </p>
      <div className="flex gap-4 mt-8">
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
