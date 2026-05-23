"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutList, PenLine, Calendar, BarChart2,
  LogOut, Inbox, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/features/user/types";
import { useSidebar } from "@/contexts/sidebar-context";


function buildNavItems(role: "admin" | "user") {
  const isAdmin = role === "admin";
  return [
    {
      section: "Manage",
      links: [
        ...(isAdmin ? [{ href: "/", label: "Posts", icon: LayoutList, badge: "12" }] : []),
        { href: "/posts/create", label: "Create post", icon: PenLine },
        {
          href: "/drafts",
          label: isAdmin ? "Draft queue" : "My drafts",
          icon: Inbox,
          badge: isAdmin ? "·" : undefined,
        },
        ...(isAdmin ? [{ href: "/scheduled", label: "Scheduled", icon: Calendar, badge: "3" }] : []),
      ],
    },
    ...(isAdmin ? [{ section: "Insights", links: [{ href: "/analytics", label: "Analytics", icon: BarChart2 }] }] : []),
  ];
}

function getInitials(user: User) {
  return (user.email || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getDisplayName(user: User) {
  return user.email || "User";
}

interface NavContentProps {
  user: User;
  role: "admin" | "user";
  collapsed?: boolean;
  onNavigate?: () => void;
}

function NavContent({ user, role, collapsed = false, onNavigate }: NavContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = buildNavItems(role);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {/* User card */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-muted/60 border border-border/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
            {getInitials(user)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-none mb-0.5">
              {getDisplayName(user)}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-none">
              {role === "admin" ? "Admin" : "Contributor"}
            </p>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center mt-4 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary">
            {getInitials(user)}
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navItems.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 px-3 mb-2">
                {section.section}
              </p>
            )}
            <ul className="space-y-1">
              {section.links.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        collapsed && "justify-center px-2",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon size={18} className={cn("shrink-0", active ? "opacity-100" : "opacity-70")} />
                      {!collapsed && <span className="flex-1 tracking-[-0.01em]">{label}</span>}
                      {!collapsed && badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[11px] h-5 px-1.5 font-semibold rounded-full",
                            active ? "bg-white/20 text-primary-foreground border-0" : "bg-muted-foreground/10 text-muted-foreground"
                          )}
                        >
                          {badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-2 pb-5 shrink-0">
        <div className="h-px bg-border/60 mb-3" />
        <button
          onClick={handleLogout}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut size={18} className="shrink-0 opacity-70" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </>
  );
}

interface SidebarProps {
  user: User;
  role: "admin" | "user";
}

export function Sidebar({ user, role }: SidebarProps) {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-border/60 bg-background h-screen sticky top-0 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo + collapse toggle */}
        <div className="h-16 flex items-center border-b border-border/60 shrink-0 px-3 justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <PenLine size={14} className="text-primary-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">Postify</span>
            </div>
          )}
          <button
            onClick={toggle}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <Suspense fallback={<div className="flex-1" />}>
          <NavContent user={user} role={role} collapsed={collapsed} />
        </Suspense>
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-background border-r border-border/60 md:hidden transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-14 flex items-center px-4 border-b border-border/60 shrink-0 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <PenLine size={14} className="text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">Postify</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <Suspense fallback={<div className="flex-1" />}>
          <NavContent user={user} role={role} onNavigate={() => setMobileOpen(false)} />
        </Suspense>
      </aside>
    </>
  );
}