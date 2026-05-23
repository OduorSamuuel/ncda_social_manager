import { Sidebar } from '@/components/shared/sidebar';
import { Topbar } from '@/components/shared/topbar';
import { SidebarProvider } from '@/contexts/sidebar-context';

import { getUser, getUserRole } from '@/features/user/actions';
import React, { Suspense } from 'react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const role = await getUserRole(user.id);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar user={user} role={role} />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}