"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess("Password set! Redirecting...");
      setTimeout(() => router.push("/"), 1000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-center px-10 py-14 bg-background w-full md:max-w-md",
        className
      )}
      {...props}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold tracking-widest uppercase text-primary">
          Postify
        </span>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Set your password
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Choose a secure password to activate your account
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-1.5">
          <Label
            htmlFor="password"
            className="text-xs uppercase tracking-widest text-muted-foreground"
          >
            New Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter new password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <Label
            htmlFor="confirm"
            className="text-xs uppercase tracking-widest text-muted-foreground"
          >
            Confirm Password
          </Label>
          <Input
            id="confirm"
            type="password"
            placeholder="Repeat new password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {success && <p className="text-sm text-primary">{success}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full rounded-full mt-1"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Set Password"}
        </Button>
      </form>
    </div>
  );
}