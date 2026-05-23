"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutList,
  PenLine,
  Calendar,
  BarChart2,
  LogOut,
  Inbox,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";


function buildNavItems(role: "admin" | "user") {
  const isAdmin = role === "admin";
  return [
    {
      section: "Manage",
      links: [
        ...(isAdmin
          ? [{ href: "/", label: "Posts", icon: LayoutList, badge: "12" }]
          : []),
        { href: "/posts/new", label: "Create post", icon: PenLine },
        {
          href: "/drafts",
          label: isAdmin ? "Draft queue" : "My drafts",
          icon: Inbox,
          badge: isAdmin ? "·" : undefined,
        },
        ...(isAdmin
          ? [
              {
                href: "/scheduled",
                label: "Scheduled",
                icon: Calendar,
                badge: "3",
              },
            ]
          : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            section: "Insights",
            links: [{ href: "/analytics", label: "Analytics", icon: BarChart2 }],
          },
        ]
      : []),
  ];
}

interface MobileNavInnerProps {
  role: "admin" | "user";
}

function MobileNavInner({ role }: MobileNavInnerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navItems = buildNavItems(role);
  const allLinks = navItems.flatMap((s) => s.links);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const pageTitle =
    allLinks.find(
      (l) =>
        pathname === l.href ||
        (l.href !== "/" && pathname.startsWith(l.href))
    )?.label ?? "Dashboard";

  return (
    <header className="md:hidden h-14 flex items-center gap-3 px-4 border-b border-border bg-background shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu size={20} />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 flex flex-col">
          <div className="h-14 flex items-center px-5 border-b border-border shrink-0">
            <span className="text-sm font-semibold tracking-widest uppercase text-primary">
              Postify
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {navItems.map((section) => (
              <div key={section.section}>
                <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground px-2 mb-1.5">
                  {section.section}
                </p>
                <ul className="space-y-0.5">
                  {section.links.map(({ href, label, icon: Icon, badge }) => {
                    const active =
                      pathname === href ||
                      (href !== "/" && pathname.startsWith(href));
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                       
                      
                          className={cn(
                            "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                            active
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon size={16} />
                          <span className="flex-1">{label}</span>
                          {badge && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] h-4 px-1.5",
                                active && "bg-primary/20 text-primary"
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

          <div className="px-3 pb-5 shrink-0">
            <div className="h-px bg-border/60 mb-3" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut size={16} className="shrink-0" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <span className="text-sm font-semibold tracking-widest uppercase text-primary">
        Postify
      </span>
      <span className="text-sm text-muted-foreground ml-1">· {pageTitle}</span>
    </header>
  );
}

interface MobileNavProps {
  role: "admin" | "user";
}

export function MobileNav({ role }: MobileNavProps) {
  return (
    <Suspense
      fallback={
        <header className="md:hidden h-14 flex items-center gap-3 px-4 border-b border-border bg-background shrink-0">
          <span className="text-sm font-semibold tracking-widest uppercase text-primary">
            Postify
          </span>
        </header>
      }
    >
      <MobileNavInner role={role} />
    </Suspense>
  );
}