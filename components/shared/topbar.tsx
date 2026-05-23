"use client";

import { Bell, Menu } from "lucide-react";
import { User } from "@/features/user/types";
import { useSidebar } from "@/contexts/sidebar-context";


function getInitials(user: User) {
  return (user.email || user.id || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface TopbarProps {
  user: User;
}

export function Topbar({ user }: TopbarProps) {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 flex items-center gap-3 px-4 md:px-6 bg-background/80 backdrop-blur-md border-b border-border/60 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0" />

      <div className="flex items-center gap-1">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
        <div className="ml-1 flex items-center gap-2 px-2 py-1.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary">
            {getInitials(user)}
          </div>
        </div>
      </div>
    </header>
  );
}