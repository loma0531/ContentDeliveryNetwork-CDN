"use client";

import React from "react";
import { ErrorPage } from "./ErrorPage";
import { ServerCrash } from "lucide-react";

export function InternalServerErrorPage() {
  return (
    <ErrorPage
      statusCode={500}
      title="Internal Server Error"
      message="Sorry, something went wrong on our end. We are working to fix it."
      icon={<ServerCrash className="h-16 w-16" />}
    />
  );
}
