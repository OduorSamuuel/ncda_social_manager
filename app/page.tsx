"use client";

import { Button } from "@/components/ui/button";
import { notifications } from "@mantine/notifications";
import { CheckIcon, XIcon } from "lucide-react";

export default function Home() {
  const showError = () =>
    notifications.show({
      title: "Bummer!",
      message: "Something went wrong",
      color: "red",
      icon: <XIcon size={16} />,
    });

  const showSuccess = () =>
    notifications.show({
      title: "All good!",
      message: "Everything is fine",
      color: "teal",
      icon: <CheckIcon size={16} />,
    });

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16" />

        <div className="flex gap-4">
          <Button onClick={showError} variant="destructive">
            Show Error Toast
          </Button>
          <Button onClick={showSuccess}>
            Show Success Toast
          </Button>
        </div>
      </div>
    </main>
  );
}