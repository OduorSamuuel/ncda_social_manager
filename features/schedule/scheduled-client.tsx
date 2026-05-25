"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus, CalendarDays, List, ChevronLeft, ChevronRight,
  Send, Trash2, Edit, Clock, AlertCircle, Loader2, ImageIcon, FileText, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScheduledPost } from "./types";
import { cancelScheduledPost, publishNow } from "./actions";




interface Props {
  initialPosts: ScheduledPost[];
  error: string | null;
}

type View = "calendar" | "list";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const MEDIA_ICONS = {
  photo: ImageIcon,
  video: Video,
  text: FileText,
};

// ─── Post action row ──────────────────────────────────────────────────────────
function PostActions({
  post,
  onAction,
}: {
  post: ScheduledPost;
  onAction: (action: "publish" | "cancel", id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<"publish" | "cancel" | null>(null);

  const handle = async (action: "publish" | "cancel") => {
    setLoading(action);
    await onAction(action, post.id);
    setLoading(null);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] gap-1 text-primary hover:text-primary"
        disabled={!!loading}
        onClick={() => handle("publish")}
      >
        {loading === "publish" ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
        Publish now
      </Button>
      <Link href={`/posts/${post.id}/edit`}>
        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1">
          <Edit size={11} /> Edit
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive"
        disabled={!!loading}
        onClick={() => handle("cancel")}
      >
        {loading === "cancel" ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
        Cancel
      </Button>
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────
function CalendarView({
  posts,
  onAction,
}: {
  posts: ScheduledPost[];
  onAction: (action: "publish" | "cancel", id: string) => Promise<void>;
}) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  const prev = () => setCursor(new Date(year, month - 1, 1));
  const next = () => setCursor(new Date(year, month + 1, 1));

  const postsByDay: Record<number, ScheduledPost[]> = {};
  for (const p of posts) {
    const d = new Date(p.scheduledFor);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      (postsByDay[day] ??= []).push(p);
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedPosts = selectedDay ? (postsByDay[selectedDay] ?? []) : [];

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prev}><ChevronLeft size={15} /></Button>
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <Button variant="ghost" size="sm" onClick={next}><ChevronRight size={15} /></Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const hasPosts = day !== null && (postsByDay[day]?.length ?? 0) > 0;
          const isToday = day !== null && isSameDay(new Date(year, month, day), today);
          const isSelected = day === selectedDay;

          return (
            <button
              key={i}
              disabled={day === null}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              className={cn(
                "relative aspect-square rounded-lg flex flex-col items-center justify-start pt-1.5 text-xs transition-colors",
                day === null ? "invisible" : "hover:bg-muted",
                isSelected && "bg-primary/10 ring-1 ring-primary",
                isToday && !isSelected && "ring-1 ring-border"
              )}
            >
              <span className={cn(
                "w-5 h-5 flex items-center justify-center rounded-full text-[11px]",
                isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
              )}>
                {day}
              </span>
              {hasPosts && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-0.5">
                  {(postsByDay[day!] ?? []).slice(0, 3).map((p) => (
                    <div key={p.id} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ))}
                  {(postsByDay[day!]?.length ?? 0) > 3 && (
                    <span className="text-[8px] text-muted-foreground">+{(postsByDay[day!]?.length ?? 0) - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day posts */}
      {selectedDay !== null && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs font-medium text-foreground">
            {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            <span className="text-muted-foreground ml-2">
              {selectedPosts.length} post{selectedPosts.length !== 1 ? "s" : ""}
            </span>
          </p>
          {selectedPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No posts scheduled this day.</p>
          ) : (
            selectedPosts.map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <div className="flex items-start gap-2">
                  <Clock size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">{formatTime(p.scheduledFor)}</p>
                    <p className="text-xs text-foreground line-clamp-2 mt-0.5">{p.content}</p>
                  </div>
                </div>
                <PostActions post={p} onAction={onAction} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────
function ListView({
  posts,
  onAction,
}: {
  posts: ScheduledPost[];
  onAction: (action: "publish" | "cancel", id: string) => Promise<void>;
}) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays size={28} className="text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">No scheduled posts</p>
        <p className="text-xs text-muted-foreground mb-4">Posts you schedule will appear here.</p>
        <Button size="sm" asChild>
          <Link href="/posts/create"><Plus size={13} className="mr-1" />Create post</Link>
        </Button>
      </div>
    );
  }

  // Group by date
  const groups: Record<string, ScheduledPost[]> = {};
  for (const p of posts) {
    const key = new Date(p.scheduledFor).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    (groups[key] ??= []).push(p);
  }

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([dateLabel, dayPosts]) => (
        <div key={dateLabel}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{dateLabel}</p>
          <div className="space-y-2">
            {dayPosts.map((p) => {
              const MediaIcon = MEDIA_ICONS[p.mediaType];
              return (
                <div key={p.id} className="flex gap-3 bg-background rounded-xl border border-border p-3">
                  {/* Thumbnail or icon */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                    {p.mediaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.mediaUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <MediaIcon size={18} className="text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                        <Clock size={11} /> {formatTime(p.scheduledFor)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
                        Scheduled
                      </span>
                      {p.mediaUrls && p.mediaUrls.length > 1 && (
                        <span className="text-[10px] text-muted-foreground">{p.mediaUrls.length} photos</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">{p.content}</p>
                    <PostActions post={p} onAction={onAction} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ScheduledClient({ initialPosts, error }: Props) {
  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts);
  const [view, setView] = useState<View>("list");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = async (action: "publish" | "cancel", id: string) => {
    setActionError(null);
    try {
      if (action === "publish") await publishNow(id);
      else await cancelScheduledPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

// Replace the entire return(...) with:

  return (
    <div className="flex flex-col h-full">
      {/* Slim action bar — stateful controls only */}
      <div className="flex items-center gap-3 px-4 md:px-6 h-12 border-b border-border bg-background/60 shrink-0">
        {/* Post count */}
        <span className="text-xs text-muted-foreground flex-1">
          {posts.length} post{posts.length !== 1 ? "s" : ""} queued
        </span>

        {/* View toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {([["list", List], ["calendar", CalendarDays]] as const).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                view === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={13} />
              <span className="hidden sm:inline capitalize">{v}</span>
            </button>
          ))}
        </div>

        <Button size="sm" className="gap-1.5 rounded-full shrink-0" asChild>
          <Link href="/posts/create">
            <Plus size={14} /> New post
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
        {(error || actionError) && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
            <AlertCircle size={15} className="shrink-0" />
            {error ?? actionError}
          </div>
        )}

        {view === "calendar" ? (
          <div className="max-w-lg mx-auto bg-background rounded-xl border border-border p-4">
            <CalendarView posts={posts} onAction={handleAction} />
          </div>
        ) : (
          <ListView posts={posts} onAction={handleAction} />
        )}
      </div>
    </div>
  );
}