
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/shared/topbar";
import { Sidebar } from "@/components/shared/sidebar";
import { SidebarProvider } from "@/contexts/sidebar-context";



async function getUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/auth/login");
  return data.user;
}

async function getUserRole(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles") // Update with your actual profiles table name
    .select("role")
    .eq("id", userId)
    .single();
  
  return profile?.role === "admin" ? "admin" : "user";
}

interface Props {
  searchParams: Promise<{ page?: string; cursor?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const [user, { page, cursor }] = await Promise.all([
    getUser(),
    searchParams,
  ]);
  
  // Fetch user role
  const role = await getUserRole(user.id);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar user={user} role={role} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                Loading posts…
              </div>
            }
          >
           {/* <PostsPage page={page} cursor={cursor} /> */}
          </Suspense>
        </main>
      </div>
    </div>
    </SidebarProvider>
  );
}