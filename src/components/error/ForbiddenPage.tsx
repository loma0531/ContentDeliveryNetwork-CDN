"use client";

import React from "react";
import { ErrorPage } from "./ErrorPage";
import { ShieldOff } from "lucide-react";

export function ForbiddenPage() {
  return (
    <ErrorPage
      statusCode={403}
      title="Access Forbidden"
      message="Sorry, you do not have permission to access this page."
      icon={<ShieldOff className="h-16 w-16" />}
    />
  );
}
