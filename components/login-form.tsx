"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success,setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSuccess("Successfully signed in!");
      const redirectTo = searchParams.get("redirectTo") || "/";

      setTimeout(() => {
    router.push(redirectTo);
  }, 1000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col justify-center px-10 py-14 bg-background w-full md:max-w-md", className)} {...props}>
      <div className="mb-10">
        <span className="text-xs font-semibold tracking-widest uppercase text-primary">Postify</span>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-8">Enter your credentials to continue</p>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline underline-offset-4">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

{success && <p className="text-sm text-primary">{success}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full rounded-full mt-1" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

  



   
    </div>
  );
}