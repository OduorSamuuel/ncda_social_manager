"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Role = "admin" | "user";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  
}

/**
 * Returns the current authenticated user with their role.
 * Redirects to /auth/login if not authenticated.
 * Use this in page files and anywhere you need the current user.
 */
export async function getUser(): Promise<SessionUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  const userId = data.claims.sub as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return {
    id: userId,
    email: data.claims.email as string,
    role: (profile?.role === "admin" ? "admin" : "user") as Role,
  
  };
}

/**
 * Same as getUser but throws if the user is not an admin.
 * Use this at the top of admin-only server actions.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getUser();
  if (user.role !== "admin") throw new Error("Forbidden: admin access required");
  return user;
}

/**
 * Append an audit log entry for a draft action.
 */
export async function logAudit(
  draftId: string,
  action: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const user = await getUser();
  const supabase = await createClient();

  await supabase.from("audit_logs").insert({
    draft_id: draftId,
    user_id: user.id,
    action,
    meta,
  });
}