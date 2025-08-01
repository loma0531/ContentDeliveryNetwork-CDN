"use client";

import React from "react";
import { ErrorPage } from "./ErrorPage";
import { FileQuestion } from "lucide-react";

export function NotFoundPage() {
  return (
    <ErrorPage
      statusCode={404}
      title="Page Not Found"
      message="Sorry, the page you are looking for does not exist or has been moved."
      icon={<FileQuestion className="h-16 w-16" />}
    />
  );
}
