
import { Suspense } from "react";


import { Topbar } from "@/components/shared/topbar";
import { Sidebar } from "@/components/shared/sidebar";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { getUser, getUserRole } from "@/features/user/actions";
import PostsPage from "@/features/posts/post-page";




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
            <PostsPage page={page} cursor={cursor} /> 
          </Suspense>
        </main>
      </div>
    </div>
    </SidebarProvider>
  );
}