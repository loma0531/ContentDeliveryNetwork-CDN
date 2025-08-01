"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface ErrorPageProps {
  statusCode: number;
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export function ErrorPage({
  statusCode,
  title,
  message,
  icon,
}: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <div className="mb-4 text-primary">{icon}</div>
      <h1 className="text-6xl font-bold text-primary">{statusCode}</h1>
      <h2 className="text-2xl font-semibold mt-4">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md">{message}</p>
      <Button asChild className="mt-8">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Go back to Home
        </Link>
      </Button>
    </div>
  );
}
